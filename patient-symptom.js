const XLSX = require('xlsx');
const filePath = './data/patient-symptom.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let patientSymptoms = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('patientSymptoms----------------', patientSymptoms);
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
    let symptoms = await db.collection('symptom').find().toArray();
    let symptomIds = {};
    symptoms.forEach(symptom => {
      if (symptom.symptom_id) symptomIds[symptom.symptom_id] = symptom._id;
    });
    let bplogs = await db.collection('bplog').find().toArray();
    let bplogIds = {};
    bplogs.forEach(bplog => {
      if (bplog.bplog_id) bplogIds[bplog.bplog_id] = bplog._id;
    });
    patientSymptoms = patientSymptoms.map(patientSymptom => {
      return constructData(patientSymptom, userIds, patientIds, symptomIds, bplogIds, tenantIds);
    });
    // console.log('patientSymptoms--------+++++++++++--------', patientSymptoms);

    await db.collection('patientsymptoms').insertMany(patientSymptoms);
    console.log('Patient Symptoms created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, patientIds, symptomIds, bplogIds, tenantIds) => {
  return {
    patient_symptom_id: data.PatientSymptomID,
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    symptom_id: symptomIds[data.SymptomID],
    other_symptom: data.OtherSymptoms ? data.OtherSymptoms : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    bplog_id: bplogIds[data.BPLogID]
  };
}

module.exports = main;