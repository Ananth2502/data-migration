const XLSX = require('xlsx');
const filePath = './data/FillPrescriptionHistory.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
try {        // Connects to the remote mongoDB server
        let client = await MongoClient.connect(url);
        // Connects to the mongo database running on default port - test_db_4  - idea_paas
        let db = await client.db();
        // Reads the input CSV file: FillPrescriptionHistory.csv
        let workbook = XLSX.readFile(filePath, { cellDates : true} );
        // Fill Prescription History - array of objects
        let FillPrescriptionHistoryEntries = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        // Fetch all the users, migrated from Postgres, convert to JS array 
        let users = await db.collection('users').find().toArray();
        let userIds = {};
        users.map(user => {
            if (user.user_id) {
                // Construct object that maps all the postgres userIds to the mongoDB objectIDs
                userIds[user.user_id] = user._id;
            }
        });
        let fillprescriptions = await db.collection('fillprescription').find().toArray();
        let tenantIds = {};
        fillprescriptions.map(fillprescription => {
          if (fillprescription.fillprescription_id) {
            tenantIds[fillprescription.fillprescription_id] = fillprescription.tenant_id;
          }
        });
        // FillPrescriptionHistorys to insert into MongoDB
        FillPrescriptionHistoryEntries = FillPrescriptionHistoryEntries.map(FillPrescriptionHistoryEntry => {
            return constructData(FillPrescriptionHistoryEntry, userIds, tenantIds);
        });
        await db.collection('fillprescriptionhistory').insertMany(FillPrescriptionHistoryEntries);
        console.log('Fill Prescription History entries created successfully');
        client.close();
  } catch (error) {
    console.log(error);
}
}

// Map the postgres fields to mongoDB fields
const constructData = (data, userIds, tenantIds) => {
    return {
        // Preserve Postgres ID
        fillprescriptionhistory_id: data.FillPrescriptionHistoryID,
        prescription_id: data.PrescriptionMedicationID,
        fillprescription_id: data.FillPrescriptionID,
        tenant_id: tenantIds[data.FillPrescriptionID] && tenantIds[data.FillPrescriptionID].toString(),
        history_log_time: data.HistorylogTime ? data.HistorylogTime : '',
        prescription_filled_amount: data.PrescriptionFilledAmt ? data.PrescriptionFilledAmt : 0,
        remaining_prescription_duration: data.RemainingPrescriptionAmt ? data.RemainingPrescriptionAmt : 0,
        is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true: false,
        created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
        updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
        createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
        updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
    }
}

module.exports = main;