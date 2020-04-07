const XLSX = require('xlsx');
const filePath = './data/facility.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
    try {
        // Connects to the remote mongoDB server
        let client = await MongoClient.connect(url);
        // Connects to the mongo database running on default port - test_db_4  
        let db = await client.db();
        // Delete all the non_id indices before trying to insert data
        // This is because Facility name is duplicate, email, prefix & virtualId are null
        await db.collection('organizations').dropIndexes();
        // Reads the input CSV file: facility.csv
        let workbook = XLSX.readFile(filePath, { cellDates: true });
        // Medication Name - array of objects
        let organizations = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        // Fetch all the users, migrated from Postgres, convert to JS array 
        let users = await db.collection('users').find().toArray();
        let userIds = {};
        users.map(user => {
            if (user.user_id) {
                // Construct object that maps all the postgres userIds to the mongoDB objectIDs
                userIds[user.user_id] = user._id;
            }
        });
        // Organizations to insert into MongoDB
        organizations = organizations.map(organization => {
            let prefixId = generatePrefixID();
            return constructData(organization, userIds, prefixId);
        });
        await db.collection('organizations').insertMany(organizations);
        console.log('Organizations created successfully');
        client.close();
    } catch (error) {
        console.log(error);
    }
}

function generatePrefixID() {
    let possible = 'abcdefghijklmnopqrstuvwxyz';
    prefix = '';
    for (let i = 0; i < 5; i++) {
        prefix += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return prefix;
}

// Map the postgres fields to mongoDB fields
const constructData = (data, userIds, prefixId) => {
    return {
        // Preserve Postgres ID
        facility_id: data.FacilityID,
        // Random prefix ID
        prefix: prefixId ? prefixId : '',
        name: data.FacilityName ? data.FacilityName : '',
        is_active: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? false : true,
        is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
        created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
        updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
        createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
        updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
    }
}

module.exports = main;