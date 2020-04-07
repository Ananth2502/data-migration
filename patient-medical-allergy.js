const XLSX = require('xlsx');
const filePath = './data/patient-medical-allergy.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let medicalAllergies = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let allergies = await db.collection('medicationallergy').find().toArray();
    let allergyIds = {};
    allergies.forEach(allergy => {
      if (allergy.medication_allergy_id)
        allergyIds[allergy.medication_allergy_id] = allergy._id;
    });
    let patients = await db.collection('patient').find().toArray();
    let patientIds = {};
    let tenantIds = {};
    patients.forEach(patient => {
      if (patient.temp_id) patientIds[patient.temp_id] = patient._id;
      if (patient.temp_id) tenantIds[patient.temp_id] = patient.tenant_id;
    });
    medicalAllergies = medicalAllergies.map(medicalAllergy => {
      return constructData(medicalAllergy, userIds, allergyIds, patientIds, tenantIds);
    });
    // console.log('medicalallergies-------------------', medicalAllergies);
    await db.collection('patientmedicalallergy').insertMany(medicalAllergies);
    console.log('Patient Medical Allergies created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, allergyIds, patientIds, tenantIds) => {
  return {
    patient_medical_allergy_id: data.PatientMedicationAlleryID,
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    medical_allergy_id: allergyIds[data.MedicationAllergyID],
    other_allergy: data.OtherMedicationAllergy ? data.OtherMedicationAllergy : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
  };
}

module.exports = main;