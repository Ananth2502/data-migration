const XLSX = require('xlsx');
const filePath = './data/healthcare-utilization.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let utilizations = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('utilizations---------------', utilizations);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let reviews = await db.collection('patientmedicalreview').find().toArray();
    let reviewIds = {};
    reviews.forEach(review => {
      if (review.medical_review_id) reviewIds[review.medical_review_id] = review._id;
    });
    let patients = await db.collection('patient').find().toArray();
    let patientIds = {};
    let tenantIds = {};
    patients.forEach(patient => {
      if (patient.temp_id) patientIds[patient.temp_id] = patient._id;
      if (patient.temp_id) tenantIds[patient.temp_id] = patient.tenant_id;
    });
    let complications = await db.collection('complication').find().toArray();
    let complicationIds = {};
    complications.forEach(complication => {
      if (complication.complication_id) complicationIds[complication.complication_id] = complication._id;
    });
    utilizations = utilizations.map(utilization => {
      return constructData(utilization, userIds, reviewIds, patientIds, complicationIds, tenantIds);
    });
    // console.log('complicationIds--------+++++++++-------', complicationIds);
    // console.log('utilizations--------+++++++++-------', utilizations);
    await db.collection('healthcareutilization').insertMany(utilizations);
    console.log('Healthcare utilization data created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, reviewIds, patientIds, complicationIds, tenantIds) => {
  let healthcareType = {
    1: 'IN_PATIENT_HOSPITALIZATION',
    2: 'OUT_PATIENT',
    3: 'NONE'
  };
  return {
    healthcare_id: data.HealthcareUtilizationID,
    patient_med_rev_id: reviewIds[data.PatientMedicalReviewID],
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    healthcare_type: data.HealthcareType ? healthcareType[data.HealthcareType] : '',
    reason: data.Reason ? data.Reason : '',
    hyper_tension_related: data.HypertensionRelated ? data.HypertensionRelated : 0,
    duration_of_hospitalization: data.DurationOfHospitalization ? data.DurationOfHospitalization : 0,
    missed_working_days: data.MissedWorkdays ? data.MissedWorkdays : 0,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    complication_id: complicationIds[data.ComplicationID]
  }
}

module.exports = main;