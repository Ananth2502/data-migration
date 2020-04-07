const XLSX = require('xlsx');
const filePath = './data/clinical-review-note.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let notes = {
      1: 'management_note',
      2: 'clinical_note',
      3: 'medication_note'
    };
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let reviewNotes = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('reviewNotes-------------', reviewNotes);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let reviews = await db.collection('patientmedicalreview').find().toArray();
    let reviewIds = {};
    let tenantIds = {};
    reviews.forEach(review => {
      if (review.medical_review_id) {
        reviewIds[review.medical_review_id] = {
          _id: review._id,
          tb_screening: review.tb_screening
        };
        tenantIds[review.medical_review_id] = review.tenant_id;
      }
    });
    reviewNotes = reviewNotes.map(reviewNote => {
      return constructData(reviewNote, userIds, notes, reviewIds, tenantIds);
    });
    // console.log('res--------------------', reviewNotes);
    await db.collection('patientclinicalreviewnote').insertMany(reviewNotes);
    console.log('Patient clinical review notes created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, notes, reviewIds, tenantIds) => {
  const reviewNote = notes[data.ReviewNoteID];
  const isReviewNote = `is_${[reviewNote]}`;
  return {
    clinical_review_note_id: data.ClinicalReviewNoteID,
    patient_med_rev_id: reviewIds[data.PatientMedicalReviewID]._id,
    tenant_id: tenantIds[data.PatientMedicalReviewID] && tenantIds[data.PatientMedicalReviewID].toString(),
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    [reviewNote]: data.ReviewNote ? data.ReviewNote : '',
    [isReviewNote]: true,
    tb_screening: reviewIds[data.PatientMedicalReviewID].tb_screening ? reviewIds[data.PatientMedicalReviewID].tb_screening : ''
  }
}

module.exports = main;