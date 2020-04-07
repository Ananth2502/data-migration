const XLSX = require('xlsx');
const filePath = './data/MedclassBrand.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
try {        // Connects to the remote mongoDB server
        let client = await MongoClient.connect(url);
        // Connects to the mongo database running on default port - test_db_4  
        let db = await client.db();
        // Reads the input CSV file: MedicationBrand.csv
        let workbook = XLSX.readFile(filePath, { cellDates : true} );
        // Classification Brand Entries - array of objects
        let ClassificationBrandEntries = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        // Fetch all the users, migrated from Postgres, convert to JS array 
        let users = await db.collection('users').find().toArray();
        let userIds = {};
        users.map(user => {
            if (user.user_id) {
                // Construct object that maps all the postgres userIds to the mongoDB objectIDs
                userIds[user.user_id] = user._id;
            }
        });
        let classifications = await db.collection('classification').find().toArray();
        let classificationIds = {};
        classifications.map(classification => {
            if (classification.classification_id) {
                // Construct object that maps all the postgres userIds to the mongoDB objectIDs
                classificationIds[classification.classification_id] = classification._id
            }
        });
        let brands = await db.collection('brand').find().toArray();
        let brandIds = {};
        brands.map(brand => {
            if (brand.brand_id) {
                // Construct object that maps all the postgres userIds to the mongoDB objectIDs
                brandIds[brand.brand_id] = brand._id
            }
        });
        // Classification Brands to insert into MongoDB
        ClassificationBrandEntries = ClassificationBrandEntries.map(ClassificationBrandEntry => {
            return constructData(ClassificationBrandEntry, userIds, classificationIds, brandIds);
        });
        await db.collection('classificationbrand').insertMany(ClassificationBrandEntries);
        console.log('ClassificationBrands created successfully');
        client.close();
  } catch (error) {
    console.log(error);
}
}

// Map the postgres fields to mongoDB fields
const constructData = (data, userIds, classificationIds, brandIds) => {
    return {
        // Preserve Postgres ID
        classificationbrand_id: data.MedclassBrandID,
        classification: classificationIds[data.MedicationClassificationID],
        brand: brandIds[data.MedicationBrandNameID],
        is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true: false,
        created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
        updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
        createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
        updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
    }
}

module.exports = main;