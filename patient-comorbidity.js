const XLSX = require('xlsx');
const filePath = './data/patient-comorbidity.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let patientComorbidities = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let comorbidities = await db.collection('comorbidity').find().toArray();
    let comorbidityIds = {};
    comorbidities.forEach(comorbidity => {
      if (comorbidity.comorbidity_id) comorbidityIds[comorbidity.comorbidity_id] = comorbidity._id;
    });
    let patients = await db.collection('patient').find().toArray();
    let patientIds = {};
    let tenantIds = {};
    patients.forEach(patient => {
      if (patient.temp_id) patientIds[patient.temp_id] = patient._id;
      if (patient.temp_id) tenantIds[patient.temp_id] = patient.tenant_id;
    });
    patientComorbidities = patientComorbidities.map(patientComorbidity => {
      return constructData(patientComorbidity, userIds, comorbidityIds, patientIds, tenantIds);
    });
    // console.log('patientcomorbidity-----------------', patientComorbidities);
    await db.collection('patientcomorbidity').insertMany(patientComorbidities);
    console.log('Patient Comorbidities created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, comorbidityIds, patientIds, tenantIds) => {
  return {
    patient_comorbidity_id: data.PatientComorbidityID,
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    comorbidity_id: comorbidityIds[data.ComorbidityID],
    other_comorbidity: data.OtherComorbidity ? data.OtherComorbidity : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
  };
}

module.exports = main;