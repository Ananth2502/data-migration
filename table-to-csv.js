const pg = require('pg');
const conString = "postgres://postgres:password@localhost:5432/mdt_feb5";
const client = new pg.Client(conString);

const main = async () => {
  try {
    await client.connect();
    await client.query(`UPDATE "RiskFactor" SET "RiskFactorName" = regexp_replace("RiskFactorName", ';', ',', 'gi');`);
    await generateCsv('User', 'user');
    await generateCsv('Comorbidity', 'comorbidity');
    await generateCsv('Symptom', 'symptom');
    await generateCsv('MedicationCompliance', 'medical-compliance');
    await generateCsv('Country', 'country');
    await generateCsv('County', 'county');
    await generateCsv('SubCounty', 'subcounty');
    await generateCsv('MedicationAllergy', 'medication-allergy');
    await generateCsv('PatientInfo', 'patient-info');
    await generateCsv('PatientHealthInfo', 'patient-health-info');
    await generateCsv('Insurance', 'insurance');
    await generateCsv('PatientMedicationAllergy', 'patient-medical-allergy');
    await generateCsv('PatientComorbidity', 'patient-comorbidity');
    await generateCsv('RiskFactor', 'risk-factor');
    await generateCsv('PatientRiskfactor', 'patient-risk-factor');
    await generateCsv('GlucoseLog', 'glucose-log');
    await generateCsv('BPLog', 'bplog');
    await generateCsv('EnrollmentBPLog', 'enrollment-bplog');
    await generateCsv('PatientMedicationCompliance', 'patient-medication-compliance');
    await generateCsv('PatientSymptom', 'patient-symptom');
    await generateCsv('FacilityType', 'facility-type');
    await generateCsv('Facility', 'facility');
    await generateCsv('FacilityTypeMap', 'facility-type-map');
    await generateCsv('FacilityContact', 'facility-contact');
    await generateCsv('Transfer', 'patient-transfer');
    await generateCsv('TransferHistory', 'patient-transfer-history');
    await generateCsv('RedRiskNotification', 'red-risk-notification');
    await generateCsv('BPLogDetail', 'bplog-detail');
    await generateCsv('LabTest', 'lab-test');
    await generateCsv('PatientLabTest', 'patient-lab-test');
    await generateCsv('HTNPlan', 'htn-plan');
    await generateCsv('HTNPlanHistory', 'htn-plan-history');
    await generateCsv('PatientMedicalReview', 'patient-medical-review');
    await generateCsv('ClinicalReviewNote', 'clinical-review-note');
    await generateCsv('NutritionCounseling', 'nutrition-counseling');
    await generateCsv('PhysicalExamination', 'physical-examination');
    // await generateCsv('Complication', 'complication');
    await generateCsv('HealthcareUtilization', 'healthcare-utilization');
    await generateCsv('TrainingMaterial', 'training-material');
    await generateCsv('Network', 'network');
    await generateCsv('FacilityNetwork', 'facility-network');
    await generateCsv('DosageFrequency', 'dosage-frequency');
    await generateCsv('DosageUnit', 'dosage-unit');
    await generateCsv('BPCheckFrequency', 'bpcheck-frequency');
    await generateCsv('HbA1cCheckFrequency', 'hba1c-check-frequency');
    await generateCsv('DeviceInfo', 'device-details');
    await generateCsv('PatientReviewLog', 'patient-review-log');
    await generateCsv('ScreeningLog', 'screening-log');
    await generateCsv('VersionNo', 'version');
    await generateCsv('MedicationName', 'MedicationName');
    await generateCsv('DosageForm', 'DosageForm');
    await generateCsv('MedicationClassification', 'MedicationClassification');
    await generateCsv('MedBrandNameCountry', 'MedBrandNameCountry');
    await generateCsv('MedicationBrandName', 'MedicationBrandName');
    await generateCsv('MedclassBrand', 'MedclassBrand');
    await generateCsv('PrescriptionMedication', 'PrescriptionMedication');
    await generateCsv('PrescriptionMedicationHistory', 'PrescriptionMedicationHistory');
    await generateCsv('FillPrescription', 'FillPrescription');
    await generateCsv('FillPrescriptionHistory', 'FillPrescriptionHistory');
    await generateCsv('Role', 'role');
    await generateCsv('UserRole', 'user-role');
    await generateCsv('UserContact', 'user-contact');
    await generateCsv('UserBusinessFunction', 'user-business-function');
    await generateCsv('PatientPhoneNumber', 'patient-phone-number');
    console.log('Tables exported successfully');
    await client.end();
  } catch (err) {
    console.log('err------------', err);
  }
}

const generateCsv = async (tableName, fileName) => {
  await client.query(`COPY "${tableName}" TO '/home/ubuntu/Proj/migrate/data-migration-mar18/data-migration-csv/data-migration-csv/data/${fileName}.csv' DELIMITER ',' CSV HEADER;`);
}

module.exports = main();