const XLSX = require('xlsx');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    // Map prescription IDs to fill prescription IDs
    let fillprescriptions = await db.collection('fillprescription').find().toArray();
    let fillprescriptionIds = {};
    fillprescriptions.map(fillprescription => {
      if (fillprescription.prescription_id) {
        fillprescriptionIds[fillprescription.prescription_id] = fillprescription._id;
      }
    });
    let prescriptionHistories = await db.collection('prescriptionhistory').find().toArray();
    let prescriptionHistoryIds = {};
    prescriptionHistories.map(prescriptionHistory => {
      if (!prescriptionHistoryIds[prescriptionHistory.prescription_id]) {
        prescriptionHistoryIds[prescriptionHistory.prescription_id] = [prescriptionHistory._id];
      } else {
        prescriptionHistoryIds[prescriptionHistory.prescription_id].push(prescriptionHistory._id);
      }
    });
    let prescriptions = await db.collection('prescription').find().toArray();
    prescriptions.forEach(async prescription => {
      prescription.fill_prescription = fillprescriptionIds[prescription._id];
      prescription.prescription_history = (prescriptionHistoryIds[prescription.prescription_id] && prescriptionHistoryIds[prescription.prescription_id].length) ? prescriptionHistoryIds[prescription.prescription_id] : [];
      await db.collection('prescription').update({ _id: prescription._id }, prescription);
    });
    console.log('Prescriptions updated successfully');
    client.close();
   } catch (error) {
    console.log(error);
  }
}

module.exports = main;