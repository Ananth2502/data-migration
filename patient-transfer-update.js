const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let patientTransferHisData = await db.collection('patienttransferhistory').find().toArray();
    let transferHistory = {};
    patientTransferHisData.forEach(transferHisData => {
      if (!transferHistory[transferHisData.transfer_id]) {
        transferHistory[transferHisData.transfer_id] = [transferHisData._id];
      } else {
        transferHistory[transferHisData.transfer_id].push(transferHisData._id);
      }
    });
    let patientTransfers = await db.collection('patienttransfer').find().toArray();
    for (let index = 0; index < patientTransfers.length; index++) {
      patientTransfers[index].patient_transfer_history = transferHistory[patientTransfers[index]._id];
      await db.collection('patienttransfer').update({ _id: patientTransfers[index]._id }, patientTransfers[index]);
    }
    console.log('Patient Transfer data successfully updated');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;