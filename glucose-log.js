const XLSX = require('xlsx');
const filePath = './data/glucose-log.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let glucoseLogs = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('glucoseLogs---------------', glucoseLogs);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let patients = await db.collection('patient').find().toArray();
    let patientIds = {};
    let tenantIds = {};
    patients.forEach(patient => {
      if (patient.temp_id) patientIds[patient.temp_id] = patient._id;
      if (patient.temp_id) tenantIds[patient.temp_id] = patient.tenant_id;
    });
    glucoseLogs = glucoseLogs.map(glucoseLog => {
      return constructData(glucoseLog, userIds, patientIds, tenantIds);
    });
    // console.log('glucoseLogs-------++++++++--------', glucoseLogs);
    await db.collection('glucoselog').insertMany(glucoseLogs);
    console.log('Counties created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, patientIds, tenantIds) => {
  return {
    glucose_log_id: data.GlucoseLogID,
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    rbs: data.RBS ? data.RBS : 0,
    fbs: data.FBS ? data.FBS : 0,
    hba1c: data.HbA1C ? data.HbA1C : 0,
    ogtt: data.OGTT ? data.OGTT : 0,
    post_meal: (data['2hrs_Post_Meal'] && data['2hrs_Post_Meal'] == 't') ? true : false,
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
  };
}

module.exports = main;