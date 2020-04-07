const XLSX = require('xlsx');
const filePath = './data/patient-transfer.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let patientTransfers = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('patientTransfers---------------', patientTransfers);
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
    patientTransfers = patientTransfers.map(patientTransfer => {
      return constructData(patientTransfer, userIds, facilityIds, patientIds, tenantIds);
    });
    // console.log('patientTransfers--------+++++++++-------', patientTransfers);
    await db.collection('patienttransfer').insertMany(patientTransfers);
    console.log('Patient Transfers created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, facilityIds, patientIds, tenantIds) => {
  return {
    transfer_id: data.TransferID,
    transfer_reason: data.TransferReason ? data.TransferReason : '',
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    transfer_status: data.TransferStatus ? data.TransferStatus : 0,
    reject_reason: data.RejectedReason ? data.RejectedReason : '',
    old_facility: facilityIds[data.PatientOldFacilityID],
    transfer_by: userIds[data.TransferedBy],
    transfer_to: userIds[data.TransferedTo],
    transfer_facility: facilityIds[data.TransferedFacilityID]
  }
}

module.exports = main;