const XLSX = require('xlsx');
const filePath = './data/version.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let versions = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    versions = versions.map(version => {
      return constructData(version);
    });
    await db.collection('version').insertMany(versions);
    console.log('Versions created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data) => {
  return {
    versionNumber: data.VersionID ? data.VersionID : '',
    createdAt: data.CreatedDatetime,
    is_active: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? false : true,
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? false : true,
  };
}

module.exports = main;