const XLSX = require('xlsx');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    // Get the Fill prescriptions to update
    // Get the ids
    let prescriptionHistories = await db.collection('fillprescriptionhistory').find().toArray();
    let prescriptionHistoryIds = {};
    prescriptionHistories.map(prescriptionHistory => {
      if (!prescriptionHistoryIds[prescriptionHistory.fillprescription_id]) {
        prescriptionHistoryIds[prescriptionHistory.fillprescription_id] = [prescriptionHistory._id];
      } else {
        prescriptionHistoryIds[prescriptionHistory.fillprescription_id].push(prescriptionHistory._id);
      }
    });
    // Update the fill prescriptions with additional key
    let fillprescriptions = await db.collection('fillprescription').find().toArray();
    fillprescriptions.forEach(async prescription => {
      prescription.fill_presc_history = (prescriptionHistoryIds[prescription.fillprescription_id] && prescriptionHistoryIds[prescription.fillprescription_id].length) ? prescriptionHistoryIds[prescription.fillprescription_id] : [];
      await db.collection('fillprescription').update({ _id: prescription._id }, prescription);
    });
    console.log('Fill Prescriptions updated successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}


module.exports = main;