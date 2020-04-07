const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let existingTriggers = await db.collection('formtriggers').find().toArray();
    let tenants = await db.collection('organizations').find().toArray();
    let tenantTriggers = [];
    await Promise.all(
      await tenants.map(async tenant => {
        let triggers = existingTriggers.map(trigger => ({ ...trigger, tenant_id: tenant._id }));
        tenantTriggers = [...tenantTriggers, ...triggers];
      })
    );
    tenantTriggers = tenantTriggers.map(trigger => { delete trigger._id; return trigger; });
    // console.log('tenantTriggers----------------', tenantTriggers);
    await db.collection('formtriggers').insertMany(tenantTriggers);
    client.close()
    console.log('Triggers cloned successfully');
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;