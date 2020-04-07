const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';
const { ObjectId } = require('mongoose').Types;

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    // Get all roles except for default
    let roles = await db.collection('roles').find({ name: { $nin: ['superuser', 'job', 'employee'] } }).toArray();
    let roleIds = [];
    roles.map(role => roleIds.push(role._id.toString()));
    // Get all permissions except for those with default roles
    let permissions = await db.collection('permissions').find({ role_id: { $in: roleIds } }).toArray();
    let tenants = await db.collection('organizations').find({}).toArray();
    // console.log('Roles ---------->', roles.length, permissions.length, tenants.length);
    let permissionData = [];
    for (let t = 0; t < tenants.length; t++) {
      let orgId = tenants[t]._id;
      for (let r = 0; r < roles.length; r++) {
        let roleId = roles[r]._id;
        delete roles[r]._id;
        roles[r].tenant_id = tenants[t]._id;
        const role = await db.collection('roles').insertOne(roles[r]);
        for (let p = 0; p < permissions.length; p++) {
          if (permissions[p].role_id == roleId) {
            delete permissions[p]._id;
            permissions[p].role_id = role.ops[0]._id;
            permissions[p].tenant_id = ObjectId(orgId);
            permissionData.push(JSON.parse(JSON.stringify(permissions[p])));
          }
        }
      }
    }
    
    await db.collection('permissions').insertMany(permissionData);
    client.close()
    console.log('Roles and permissions cloned successfully');
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;