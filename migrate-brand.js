const XLSX = require('xlsx');
const filePath = './data/MedicationBrandName.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
    try {        // Connects to the remote mongoDB server
        let client = await MongoClient.connect(url);
        // Connects to the mongo database running on default port - test_db_4  
        let db = await client.db();
        // Reads the input CSV file: MedicationBrand.csv
        let workbook = XLSX.readFile(filePath, { raw: true });
        // Medication Name - array of objects
        let MedicationBrandEntries = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        // Fetch all the users, migrated from Postgres, convert to JS array 
        let users = await db.collection('users').find().toArray();
        let userIds = {};
        users.map(user => {
            if (user.user_id) {
                // Construct object that maps all the postgres userIds to the mongoDB objectIDs
                userIds[user.user_id] = user._id;
            }
        });
        // MedicationBrands to insert into MongoDB
        MedicationBrandEntries = MedicationBrandEntries.map(MedicationBrandEntry => {
            return constructData(MedicationBrandEntry, userIds);
        });
        await db.collection('brand').insertMany(MedicationBrandEntries);
        console.log('Brands created successfully');
        client.close();
    } catch (error) {
        console.log(error);
    }
}

// Map the postgres fields to mongoDB fields
const constructData = (data, userIds) => {
    let createdAt = new Date(data.CreatedDatetime);
    let updatedAt = new Date(data.UpdatedDatetime);
    return {
        // Preserve Postgres ID
        brand_id: data.MedicationBrandNameID,
        name: data.BrandName ? data.BrandName : '',
        is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
        created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
        updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
    }
}

module.exports = main;