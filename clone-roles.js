const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let existingRoles = await db.collection('roles').find().toArray();
    let tenants = await db.collection('organizations').find().toArray();
    existingRoles = (await existingRoles).filter(existingRole => !['superuser', 'job', 'employee'].includes(existingRole.name));
    console.log('tenants-------------------', tenants.length);
    let tenantRoles = [];
    await Promise.all(
      await tenants.map(async tenant => {
        let roles = await existingRoles.map(role => ({ ...role, tenant_id: tenant._id && tenant._id.toString() }));
        // console.log('roles--------------', roles)
        tenantRoles = [...tenantRoles, ...roles];
      })
    );
    tenantRoles = tenantRoles.map(role => { delete role._id; return role; });
    // console.log('tenantRoles----------------', tenantRoles);
    await db.collection('roles').insertMany(tenantRoles);
    client.close()
    console.log('Roles cloned successfully');
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;