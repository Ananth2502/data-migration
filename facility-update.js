const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let localAdmins = await db.collection('roles').find({ name: 'LOCAL_ADMIN' }).toArray();
    let redrisks = await db.collection('roles').find({ name: 'REDRISK_NOTIFICATION_CONTACT' }).toArray();
    let users = await db.collection('users').find().toArray();
    let localRoles = {};
    let redriskRoles = {};
    localAdmins.map(localAdmin => {
      if (!localAdmin.tenant_id) localAdmin.tenant_id = 'default';
      localRoles[localAdmin.tenant_id] = localAdmin._id;
    });
    redrisks.map(redrisk => {
      if (!redrisk.tenant_id) redrisk.tenant_id = 'default';
      redriskRoles[redrisk.tenant_id] = redrisk._id;
    });
    let facilities = await db.collection('facility').find().toArray();
    for (let i = 0; i < facilities.length; i++) {
      let localAdminUsers = [];
      let redriskUsers = [];
      for (let j = 0; j < users.length; j++) {
        if (users[j].roles[`${facilities[i].tenant_id}`]){
          users[j].roles[`${facilities[i].tenant_id}`] = users[j].roles[`${facilities[i].tenant_id}`].toString().split(/\s*,\s*/);
          if (users[j].roles[`${facilities[i].tenant_id}`].includes(localRoles[facilities[i].tenant_id].toString()))
            localAdminUsers.push(users[j]._id);
          if (users[j].roles[`${facilities[i].tenant_id}`].includes(redriskRoles[facilities[i].tenant_id].toString()))
            redriskUsers.push(users[j]._id);
        }
      }
      localAdminUsers = [...new Set(localAdminUsers)];
      redriskUsers = [...new Set(redriskUsers)];
      facilities[i].local_administrator_users = localAdminUsers.length ? localAdminUsers : [];
      facilities[i].redrisk_users = redriskUsers.length ? redriskUsers : [];
      await db.collection('facility').update({ _id: facilities[i]._id }, facilities[i]);
    }
    console.log('Facilities successfully updated');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;