const XLSX = require('xlsx');
const filePath = './data/patient-medical-review.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let medicalReviews = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
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
    medicalReviews = medicalReviews.map(medicalReview => {
      return constructData(medicalReview, userIds, patientIds, tenantIds);
    });
    // console.log('medicalReviews-------------', medicalReviews);
    await db.collection('patientmedicalreview').insertMany(medicalReviews);
    console.log('Patient medical reviews created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, patientIds, tenantIds) => {
  return {
    medical_review_id: data.PatientMedicalReviewID,
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    review_type: data.ReviewType ? data.ReviewType : 0,
    sms_communication_type: data.SMSCommunicationType ? data.SMSCommunicationType : 0,
    message: data.TextMessage ? data.TextMessage : '',
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    is_latest: (data.IsLatest && data.IsLatest.toLowerCase() == 't') ? true : false,
    referral: data.Referral ? data.Referral : '',
    tb_screening: data.TBScreening
  }
}

module.exports = main;