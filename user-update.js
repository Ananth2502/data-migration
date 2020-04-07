const XLSX = require('xlsx');
const filePath1 = './data/user-role.csv';
const filePath2 = './data/user-business-function.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';
const { ObjectId } = require('mongoose').Types;

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook1 = XLSX.readFile(filePath1, { cellDates: true });
    let userRoles = XLSX.utils.sheet_to_json(workbook1.Sheets[workbook1.SheetNames[0]]);
    let workbook2 = XLSX.readFile(filePath2, { cellDates: true });
    let userBusinessRoles = XLSX.utils.sheet_to_json(workbook2.Sheets[workbook2.SheetNames[0]]);
    userBusinessRoles = userBusinessRoles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    let temp = {};
    let businessRoles = [];
    userBusinessRoles.map(role => {
      if (!role.FacilityID) role.FacilityID = 'default';
      if (!temp[`${role.UserId}_${role.FacilityID}_${role.BussinessFunction}`]) {
        temp[`${role.UserId}_${role.FacilityID}_${role.BussinessFunction}`] = true;
        role.RoleID = role.BussinessFunction;
        role.UserID = role.UserId;
        businessRoles.push(role);
      }
    })
    userRoles = [...userRoles, ...businessRoles];
    let users = await db.collection('users').find({ username: { $nin: ['devusers', 'jobuser', 'users'] } }).toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let roles = await db.collection('roles').find({ name: { $nin: ['superuser', 'job', 'employee'] } }).toArray();
    let roleIds = {};
    roles.forEach(role => {
      let tenantId = role.tenant_id ? role.tenant_id : 'default';
      if (role.role_id && !roleIds[role.role_id]) {
        roleIds[role.role_id] = { [tenantId]: role._id };
      } else {
        roleIds[role.role_id][tenantId] = role._id;
      }
    });
    let facilities = await db.collection('facility').find().toArray();
    let tenantIds = {};
    facilities.forEach(facility => {
      if (facility.facility_id) tenantIds[facility.facility_id] = facility.tenant_id;
    });
    let countries = await db.collection('country').find().toArray();
    let countryIds = {};
    countries.forEach(country => {
      if (country.name) countryIds[country.name] = country._id;
    });
    let userTenants = {};
    userRoles.forEach(userRole => {
      let tenantId = tenantIds[userRole.FacilityID];
      if (!userRole.FacilityID) tenantId = 'default';
      if (!userTenants[userIds[userRole.UserID]]) {
        userTenants[userIds[userRole.UserID]] = { [tenantId]: [roleIds[userRole.RoleID][tenantId]] };
      } else if (!userTenants[userIds[userRole.UserID]][tenantId]) {
        userTenants[userIds[userRole.UserID]][tenantId] = [roleIds[userRole.RoleID][tenantId]];
      } else {
        userTenants[userIds[userRole.UserID]][tenantId].push(roleIds[userRole.RoleID][tenantId]);
      }
    });
    await Promise.all(
      users.map(async user => {
        if (userTenants[user._id]) {
          let tenants = Object.keys(userTenants[user._id]);
          if (tenants.indexOf('default') != -1) tenants.splice(tenants.indexOf('default'), 1);
          tenants = tenants.map(tenant => {
            return ObjectId(tenant);
          })
          user.tenants = tenants;
          if (tenants.length) user.tenant_id = ObjectId(tenants[0]);
        }
        user.country = countryIds[user.country];
        user.roles = userTenants[user._id];
        await db.collection('users').update({ _id: user._id }, user);
      })
    );
    console.log('Users successfully updated');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;