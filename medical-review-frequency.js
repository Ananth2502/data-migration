const XLSX = require('xlsx');
const filePath = './data/medical-review-frequency.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let frequencies = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    frequencies = frequencies.map(frequency => {
      frequency.high_risk = (frequency.high_risk == 'true');
      frequency.moderate_risk = (frequency.moderate_risk == 'true');
      frequency.low_risk = (frequency.low_risk == 'true');
      frequency.is_default = (frequency.is_default == 'true');
      frequency.is_active = (frequency.is_active == 'true');
      frequency.is_deleted = (frequency.is_deleted == 'true');
      frequency.createdAt = frequency.createdAt ? frequency.createdAt.toISOString() : '';
      frequency.updatedAt = frequency.updatedAt ? frequency.updatedAt.toISOString() : '';
      return frequency;
    });
    await db.collection('medicalreviewfrequency').insertMany(frequencies);
    console.log('Medical Review Frequency created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;