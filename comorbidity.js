const XLSX = require('xlsx');
const filePath = './data/comorbidity.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let comorbidities = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    comorbidities = comorbidities.map(comorbidity => {
      return constructData(comorbidity, userIds);
    });
    await db.collection('comorbidity').insertMany(comorbidities);
    console.log('Comorbidities created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds) => {
  return {
    comorbidity_id: data.ComorbidityID,
    name: data.ComorbidityName ? data.ComorbidityName : '',
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    status: (data.Status && data.Status.toLowerCase() == 't') ? true : false,
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    is_active: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? false : true,
    sequence_number: data.SequenceNumber ? data.SequenceNumber : 0
  }
}

module.exports = main;