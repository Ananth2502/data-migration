const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let symptoms = await db.collection('patientsymptoms').find().toArray();
    let compliances = await db.collection('patientmedicalcompliance').find().toArray();
    let symptomList = {};
    symptoms.forEach(symptom => {
      if (!symptomList[symptom.bplog_id]) {
        symptomList[symptom.bplog_id] = [symptom._id];
      } else {
        symptomList[symptom.bplog_id].push(symptom._id);
      }
    });
    let complianceList = {};
    compliances.forEach(compliance => {
      if (!complianceList[compliance.bplog_id]) {
        complianceList[compliance.bplog_id] = [compliance._id];
      } else {
        complianceList[compliance.bplog_id].push(compliance._id);
      }
    });
    // console.log('complianceList----------------', complianceList);
    let bplogs = await db.collection('bplog').find().toArray();
    for (let index = 0; index < bplogs.length; index++) {
      bplogs[index].patient_symptoms = (symptomList[bplogs[index]._id] && symptomList[bplogs[index]._id].length) ? symptomList[bplogs[index]._id] : [];
      bplogs[index].patient_medical_compliance = (complianceList[bplogs[index]._id] && complianceList[bplogs[index]._id].length) ? complianceList[bplogs[index]._id] : [];
      await db.collection('bplog').update({ _id: bplogs[index]._id }, bplogs[index]);
    }
    console.log('BP Log data successfully updated');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;