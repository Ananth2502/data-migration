const XLSX = require('xlsx');
const filePath = './data/nutrition-counseling.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let nutritionCounselingData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
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
    nutritionCounselingData = nutritionCounselingData.map(counselingData => {
      return constructData(counselingData, userIds, reviewIds, patientIds, tenantIds);
    });
    // console.log('nutritionCounselingData--------------', nutritionCounselingData);
    await db.collection('patientnutritioncounseling').insertMany(nutritionCounselingData);
    console.log('Nutrition Counseling Data created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, reviewIds, patientIds, tenantIds) => {
  return {
    nutrition_id: data.NutritionCounselingID,
    patient_med_rev_id: reviewIds[data.PatientMedicalReviewID],
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    life_mgmt_counceling: data.LifeManagementCounseling ? data.LifeManagementCounseling : '',
    nutrition_assessment: data.NutritionAssessment ? data.NutritionAssessment : '',
    meal_plan: data.MealPlanning ? data.MealPlanning : '',
    other_plan: data.OtherPlans ? data.OtherPlans : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    createdAt: data.CreatedDatetime
  };
}

module.exports = main;