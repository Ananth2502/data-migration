const XLSX = require('xlsx');
const filePath = './data/subcounty.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
  let client = await MongoClient.connect(url);
  let db = await client.db();
  let workbook = XLSX.readFile(filePath, { cellDates: true });
  let subcounties = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  // console.log('subcounties--------------', subcounties);
  let users = await db.collection('users').find().toArray();
  let userIds = {};
  users.forEach(user => {
    if (user.user_id) userIds[user.user_id] = user._id;
  });
  let counties = await db.collection('county').find().toArray();
  let countyIds = {};
  counties.forEach(county => {
    if (county.county_id) countyIds[county.county_id] = county._id;
  });
  // console.log('counties--------------', countyIds);
  subcounties = subcounties.map(subcounty => {
    return constructData(subcounty, userIds, countyIds);
  });
  // console.log('subcounties--------+++++------', subcounties);
  await db.collection('subcounty').insertMany(subcounties);
  console.log('subcounties created successfully');
  client.close();
  } catch (error) {
    console.log(error);
}
}

const constructData = (data, userIds, countyIds) => {
  return {
    subcounty_id: data.SubCountyID,
    name: data.SubCountyName ? data.SubCountyName : '',
    county: countyIds[data.CountyID].toString(),
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
  };
}

module.exports = main;