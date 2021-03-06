const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';


const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    await purgeTempFields(db, 'users', { 'user_id': 1 });
    await purgeTempFields(db, 'bpcheckfrequency', { 'bpcheck_freq_id': 1 });
    await purgeTempFields(db, 'bplog', { 'bplog_id': 1 });
    await purgeTempFields(db, 'bplogdetail', { 'bplog_detail_enrol_id': 1, 'bplog_detail_id': 1});
    await purgeTempFields(db, 'brand', { 'brand_id': 1 });
    await purgeTempFields(db, 'classification', { 'classification_id': 1 });
    await purgeTempFields(db, 'classificationbrand', { 'classificationbrand_id': 1 });
    await purgeTempFields(db, 'comorbidity', { 'comorbidity_id': 1 });
    await purgeTempFields(db, 'complication', { 'complication_id': 1 });
    await purgeTempFields(db, 'country', { 'country_id': 1 });
    await purgeTempFields(db, 'countryclassification', { 'countryclassification_id': 1 });
    await purgeTempFields(db, 'county', { 'county_id': 1 });
    await purgeTempFields(db, 'devicedetails', { 'device_info_id': 1 });
    await purgeTempFields(db, 'dosageform', { 'dosageform_id': 1 });
    await purgeTempFields(db, 'dosagefrequency', { 'dosage_freq_id': 1 });
    await purgeTempFields(db, 'dosageunit', { 'dosage_unit_id': 1 });
    await purgeTempFields(db, 'facility', { 'facility_id': 1 });
    await purgeTempFields(db, 'facilitynetwork', { 'facility_network_id': 1 });
    await purgeTempFields(db, 'facilitytype', { 'facility_type_id': 1 });
    await purgeTempFields(db, 'fillprescription', { 'fillprescription_id': 1 });
    await purgeTempFields(db, 'fillprescriptionhistory', { 'fillprescriptionhistory_id': 1, 'prescription_id': 1 });
    await purgeTempFields(db, 'glucoselog', { 'glucose_log_id': 1 });
    await purgeTempFields(db, 'hba1ccheckfrequency', { 'hba1c_freq_id': 1 });
    await purgeTempFields(db, 'healthcareutilization', { 'healthcare_id': 1 });
    await purgeTempFields(db, 'htnplan', { 'htnplan_id': 1 });
    await purgeTempFields(db, 'htnplanhistory', { 'htnplan_history_id': 1 });
    await purgeTempFields(db, 'labtest', { 'labtest_id': 1 });
    await purgeTempFields(db, 'medicalcompliance', { 'medical_compliance_id': 1 });
    await purgeTempFields(db, 'medication', { 'medication_id': 1 });
    await purgeTempFields(db, 'medicationallergy', { 'medication_allergy_id': 1 });
    await purgeTempFields(db, 'medicationcountrydetail', { 'medicationcountry_id': 1 });
    await purgeTempFields(db, 'network', { 'network_id': 1 });
    await purgeTempFields(db, 'organizations', { 'facility_id': 1 });
    await purgeTempFields(db, 'patient', { 'temp_id': 1 });
    await purgeTempFields(db, 'patientclinicalreviewnote', { 'clinical_review_note': 1,  });
    await purgeTempFields(db, 'patientcomorbidity', { 'patient_comorbidity_id': 1 });
    await purgeTempFields(db, 'patientlabtest', { 'patient_labtest_id': 1 });
    await purgeTempFields(db, 'patientmedicalallergy', { 'patient_medical_allergy_id': 1 });
    await purgeTempFields(db, 'patientmedicalcompliance', { 'patient_med_compliance_id': 1 });
    await purgeTempFields(db, 'patientmedicalreview', { 'medical_review_id': 1, 'tb_screening': 1 });
    await purgeTempFields(db, 'patientnutritioncounseling', { 'nutrition_id': 1 });
    await purgeTempFields(db, 'patientphysicalexamination', { 'phy_exam_id': 1 });
    await purgeTempFields(db, 'patientreviewlog', { 'patient_review_log_id': 1 });
    await purgeTempFields(db, 'patientriskfactor', { 'patient_riskfactor_id': 1 });
    await purgeTempFields(db, 'patientsymptoms', { 'patient_symptom_id': 1 });
    await purgeTempFields(db, 'patienttransfer', { 'transfer_id': 1 });
    await purgeTempFields(db, 'patienttransferhistory', { 'transfer_history_id': 1 });
    await purgeTempFields(db, 'prescription', { 'prescription_id': 1 });
    await purgeTempFields(db, 'prescriptionhistory', { 'prescriptionhistory_id': 1, 'prescription_id': 1});
    await purgeTempFields(db, 'redrisknotification', { 'red_risk_id': 1 });
    await purgeTempFields(db, 'riskfactor', { 'riskfactor_id': 1 });
    await purgeTempFields(db, 'screeninglog', { 'screening_log_id': 1 });
    await purgeTempFields(db, 'subcounty', { 'subcounty_id': 1 });
    await purgeTempFields(db, 'symptom', { 'symptom_id': 1 });
    await purgeTempFields(db, 'trainingmaterial', { 'training_material_id': 1 });

    console.log('Temporary Fields have been removed successfully');
    await client.close();
  } catch (err) {
    console.log('err------------', err);
  }
}

const purgeTempFields = async (db, tableName, temporaryFields) => {
  await db.collection(tableName).updateMany({}, {$unset: temporaryFields});
};

module.exports = main();