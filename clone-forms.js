const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let existingForms = await db.collection('formmetauis').find().toArray();
    let tenants = await db.collection('organizations').find().toArray();
    let tenantforms = [];
    await Promise.all(
      await tenants.map(async tenant => {
        let forms = await existingForms.map(form => ({
          ...form,
          tenant_id: tenant._id,
          form_meta_ui_id: form._id,
          delta: {},
          is_sequence_needed: false,
          is_parent_form: true
        }));
        tenantforms = [...tenantforms, ...forms];
      })
    );
    tenantforms = tenantforms.map(form => { 
      delete form.form_data;
      delete form.form_meta_data;
      delete form.encrypted_fields;
      delete form._id; 
      return form; 
    });
    // console.log('tenantforms----------------', tenantforms);
    await db.collection('tenantformmetauis').insertMany(tenantforms);
    client.close()
    console.log('Forms cloned successfully');
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;