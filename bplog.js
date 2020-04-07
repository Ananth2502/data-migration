const XLSX = require('xlsx');
const filePath1 = './data/bplog.csv';
const filePath2 = './data/enrollment-bplog.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook1 = XLSX.readFile(filePath1, { cellDates: true });
    let bplogs = XLSX.utils.sheet_to_json(workbook1.Sheets[workbook1.SheetNames[0]]);
    // console.log('bplogs--------------', bplogs);
    let workbook2 = XLSX.readFile(filePath2, { cellDates: true });
    let enrollments = XLSX.utils.sheet_to_json(workbook2.Sheets[workbook2.SheetNames[0]]);
    // console.log('bplogs--------------', bplogs, '\n\n\nenrollments---------------', enrollments);
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
    bplogs = bplogs.map(bplog => {
      return constructData(bplog, userIds, patientIds, tenantIds);
    });
    let res = [];
    enrollments.forEach(enrollment => {
      if (enrollment.IsAvgReading == 't')
        res.push(constructEnrollmentData(enrollment, userIds, patientIds, tenantIds));
    });
    res = [...res, ...bplogs];
    // console.log('bplogs-------+++++++++-------', res);
    await db.collection('bplog').insertMany(res);
    console.log('BP Logs created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, patientIds, tenantIds) => {
  let riskLevel = {
    1: 'Low',
    2: 'Moderate',
    3: 'High'
  };
  return {
    bplog_id: data.BPLogID,
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    avg_systolic: data.AvgSystolic ? data.AvgSystolic: 0,
    avg_diastolic: data.AvgDiastolic ? data.AvgDiastolic: 0,
    avg_pulse: data.AvgPulse ? data.AvgPulse : 0,
    risk_level: riskLevel[data.RiskLevel] ? riskLevel[data.RiskLevel] : null,
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    is_latest: (data.IsLatest && data.IsLatest.toLowerCase() == 't') ? true : false,
    is_higher_moderate: (data.IsHigherModerate && data.IsHigherModerate.toLowerCase() == 't') ? true : false,
    type: 'bplog'
  };
}

const constructEnrollmentData = (data, userIds, patientIds, tenantIds) => {
  return {
    bplog_id: data.EnrollmentBPLogID,
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    avg_systolic: data.Systolic ? data.Systolic : 0,
    avg_diastolic: data.Diastolic ? data.Diastolic : 0,
    avg_pulse: data.Pulse ? data.Pulse : 0,
    risk_level: '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    is_latest: (data.IsLatest && data.IsLatest.toLowerCase() == 't') ? true : false,
    type: 'enrollment'
  };
}

module.exports = main;