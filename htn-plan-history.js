const XLSX = require('xlsx');
const filePath = './data/htn-plan-history.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let htnplanHisData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let htnplans = await db.collection('htnplan').find().toArray();
    let htnplanIds = {};
    htnplans.forEach(htnplan => {
      if (htnplan.htnplan_id) htnplanIds[htnplan.htnplan_id] = htnplan._id;
    });
    let bplogs = await db.collection('bplog').find().toArray();
    let bplogIds = {};
    bplogs.forEach(bplog => {
      if (bplog.bplog_id) bplogIds[bplog.bplog_id] = bplog._id;
    });
    let patients = await db.collection('patient').find().toArray();
    let patientIds = {};
    let tenantIds = {};
    patients.forEach(patient => {
      if (patient.temp_id) patientIds[patient.temp_id] = patient._id;
      if (patient.temp_id) tenantIds[patient.temp_id] = patient.tenant_id;
    });
    htnplanHisData = htnplanHisData.map(historyData => {
      return constructData(historyData, userIds, htnplanIds, bplogs, patientIds, tenantIds);
    });
    // console.log('htnplanHisData-----------------', htnplanHisData);
    await db.collection('htnplanhistory').insertMany(htnplanHisData);
    console.log('HTN plan History Data created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, htnplanIds, bplogs, patientIds, tenantIds) => {
  let bgCheckFrequency = data.BGCheckFrequency && data.BGCheckFrequency != '{}' ? data.BGCheckFrequency.replace(/[{}]/g, '').split(',') : [];
  let riskLevel = {
    1: 'Normal',
    2: 'Moderate',
    3: 'High',
    4: 'Critical',
    6: 'Higher moderate',
    7: 'Both moderate',
    8: 'Both higher moderate',
    9: 'Glucose moderate'
  };
  return {
    htnplan_history_id: data.HTNPlanHistoryID,
    htnplan_id: htnplanIds[data.HTNPlanID],
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    bplog_id: bplogs[data.BPLogID],
    medical_review_freq: data.MedicalReviewFreq ? data.MedicalReviewFreq : '',
    bp_freq: data.BpCheckFreq ? data.BpCheckFreq : '',
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    history_log_time: data.HistorylogTime ? data.HistorylogTime : '',
    tbp_systolic: data.TBPSystolic ? data.TBPSystolic : 0,
    tbp_diastolic: data.TBPDiastolic ? data.TBPDiastolic : 0,
    risk_level: riskLevel[data.PatientRiskLevel] ? riskLevel[data.PatientRiskLevel] : '',
    hba1c_freq: data.Hba1cFrequency ? data.Hba1cFrequency : '',
    bg_check_freq: bgCheckFrequency
  }
}

module.exports = main;