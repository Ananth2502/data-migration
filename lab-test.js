const XLSX = require('xlsx');
const filePath = './data/lab-test.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let labtests = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    labtests = labtests.map(labtest => {
      return constructData(labtest, userIds);
    });
    // console.log('labtest-----------------', labtests);
    await db.collection('labtest').insertMany(labtests);
    console.log('Lab Tests created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds) => {
  return {
    labtest_id: data.LabTestID,
    name: data.LabTestName ? data.LabTestName : '',
    description: data.LabTestDescription ? data.LabTestDescription : '',
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    is_active: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? false : true,
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false
  }
}

module.exports = main;