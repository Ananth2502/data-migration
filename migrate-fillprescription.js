const XLSX = require('xlsx');
const filePath = './data/FillPrescription.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
    try {        // Connects to the remote mongoDB server
        let client = await MongoClient.connect(url);
        // Connects to the mongo database running on default port - test_db_4  
        let db = await client.db();
        // Reads the input CSV file: FillPrescription.csv
        let workbook = XLSX.readFile(filePath, { cellDates: true });
        // Fill Prescription - array of objects
        let FillPrescriptionEntries = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        // Fetch all the users, migrated from Postgres, convert to JS array 
        let users = await db.collection('users').find().toArray();
        let userIds = {};
        users.map(user => {
            if (user.user_id) {
                // Construct object that maps all the postgres userIds to the mongoDB objectIDs
                userIds[user.user_id] = user._id;
            }
        });
        let prescriptions = await db.collection('prescription').find().toArray();
        let prescriptionIds = {};
        let tenantIds = {};
        prescriptions.map(prescription => {
            if (prescription.prescription_id) {
                prescriptionIds[prescription.prescription_id] = prescription._id;
                tenantIds[prescription.prescription_id] = prescription.tenant_id;
            }
        });
        // FillPrescriptions to insert into MongoDB
        FillPrescriptionEntries = FillPrescriptionEntries.map(FillPrescriptionEntry => {
            return constructData(FillPrescriptionEntry, userIds, prescriptionIds, tenantIds);
        });
        await db.collection('fillprescription').insertMany(FillPrescriptionEntries);
        console.log('Fill Prescriptions created successfully');
        client.close();
    } catch (error) {
        console.log(error);
    }
}

// Map the postgres fields to mongoDB fields
const constructData = (data, userIds, prescriptionIds, tenantIds) => {
    return {
        // Preserve Postgres ID
        fillprescription_id: data.FillPrescriptionID,
        // array of references 
        prescription_filled_amount: data.PrescriptionFilledAmt ? data.PrescriptionFilledAmt : 0,
        // reference to prescription_id
        prescription_id: prescriptionIds[data.PrescriptionMedicationID],
        tenant_id: tenantIds[data.PrescriptionMedicationID] && tenantIds[data.PrescriptionMedicationID].toString(),
        remaining_prescription_duration: data.RemainingPrescriptionAmt ? data.RemainingPrescriptionAmt : 0,
        is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
        created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
        updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
        createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
        updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
    }
}

module.exports = main;