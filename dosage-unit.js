const XLSX = require('xlsx');
const filePath = './data/dosage-unit.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
  let client = await MongoClient.connect(url);
  let db = await client.db();
  let workbook = XLSX.readFile(filePath, { cellDates: true });
  let dosageUnits = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  let users = await db.collection('users').find().toArray();
  let userIds = {};
  users.forEach(user => {
    if (user.user_id) userIds[user.user_id] = user._id;
  });
  dosageUnits = dosageUnits.map(dosageUnit => {
    return constructData(dosageUnit, userIds);
  });
  // console.log('dosageUnits--------------', dosageUnits);
  await db.collection('dosageunit').insertMany(dosageUnits);
  console.log('Dosage Unit data created successfully');
  client.close();
  } catch (error) {
    console.log(error);
}
}

const constructData = (data, userIds) => {
  return {
    dosage_unit_id: data.DosageUnitID,
    unit: data.DosageUnit ? data.DosageUnit: '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
  };
}

module.exports = main;