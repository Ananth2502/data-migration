const XLSX = require('xlsx');
const filePath = './data/MedicationClassification.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
    try {        // Connects to the remote mongoDB server
        let client = await MongoClient.connect(url);
        // Connects to the mongo database running on default port - test_db_4  
        let db = await client.db();
        // Reads the input CSV file: MedicationClassification.csv
        let workbook = XLSX.readFile(filePath, { cellDates: true });
        // Medication Classification Name - array of objects
        let MedicationClassificationEntries = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        // Fetch all the users, migrated from Postgres, convert to JS array 
        let users = await db.collection('users').find().toArray();
        let userIds = {};
        users.map(user => {
            if (user.user_id) {
                // Construct object that maps all the postgres userIds to the mongoDB objectIDs
                userIds[user.user_id] = user._id;
            }
        });
        // MedicationClassifications to insert into MongoDB
        MedicationClassificationEntries = MedicationClassificationEntries.map(MedicationClassificationEntry => {
            return constructData(MedicationClassificationEntry, userIds);
        });
        await db.collection('classification').insertMany(MedicationClassificationEntries);
        console.log('Classifications created successfully');
        client.close();
    } catch (error) {
        console.log(error);
    }
}

// Map the postgres fields to mongoDB fields
const constructData = (data, userIds) => {
    return {
        // Preserve Postgres ID
        classification_id: data.MedicationClassificationID,
        name: data.ClassificationName ? data.ClassificationName : '',
        is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
        created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
        updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
        createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
        updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
    }
}

module.exports = main;