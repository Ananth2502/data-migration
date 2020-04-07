const XLSX = require('xlsx');
const filePath = './data/MedBrandNameCountry.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
try {    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let MedicationCountries = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    // brand
    let brands = await db.collection('brand').find().toArray();
    let brandIds = {};
    brands.map(brand => {
      if (brand.brand_id)
        brandIds[brand.brand_id] = brand._id;
    });
    // country
    let countries = await db.collection('country').find().toArray();
    let countryIds = {};
    countries.map(country => {
      if (country.country_id)
        countryIds[country.country_id] = country._id;
    });
    // classification
    let classifications = await db.collection('classification').find().toArray();
    let classificationIds = {};
    classifications.map(classification => {
      if (classification.classification_id)
        classificationIds[classification.classification_id] = classification._id;
    });
    // dosage form 
    let dosageForms = await db.collection('dosageform').find().toArray();
    let dosageFormIds = {};
    dosageForms.map(dosageForm => {
      if (dosageForm.dosageform_id)
        dosageFormIds[dosageForm.dosageform_id] = dosageForm._id;
    });
    // medication
    let medications = await db.collection('medication').find().toArray();
    let medicationIds = {};
    medications.map(medication => {
      if (medication.medication_id)
        medicationIds[medication.medication_id] = medication._id;
    });
    MedicationCountries = MedicationCountries.map(medicationcountry => {
      return constructData(medicationcountry, userIds, brandIds, countryIds, classificationIds, dosageFormIds, medicationIds);
    });
    await db.collection('medicationcountrydetail').insertMany(MedicationCountries);
    console.log('MedicationCountries created successfully');
    client.close();
  } catch (error) {
    console.log(error);
} }

const constructData = (data, userIds, brandIds, countryIds, classificationIds, dosageFormIds, medicationIds) => {
  return {
    // medication country detail 
    medicationcountry_id: data.MedBrandNameCountryID,
    brand: brandIds[data.MedicationBrandNameID],
    country: countryIds[data.CountryID],
    classification: classificationIds[data.MedicationClassificationID],
    dosage_form: dosageFormIds[data.DosageFormID],
    medication: medicationIds[data.MedicationNameID],  
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
  };
}

module.exports = main;