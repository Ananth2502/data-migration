const XLSX = require('xlsx');
const filePath = './data/complication.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
  let client = await MongoClient.connect(url);
  let db = await client.db();
  let workbook = XLSX.readFile(filePath, { cellDates: true });
  let complications = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  let users = await db.collection('users').find().toArray();
  let userIds = {};
  users.forEach(user => {
    if (user.user_id) userIds[user.user_id] = user._id;
  });
  complications = complications.map(complication => {
    return constructData(complication, userIds);
  });
  // console.log('complications------++++-------', complications);
  await db.collection('complication').insertMany(complications);
  console.log('Complications created successfully');
  client.close();
  } catch (error) {
    console.log(error);
}
}

const constructData = (data, userIds) => {
  return {
    complication_id: data.ComplicationID,
    name: data.ComplicationName ? data.ComplicationName : '',
    is_deleted: (data.Status && data.Status.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
  };
}

module.exports = main;