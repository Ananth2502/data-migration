const XLSX = require('xlsx');
const filePath = './data/risk-factor.xlsx';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let riskFactors = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('riskFactors------------------', riskFactors);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    riskFactors = riskFactors.map(riskFactor => {
      return constructData(riskFactor, userIds);
    });
    // console.log('riskFactors---------+++++++---------', riskFactors);
    await db.collection('riskfactor').insertMany(riskFactors);
    console.log('Risk Factors created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds) => {
  return {
    riskfactor_id: data.RiskFactorID,
    name: data.RiskFactorName ? data.RiskFactorName : '',
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? new Date(data.CreatedDatetime).toISOString() : '',
    updatedAt: data.UpdatedDatetime ? new Date(data.UpdatedDatetime).toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    is_active: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? false : true,
    status: (data.Status && data.Status.toLowerCase() == 't') ? true : false
  }
}

module.exports = main;