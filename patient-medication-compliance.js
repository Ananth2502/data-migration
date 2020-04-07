const XLSX = require('xlsx');
const filePath = './data/patient-medication-compliance.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let patientCompliances = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('patientCompliances-----------------', patientCompliances);
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
    let compliances = await db.collection('medicalcompliance').find().toArray();
    let complianceIds = {};
    compliances.forEach(compliance => {
      if (compliance.medical_compliance_id) complianceIds[compliance.medical_compliance_id] = compliance._id;
    });
    let bplogs = await db.collection('bplog').find().toArray();
    let bplogIds = {};
    bplogs.forEach(bplog => {
      if (bplog.bplog_id) bplogIds[bplog.bplog_id] = bplog._id;
    });
    patientCompliances = patientCompliances.map(patientCompliance => {
      return constructData(patientCompliance, userIds, patientIds, complianceIds, bplogIds, tenantIds);
    });
    // console.log('patientCompliances---------+++++++++--------', patientCompliances);
    await db.collection('patientmedicalcompliance').insertMany(patientCompliances);
    console.log('Patient Medication Compliance created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, patientIds, complianceIds, bplogIds, tenantIds) => {
  return {
    patient_med_compliance_id: data.PatientMedComplianceID,
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    compliance_id: complianceIds[data.MedicationComplianceID],
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    bplog_id: bplogIds[data.BPLogID],
    other_complaince: data.OtherMedicationCompliance ? data.OtherMedicationCompliance : ''
  }
}

module.exports = main;