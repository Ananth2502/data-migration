const XLSX = require('xlsx');
const filePath = './data/MedBrandNameCountry.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
try {    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let CountryClassifications = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let countries = await db.collection('country').find().toArray();
    let countryIds = {};
    countries.map(country => {
      if (country.country_id) {
        countryIds[country.country_id] = country._id;
      }
    });
    let classifications = await db.collection('classification').find().toArray();
    let classificationIds = {};
    classifications.map(classification => {
      if (classification.classification_id)
        classificationIds[classification.classification_id] = classification._id;
    });
    CountryClassifications = CountryClassifications.map(medicationcountry => {
      return constructData(medicationcountry, userIds, countryIds, classificationIds);
    });
    await db.collection('countryclassification').insertMany(CountryClassifications);
    console.log('CountryClassifications created successfully');
    client.close();
  } catch (error) {
    console.log(error);
} }

const constructData = (data, userIds, countryIds, classificationIds) => {
  return {
    // medication country detail 
    countryclassification_id: data.MedBrandNameCountryID,
    country: countryIds[data.CountryID],
    classification: classificationIds[data.MedicationClassificationID], 
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
  };
}

module.exports = main;