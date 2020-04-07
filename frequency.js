const XLSX = require('xlsx');
const filePath1 = './data/bpcheck-frequency.csv';
const filePath2 = './data/hba1c-check-frequency.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook1 = XLSX.readFile(filePath1, { cellDates: true });
    let bpcheckFrequencies = XLSX.utils.sheet_to_json(workbook1.Sheets[workbook1.SheetNames[0]]);
    let workbook2 = XLSX.readFile(filePath2, { cellDates: true });
    let frequencies = XLSX.utils.sheet_to_json(workbook2.Sheets[workbook2.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    bpcheckFrequencies = bpcheckFrequencies.map(bpcheckFrequency => {
      return constructData(bpcheckFrequency, userIds, 'bp check');
    });
    // console.log('bpcheckFrequencies-------------', bpcheckFrequencies);
    frequencies = frequencies.map(frequency => {
      return constructData(frequency, userIds, 'hba1c check');
    });
    frequencies = [...frequencies, ...bpcheckFrequencies];
    await db.collection('frequency').insertMany(frequencies);
    console.log('Frequencies created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, type) => {
  let res = {};
  if (type == 'bp check') {
    res = {
      freq_id: data.BPCheckFreqID,
      frequency_name: data.BPCheckFreq ? data.BPCheckFreq : '',
      missed_review_days: 0
    };
  } else {
    res = {
      hba1c_freq_id: data.HbA1cCheckFreqID,
      frequency_name: data.HbA1cCheckFreq ? data.HbA1cCheckFreq : '',
      missed_review_days: data.MissedReviewDays ? data.MissedReviewDays : 0
    }
  }
  res = {
    ...res, ...{
      frequency_type: type,
      is_deleted: (data.Status && data.Status.toLowerCase() == 't') ? true : false,
      created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
      updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
      createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
      updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
    }
  }
  return res;
}

module.exports = main;