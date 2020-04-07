const XLSX = require('xlsx');
const filePath = './data/patient-risk-factor.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let patientRiskfactors = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('patientRiskfactors--------------', patientRiskfactors);
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
    let riskfactors = await db.collection('riskfactor').find().toArray();
    let riskfactorIds = {};
    riskfactors.forEach(riskfactor => {
      if (riskfactor.riskfactor_id) riskfactorIds[riskfactor.riskfactor_id] = riskfactor._id;
    });
    patientRiskfactors = patientRiskfactors.map(patientRiskfactor => {
      return constructData(patientRiskfactor, userIds, patientIds, riskfactorIds, tenantIds);
    });
    // console.log('patientRiskfactors-------+++++-------', patientRiskfactors);
    await db.collection('patientriskfactor').insertMany(patientRiskfactors);
    console.log('Patient Risk factors created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, patientIds, riskfactorIds, tenantIds) => {
  return {
    patient_riskfactor_id: data.PatientRiskfactorID,
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    risk_id: riskfactorIds[data.RiskfactorID],
    other_risk: data.OtherRiskfactor ? data.OtherRiskfactor : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
  };
}

module.exports = main;