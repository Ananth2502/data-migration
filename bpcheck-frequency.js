const XLSX = require('xlsx');
const filePath = './data/bpcheck-frequency.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let bpcheckFrequencies = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    bpcheckFrequencies = bpcheckFrequencies.map(bpcheckFrequency => {
      return constructData(bpcheckFrequency, userIds);
    });
    // console.log('bpcheckFrequencies-------------', bpcheckFrequencies);
    await db.collection('bpcheckfrequency').insertMany(bpcheckFrequencies);
    console.log('bpcheckFrequencies created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds) => {
  return {
    bpcheck_freq_id: data.BPCheckFreqID,
    name: data.BPCheckFreq ? data.BPCheckFreq : '',
    is_deleted: (data.Status && data.Status.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
  };
}

module.exports = main;