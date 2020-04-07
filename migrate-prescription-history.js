const XLSX = require('xlsx');
const filePath = './data/PrescriptionMedicationHistory.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
try {    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let PrescriptionHistorys = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let brands = await db.collection('brand').find().toArray();
    let brandIds = {};
    brands.map(brand => {
      if (brand.brand_id) {
        brandIds[brand.brand_id] = brand._id;
      }
    });
    let classifications = await db.collection('classification').find().toArray();
    let classificationIds = {};
    classifications.map(classification => {
      if (classification.classification_id) {
        classificationIds[classification.classification_id] = classification._id;
      }
    });
    let dosageforms = await db.collection('dosageform').find().toArray();
    let dosageformIds = {};
    dosageforms.map(dosageform => {
      if (dosageform.dosageform_id) {
        dosageformIds[dosageform.dosageform_id] = dosageform._id;
      }
    });
    let dosagefrequencys = await db.collection('dosagefrequency').find().toArray();
    let dosagefrequencyIds = {};
    dosagefrequencys.map(dosagefrequency => {
      if (dosagefrequency.dosage_freq_id) {
        dosagefrequencyIds[dosagefrequency.dosage_freq_id] = dosagefrequency._id;
      }
    });
    let dosageunits = await db.collection('dosageunit').find().toArray();
    let dosageunitIds = {};
    dosageunits.map(dosageunit => {
      if (dosageunit.dosage_unit_id) {
        dosageunitIds[dosageunit.dosage_unit_id] = dosageunit._id;
      }
    });
    let medications = await db.collection('medication').find().toArray();
    let medicationIds = {};
    medications.map(medication => {
      if (medication.medication_id) {
        medicationIds[medication.medication_id] = medication._id;
      }
    });
    let patients = await db.collection('patient').find().toArray();
    let patientIds = {};
    let tenantIds = {};
    patients.map(patient => {
      if (patient.temp_id) {
        patientIds[patient.temp_id] = patient._id;
        tenantIds[patient.temp_id] = patient.tenant_id;
      }
    });
    let fillprescriptionhistorys = await db.collection('fillprescriptionhistory').find().toArray();
    let fillprescriptionhistoryIds = {};
    fillprescriptionhistorys.map(fillprescriptionhistory => {
      if (fillprescriptionhistory.fillprescriptionhistory_id) {
        fillprescriptionhistoryIds[fillprescriptionhistory.fillprescriptionhistory_id] = fillprescriptionhistory._id;
      }
    });
    PrescriptionHistorys = PrescriptionHistorys.map(prescriptionhistory => {
      return constructData(prescriptionhistory, userIds, brandIds, classificationIds, dosageformIds, dosagefrequencyIds, dosageunitIds, medicationIds, patientIds, fillprescriptionhistoryIds, tenantIds);
    });
    await db.collection('prescriptionhistory').insertMany(PrescriptionHistorys);
    console.log('Prescription Histories created successfully');
    client.close();
   } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, brandIds, classificationIds, dosageformIds, dosagefrequencyIds, dosageunitIds, medicationIds, patientIds, fillprescriptionhistoryIds, tenantIds) => {
  return {
    prescriptionhistory_id: data.PrescriptionMedicationHistoryID,
    prescription_id: data.PrescriptionMedicationID,
    brand_id: brandIds[data.MedicationBrandNameID],
    classification_id: classificationIds[data.MedicationClassificationID],
    dosage_form_id: dosageformIds[data.DosageFormID],
    dosage_freq_id: dosagefrequencyIds[data.DosageFrequencyID],
    dosage_strength: data.DosageAmount ? data.DosageAmount.toString() : '',
    dosage_unit_id: dosageunitIds[data.DosageUnitID],
    end_date: data.EndDatetime ? data.EndDatetime.toISOString() : '',
    exist_presc_duration: data.ExistingPrescDuration ? data.ExistingPrescDuration : 0,
    // ID
    fill_prescription_history: fillprescriptionhistoryIds[data.PrescriptionMedicationHistoryID], 
    instruction_note: data.InstructionNote ? data.InstructionNote : '',
    is_ph_visible: (data.IsPhoneNoVisible && data.IsPhoneNoVisible.toLowerCase() == 't') ? true : false,
    medication_id: medicationIds[data.MedicationNameID],
    other_brand_name: data.OtherMedBrandName ? data.OtherMedBrandName : '',
    other_classification_name: data.OtherClassificationName ? data.OtherClassificationName : '',
    other_freq_name: data.OtherDosageFrequency ? data.OtherDosageFrequency : '',
    other_medication_name: data.OtherMedicationName ? data.OtherMedicationName : '',
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    presc_duration: data.PrescriptionDuration ? data.PrescriptionDuration : 0,
    signature: data.Signature ? data.Signature : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : ''
  };
}

module.exports = main;