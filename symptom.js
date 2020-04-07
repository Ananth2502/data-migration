const XLSX = require('xlsx');
const filePath = './data/symptom.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let symptoms = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    symptoms = symptoms.map(symptom => {
      return constructData(symptom, userIds);
    });
    await db.collection('symptom').insertMany(symptoms);
    console.log('Symptoms created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds) => {
  let category1 = [101, 102, 103, 104];
  let category2 = [109];
  let category3 = [108];
  let category4 = [105, 106];
  let category5 = [101, 102, 103, 104, 112, 113, 114, 115, 116, 117];
  return {
    symptom_id: data.SymptomID,
    symptom: data.SymptomName ? data.SymptomName : '',
    description: data.SymptomDescription ? data.SymptomDescription : '',
    app_type: data.AppType ? Number(data.AppType) : 0,
    is_deleted: (data.Status && data.Status.toLowerCase() == 't') ? true : false,
    is_active: (data.Status && data.Status.toLowerCase() == 't') ? false : true,
    sequence_number: data.SequenceNumber,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    categories: {
      "1" : category1.includes(data.SymptomID),
      "2" : category2.includes(data.SymptomID),
      "3" : category3.includes(data.SymptomID),
      "4" : category4.includes(data.SymptomID),
      "5" : category5.includes(data.SymptomID)
  },
  };
}

module.exports = main;