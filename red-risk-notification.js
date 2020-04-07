const XLSX = require('xlsx');
const filePath = './data/red-risk-notification.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let notifications = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('notifications----------------', notifications);
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
    let bplogs = await db.collection('bplog').find().toArray();
    let bplogIds = {};
    bplogs.forEach(bplog => {
      if (bplog.bplog_id) bplogIds[bplog.bplog_id] = bplog._id;
    });
    let facilities = await db.collection('facility').find().toArray();
    let facilityIds = {};
    facilities.forEach(facility => {
      if (facility.facility_id) facilityIds[facility.facility_id] = facility._id;
    });
    notifications = notifications.map(notification => {
      return constructData(notification, userIds, patientIds, bplogIds, facilityIds, tenantIds);
    });
    // console.log('notifications--------++++++++++--------', notifications);
    await db.collection('redrisknotification').insertMany(notifications);
    console.log('Red Risk Notifications created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, patientIds, bplogIds, facilityIds, tenantIds) => {
  return {
    red_risk_id: data.RedRiskNotifyID,
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    bp_log_id: bplogIds[data.BPLogID],
    status: data.Status ? Number(data.Status) : 0,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    facility_id: facilityIds[data.FacilityID]
  }
}

module.exports = main;