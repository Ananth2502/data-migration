const XLSX = require('xlsx');
const filePath = './data/hba1c-check-frequency.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let frequencies = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    frequencies = frequencies.map(frequency => {
      return constructData(frequency, userIds);
    });
    // console.log('frequencies-------------', frequencies);
    await db.collection('hba1ccheckfrequency').insertMany(frequencies);
    console.log('HbA1cCheck Frequency created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds) => {
  return {
    hba1c_freq_id: data.HbA1cCheckFreqID,
    name: data.HbA1cCheckFreq ? data.HbA1cCheckFreq : '',
    is_high_risk: (data.HighRisk && data.HighRisk.toLowerCase() == 't') ? true : false,
    is_moderate_risk: (data.ModerateRisk && data.ModerateRisk.toLowerCase() == 't') ? true : false,
    is_low_risk: (data.LowRisk && data.LowRisk.toLowerCase() == 't') ? true : false,
    is_deleted: (data.Status && data.Status.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    missed_review_days: data.MissedReviewDays ? data.MissedReviewDays : 0
  };
}

module.exports = main;