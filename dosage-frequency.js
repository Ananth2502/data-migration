const XLSX = require('xlsx');
const filePath = './data/dosage-frequency.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
  let client = await MongoClient.connect(url);
  let db = await client.db();
  let workbook = XLSX.readFile(filePath, { cellDates: true });
  let dosages = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  let users = await db.collection('users').find().toArray();
  let userIds = {};
  users.forEach(user => {
    if (user.user_id) userIds[user.user_id] = user._id;
  });
  dosages = dosages.map(dosage => {
    return constructData(dosage, userIds);
  });
  // console.log('dosages--------------', dosages);
  await db.collection('dosagefrequency').insertMany(dosages);
  console.log('Dosage frequency data created successfully');
  client.close();
  } catch (error) {
    console.log(error);
}
}

const constructData = (data, userIds) => {
  return {
    dosage_freq_id: data.DosageFrequencyID,
    name: data.DosageFrequency ? data.DosageFrequency : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
  };
}

module.exports = main;