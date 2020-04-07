const XLSX = require('xlsx');
const filePath1 = './data/bplog-detail.csv';
const filePath2 = './data/enrollment-bplog.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook1 = XLSX.readFile(filePath1, { cellDates: true });
    let bplogDetails = XLSX.utils.sheet_to_json(workbook1.Sheets[workbook1.SheetNames[0]]);
    // console.log('bplogDetails--------------', bplogDetails);
    let workbook2 = XLSX.readFile(filePath2, { cellDates: true });
    let enrollments = XLSX.utils.sheet_to_json(workbook2.Sheets[workbook2.SheetNames[0]]);
    // console.log('\n\n\nenrollments---------------', enrollments);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let patients = await db.collection('patient').find().toArray();
    let patientIds = {};
    let enrolTenantIds = {};
    patients.forEach(patient => {
      if (patient.temp_id) patientIds[patient.temp_id] = patient._id;
      if (patient.temp_id) enrolTenantIds[patient.temp_id] = patient.tenant_id;
    });
    let bplogs = await db.collection('bplog').find().toArray();
    let bplogIds = {};
    let patientBplogIds = {};
    let tenantIds = {};
    bplogs.forEach(bplog => {
      if (bplog.bplog_id) bplogIds[bplog.bplog_id] = bplog._id;
      if (bplog.patient_id && bplog.type == 'Enrollment') patientBplogIds[bplog.patient_id] = bplog._id
      if (bplog.bplog_id) tenantIds[bplog.bplog_id] = bplog.tenant_id;
    });
    bplogDetails = bplogDetails.map(bplogDetail => {
      return constructData(bplogDetail, userIds, bplogIds, tenantIds);
    });
    let res = [];
    enrollments.forEach(enrollment => {
      if (enrollment.IsAvgReading == 'f')
        res.push(constructEnrollmentData(enrollment, userIds, patientBplogIds, patientIds, enrolTenantIds));
    });
    res = [...res, ...bplogDetails];
    // console.log('bplogs-------+++++++++-------', res);
    await db.collection('bplogdetail').insertMany(res);
    console.log('BP Log Details created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, bplogIds, tenantIds) => {
  return {
    bplog_detail_id: data.BPLogDetailID,
    bp_log_id: bplogIds[data.BPLogID],
    tenant_id: tenantIds[data.BPLogID] && tenantIds[data.BPLogID].toString(),
    systolic: data.Systolic ? data.Systolic : 0,
    diastolic: data.Diastolic ? data.Diastolic : 0,
    pulse: data.Pulse ? data.Pulse : 0,
    reading: data.BPLogSequence ? data.BPLogSequence : 0,
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
  };
}

const constructEnrollmentData = (data, userIds, patientBplogIds, patientIds, enrolTenantIds) => {
  return {
    bplog_detail_enrol_id: data.EnrollmentBPLogID,
    bp_log_id: patientBplogIds[patientIds[data.PatientID]],
    tenant_id: enrolTenantIds[data.PatientID] && enrolTenantIds[data.PatientID].toString(),
    systolic: data.Systolic ? data.Systolic : 0,
    diastolic: data.Diastolic ? data.Diastolic : 0,
    pulse: data.Pulse ? data.Pulse : 0,
    reading: data.ReadingNo ? data.ReadingNo : 0,
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    createdAt: data.CreatedDatetime
  };
}

module.exports = main;