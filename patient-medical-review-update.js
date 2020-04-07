const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let reviewNotes = await db.collection('patientclinicalreviewnote').find().toArray();
    let counselingData = await db.collection('patientnutritioncounseling').find().toArray();
    let utilizations = await db.collection('healthcareutilization').find().toArray();
    let physicalExams = await db.collection('patientphysicalexamination').find().toArray();

    let reviewList = {};
    reviewNotes.forEach(reviewNote => {
      if (!reviewList[reviewNote.patient_med_rev_id]) {
        reviewList[reviewNote.patient_med_rev_id] = [reviewNote._id];
      } else {
        reviewList[reviewNote.patient_med_rev_id].push(reviewNote._id);
      }
    });
    let counselingDataList = {};
    counselingData.forEach(data => {
      if (!counselingDataList[data.patient_med_rev_id]) {
        counselingDataList[data.patient_med_rev_id] = [data._id];
      } else {
        counselingDataList[data.patient_med_rev_id].push(data._id);
      }
    });
    let utilizationList = {};
    utilizations.forEach(utilization => {
      if (!utilizationList[utilization.patient_med_rev_id]) {
        utilizationList[utilization.patient_med_rev_id] = [utilization._id];
      } else {
        utilizationList[utilization.patient_med_rev_id].push(utilization._id);
      }
    });
    let physicalExamList = {};
    physicalExams.forEach(physicalExam => {
      if (!physicalExamList[physicalExam.patient_medical_review_id]) {
        physicalExamList[physicalExam.patient_medical_review_id] = [physicalExam._id];
      } else {
        physicalExamList[physicalExam.patient_medical_review_id].push(physicalExam._id);
      }
    });
    // console.log('physicalExamList----------------', physicalExamList);
    let reviews = await db.collection('patientmedicalreview').find().toArray();
    for (let index = 0; index < reviews.length; index++) {
      reviews[index].patient_clinical_review_note = reviewList[reviews[index]._id];
      reviews[index].patient_nutrition_counseling = counselingDataList[reviews[index]._id];
      reviews[index].health_care_utilization = utilizationList[reviews[index]._id];
      reviews[index].patient_physical_examination = physicalExamList[reviews[index]._id];
      await db.collection('patientmedicalreview').update({ _id: reviews[index]._id }, reviews[index]);
    }
    console.log('Patient medical review data successfully updated');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;