const XLSX = require('xlsx');
const filePath = './data/patient-transfer-history.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let patientTransferHisData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('patientTransferHisData---------------', patientTransferHisData);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let facilities = await db.collection('facility').find().toArray();
    let facilityIds = {};
    facilities.forEach(facility => {
      if (facility.facility_id) facilityIds[facility.facility_id] = facility._id;
    });
    let patients = await db.collection('patient').find().toArray();
    let patientIds = {};
    let tenantIds = {};
    patients.forEach(patient => {
      if (patient.temp_id) patientIds[patient.temp_id] = patient._id;
      if (patient.temp_id) tenantIds[patient.temp_id] = patient.tenant_id;
    });
    let transfers = await db.collection('patienttransfer').find().toArray();
    let transferIds = {};
    transfers.forEach(transfer => {
      if (transfer.transfer_id) transferIds[transfer.transfer_id] = transfer._id;
    });
    patientTransferHisData = patientTransferHisData.map(transferHisoryData => {
      return constructData(transferHisoryData, userIds, facilityIds, patientIds, transferIds, tenantIds);
    });
    // console.log('patientTransferHisData--------+++++++++-------', patientTransferHisData);
    await db.collection('patienttransferhistory').insertMany(patientTransferHisData);
    console.log('Patient Transfer History Data created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, facilityIds, patientIds, transferIds, tenantIds) => {
  return {
    transfer_history_id: data.TransferHistoryID,
    transfer_id: transferIds[data.TransferID],
    transfer_reason: data.TransferReason ? data.TransferReason : '',
    transfer_to: userIds[data.TransferedTo],
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    transfer_facility_id: facilityIds[data.TransferedFacilityID],
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    transfer_status: data.TransferStatus ? data.TransferStatus : 0,
    reject_reason: data.RejectedReason ? data.RejectedReason : '',
    old_facility_id: facilityIds[data.PatientOldFacilityID],
    transfer_by: userIds[data.TransferedBy],
    history_date_time: data.HistoryDateTime ? data.HistoryDateTime : ''
  }
}

module.exports = main;