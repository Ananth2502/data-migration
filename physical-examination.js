const XLSX = require('xlsx');
const filePath = './data/physical-examination.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let patientExams = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('patientExams---------------', patientExams);
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
    patientExams = patientExams.map(patientExam => {
      return constructData(patientExam, userIds, reviewIds, patientIds, tenantIds);
    });
    // console.log('patientExams--------+++++++++-------', patientExams);
    await db.collection('patientphysicalexamination').insertMany(patientExams);
    console.log('Patient physical examination data created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, reviewIds, patientIds, tenantIds) => {
  return {
    phy_exam_id: data.PhysicalExaminationID,
    patient_medical_review_id: reviewIds[data.PatientMedicalReviewID],
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    general_exam: data.GenralExam ? data.GenralExam.toString() : '',
    general_exam_other: data.GenralExamOthers ? data.GenralExamOthers : '',
    cardiovascular: data.Cardiovascular ? data.Cardiovascular : '',
    cardiovascular_value: data.CardiovascularValue ? data.CardiovascularValue : '',
    respirtory_system: data.RespiratorySystem ? data.RespiratorySystem : '',
    respirtory_system_value: data.RespiratorySystemValue ? data.RespiratorySystemValue : '',
    abdominal_pelvic: data.AbdominalPelvic ? data.AbdominalPelvic : '',
    abdominal_pelvic_value: data.AbdominalPelvicValue ? data.AbdominalPelvicValue : '',
    nereologic_exam: data.NeurologicalExam ? data.NeurologicalExam : '',
    nerological_exam_value: data.NeurologicalExamValue ? data.NeurologicalExamValue : '',
    oral_exam: data.OralExam ? data.OralExam : '',
    mental_health: data.MentalHealth ? data.MentalHealth : '',
    monofilament_test_rf: data.MonofilamentTestRF ? Number(data.MonofilamentTestRF) : 0,
    monofilament_test_lf: data.MonofilamentTestLF ? Number(data.MonofilamentTestLF) : 0,
    foot_exam: data.FootExam ? data.FootExam : '',
    diabetic_foot: data.DiabeticFoot ? Number(data.DiabeticFoot) : 0,
    other: data.Other ? data.Other : '',
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false
  }
}

module.exports = main;