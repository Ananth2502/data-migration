const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let medicalAllergies = await db.collection('patientmedicalallergy').find().toArray();
    let comorbidities = await db.collection('patientcomorbidity').find().toArray();
    let prescriptions = await db.collection('prescription').find().toArray();
    let riskFactors = await db.collection('patientriskfactor').find().toArray();
    let compliances = await db.collection('patientmedicalcompliance').find().toArray();
    let patientTransfers = await db.collection('patienttransfer').find().toArray();
    let reviews = await db.collection('patientmedicalreview').find().toArray();
    let htnPlans = await db.collection('htnplan').find().toArray();
    let bpLogs = await db.collection('bplog').find().toArray();
    let glucoseLogs = await db.collection('glucoselog').find().toArray();
    let symptoms = await db.collection('patientsymptoms').find().toArray();
    let redrisknotifications = await db.collection('redrisknotification').find().toArray();
    let facilities = await db.collection('facility').find().toArray();
    let facilityIds = {};
    facilities.forEach(facility => {
      if (facility.facility_id) facilityIds[facility.facility_id] = facility._id;
    });
    let allergyList = {};
    medicalAllergies.forEach(allergy => {
      if (!allergyList[allergy.patient_id]) {
        allergyList[allergy.patient_id] = [allergy._id];
      } else {
        allergyList[allergy.patient_id].push(allergy._id);
      }
    });
    let comorbidityList = {};
    comorbidities.forEach(comorbidity => {
      if (!comorbidityList[comorbidity.patient_id]) {
        comorbidityList[comorbidity.patient_id] = [comorbidity._id];
      } else {
        comorbidityList[comorbidity.patient_id].push(comorbidity._id);
      }
    });
    let prescriptionList = {};
    prescriptions.forEach(prescription => {
      if (!prescriptionList[prescription.patient_id]) {
        prescriptionList[prescription.patient_id] = [prescription._id];
      } else {
        prescriptionList[prescription.patient_id].push(prescription._id);
      }
    });
    let riskFactorList = {};
    riskFactors.forEach(riskFactor => {
      if (!riskFactorList[riskFactor.patient_id]) {
        riskFactorList[riskFactor.patient_id] = [riskFactor._id];
      } else {
        riskFactorList[riskFactor.patient_id].push(riskFactor._id);
      }
    });
    let complianceList = {};
    compliances.forEach(compliance => {
      if (!complianceList[compliance.patient_id]) {
        complianceList[compliance.patient_id] = [compliance._id];
      } else {
        complianceList[compliance.patient_id].push(compliance._id);
      }
    });
    let patientTransferList = {};
    patientTransfers.forEach(patientTransfer => {
      if (!patientTransferList[patientTransfer.patient_id]) {
        patientTransferList[patientTransfer.patient_id] = [patientTransfer._id];
      } else {
        patientTransferList[patientTransfer.patient_id].push(patientTransfer._id);
      }
    });
    let reviewList = {};
    reviews.forEach(review => {
      if (!reviewList[review.patient_id]) {
        reviewList[review.patient_id] = [review._id];
      } else {
        reviewList[review.patient_id].push(review._id);
      }
    });
    let htnPlanList = {};
    htnPlans.forEach(htnPlan => {
      if (!htnPlanList[htnPlan.patient_id]) {
        htnPlanList[htnPlan.patient_id] = htnPlan._id;
      } 
    });
    let bpLogList = {};
    bpLogs.forEach(bpLog => {
      if (!bpLogList[bpLog.patient_id]) {
        bpLogList[bpLog.patient_id] = [bpLog._id];
      } else {
        bpLogList[bpLog.patient_id].push(bpLog._id);
      }
    });
    let glucoseLogList = {};
    glucoseLogs.forEach(glucoseLog => {
      if (!glucoseLogList[glucoseLog.patient_id]) {
        glucoseLogList[glucoseLog.patient_id] = [glucoseLog._id];
      } else {
        glucoseLogList[glucoseLog.patient_id].push(glucoseLog._id);
      }
    });
    let symptomList = {};
    symptoms.forEach(symptom => {
      if (!symptomList[symptom.patient_id]) {
        symptomList[symptom.patient_id] = [symptom._id];
      } else {
        symptomList[symptom.patient_id].push(symptom._id);
      }
    });
    let notificationList = {};
    redrisknotifications.forEach(notification => {
      if (!notificationList[notification.patient_id]) {
        notificationList[notification.patient_id] = [notification._id];
      } else {
        notificationList[notification.patient_id].push(notification._id);
      }
    });
    // console.log('prescriptionList----------------', prescriptionList);
    let patients = await db.collection('patient').find().toArray();
    for (let index = 0; index < patients.length; index++) {
      // COMMENT OUT THIS LINE
      // patients[index].facility_id = facilityIds[patients[index].facility_id];
      patients[index].facility_id = patients[index].facility_id;
      patients[index].patient_medical_allergies = allergyList[patients[index]._id] ? allergyList[patients[index]._id] : [];
      patients[index].patient_comorbidities = comorbidityList[patients[index]._id] ? comorbidityList[patients[index]._id] : [];
      patients[index].prescription = prescriptionList[patients[index]._id] ? prescriptionList[patients[index]._id] : [];
      patients[index].patient_risk_factors = riskFactorList[patients[index]._id] ? riskFactorList[patients[index]._id] : [];
      patients[index].patient_medical_compliance = complianceList[patients[index]._id] ? complianceList[patients[index]._id] : [];
      patients[index].patient_transfer = patientTransferList[patients[index]._id] ? patientTransferList[patients[index]._id] : [];
      patients[index].patient_medical_review = reviewList[patients[index]._id] ? reviewList[patients[index]._id] : [];
      patients[index].htn_plan = htnPlanList[patients[index]._id] ? htnPlanList[patients[index]._id] : [];
      patients[index].bp_log = bpLogList[patients[index]._id] ? bpLogList[patients[index]._id] : [];
      patients[index].glucose_log = glucoseLogList[patients[index]._id] ? glucoseLogList[patients[index]._id] : [];
      patients[index].patient_symptoms = symptomList[patients[index]._id] ? symptomList[patients[index]._id] : [];
      patients[index].red_risk_notifications = notificationList[patients[index]._id] ? notificationList[patients[index]._id] : [];
      await db.collection('patient').update({ _id: patients[index]._id }, patients[index]);
    }
    console.log('Patients data successfully updated');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;