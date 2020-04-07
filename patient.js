const XLSX = require('xlsx');
const filePath1 = './data/patient-info.csv';
const filePath2 = './data/patient-health-info.csv';
const filePath3 = './data/insurance.csv';
const filePath4 = './data/patient-phone-number.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook1 = XLSX.readFile(filePath1, { cellDates: true });
    let patientInfo = XLSX.utils.sheet_to_json(workbook1.Sheets[workbook1.SheetNames[0]]);
    // console.log('patientInfo---------------', patientInfo);
    let workbook2 = XLSX.readFile(filePath2, { cellDates: true });
    let patientHealthInfo = XLSX.utils.sheet_to_json(workbook2.Sheets[workbook2.SheetNames[0]]);
    // console.log('patientHealthInfo---------------', patientHealthInfo);
    let workbook3 = XLSX.readFile(filePath3, { cellDates: true });
    let insurance = XLSX.utils.sheet_to_json(workbook3.Sheets[workbook3.SheetNames[0]]);
    // console.log('insurance---------------', insurance);
    let workbook4 = XLSX.readFile(filePath4, { cellDates: true });
    let phoneNumber = XLSX.utils.sheet_to_json(workbook4.Sheets[workbook4.SheetNames[0]]);
    let patientData = {};
    patientInfo.forEach(patient => {
      if (patient.PatientID) patientData[patient.PatientID] = patient;
    });
    patientHealthInfo.forEach(healthInfo => {
      if (healthInfo.PatientID) patientData[healthInfo.PatientID].healthInfo = healthInfo;
    });
    insurance.forEach(data => {
      if (data.PatientID) patientData[data.PatientID].insurance = data;
    });
    phoneNumber.forEach(data => {
      if (data.PatientID) patientData[data.PatientID].phoneNumber = data;
    });
    // console.log('patientData--------------', patientData);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let countryIds = {};
    let countries = await db.collection('country').find().toArray();
    countries.forEach(country => {
      if (country.name) countryIds[country.name] = country._id;
    });
    // console.log('countryIds---------------', countryIds);
    let countyIds = {};
    let counties = await db.collection('county').find().toArray();
    counties.forEach(county => {
      if (county.county_id) countyIds[county.county_id] = county._id;
    });
    // console.log('countyIds---------------', countyIds);
    let subcountyIds = {};
    let subcounties = await db.collection('subcounty').find().toArray();
    subcounties.forEach(subcounty => {
      if (subcounty.subcounty_id) subcountyIds[subcounty.subcounty_id] = subcounty._id;
    });
    // console.log('subcountyIds---------------', subcountyIds);
    let facilities = await db.collection('facility').find().toArray();
    let facilityIds = {};
    let tenantIds = {};
    facilities.forEach(facility => {
      if (facility.facility_id) tenantIds[facility.facility_id] = facility.tenant_id;
      if (facility.facility_id) facilityIds[facility.facility_id] = facility._id;
    });
    let res = [];
    for (let id in patientData) {
      res.push(constructData(patientData[id], userIds, countryIds, countyIds, subcountyIds, tenantIds, facilityIds));
    }
    // console.log('res------------------', res);
    await db.collection('patient').insertMany(res);
    console.log('Patients created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, countryIds, countyIds, subcountyIds, tenantIds, facilityIds) => {
  return {
    temp_id: data.PatientID,
    patient_id: data.AkomapaID ? Number(data.AkomapaID) : 0,
    first_name: data.FirstName ? data.FirstName : '',
    last_name: data.LastName ? data.LastName : '',
    country: countryIds[data.CountryName],
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    phone: data.phoneNumber.PhoneNumber ? data.phoneNumber.PhoneNumber.toString() : '',
    alternate_phone: data.phoneNumber.AlternatePhoneNumber ? data.phoneNumber.AlternatePhoneNumber.toString() : '',
    sequence_id: data.AkomapaID ? Number(data.AkomapaID) : 0,
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    is_active: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? false : true,
    facility_id: facilityIds[data.FacilityID],
    tenant_id: tenantIds[data.FacilityID] && tenantIds[data.FacilityID].toString(),
    gender: data.Gender ? data.Gender : '',
    is_reviewed: (data.Reviewed && data.Reviewed.toLowerCase() == 't') ? true : false,
    is_license_accepted: (data.LicenseAcceptance && data.LicenseAcceptance.toLowerCase() == 't') ? true : false,
    national_id: data.NationalID ? data.NationalID : '',
    county: countyIds[data.CountyID],
    sub_county: subcountyIds[data.SubCountyID],
    town_name: data.town_name ? data.town_name : '',
    occupation: data.occupation ? data.occupation : '',
    education: data.education ? data.education : '',
    treatment_coach: data.TreatmentCoach ? data.TreatmentCoach : '',
    treatment_coach_phone: data.TreatmentCoach_Phone ? data.TreatmentCoach_Phone : '',
    is_pfa: (data.HasPatientAppAccess && data.HasPatientAppAccess.toLowerCase() == 't') ? true : false,
    national_health_insurance: (data.HasInsurance && data.HasInsurance.toLowerCase() == 't') ? true : false,
    user_id: userIds[data.UserID],
    age: data.healthInfo.Age ? Number(data.healthInfo.Age) : 0,
    height: data.healthInfo.Height ? Number(data.healthInfo.Height) : 0,
    weight: data.healthInfo.Weight ? Number(data.healthInfo.Weight) : 0,
    bmi: data.healthInfo.BMI ? data.healthInfo.BMI.toString() : '',
    is_pregnant: (data.healthInfo.IsPatientPregnant && data.healthInfo.IsPatientPregnant.toLowerCase() == 't') ? true : false,
    birth_day: data.healthInfo.DateOfBirth ? data.healthInfo.DateOfBirth.toString() : '',
    htn_diagnosis: (data.healthInfo.HTN_Diagnosis && data.healthInfo.HTN_Diagnosis.toLowerCase() == 't') ? true : false,
    htn_year_of_diagnosis: data.healthInfo.HTN_Year_of_Diagnosis ? Number(data.healthInfo.HTN_Year_of_Diagnosis) : 0,
    dbm_diagnosis: (data.healthInfo.Diabetes_Diagnosis_Status && data.healthInfo.Diabetes_Diagnosis_Status.toLowerCase() == 't') ? true : false,
    diabetes_type: data.healthInfo.Diabetes_Type ? Number(data.healthInfo.Diabetes_Type) : 0,
    dbm_year_of_diagnosis: data.healthInfo.DBM_Year_of_Diagnosis ? Number(data.healthInfo.DBM_Year_of_Diagnosis) : 0,
    insulin_dependent: (data.healthInfo.Insulin_Dependent && data.healthInfo.Insulin_Dependent.toLowerCase() == 't') ? true : false,
    waist_size: data.healthInfo.WaistSize ? Number(data.healthInfo.WaistSize) : 0,
    temperature: data.healthInfo.Tempreture ? Number(data.healthInfo.Tempreture) : 0,
    htn_patient_on_treatment: (data.healthInfo.HTN_Patient_on_Treatment && data.healthInfo.HTN_Patient_on_Treatment.toLowerCase() == 't') ? true : false,
    dbm_patient_on_treatment: (data.healthInfo.DBM_Patient_on_Treatment && data.healthInfo.DBM_Patient_on_Treatment.toLowerCase() == 't') ? true : false,
    diabetes_diagnosis: data.healthInfo.DBM_Diagnosis ? Number(data.healthInfo.DBM_Diagnosis) : 0,
    insurance_code: data.insurance.InsuranceCode ? data.insurance.InsuranceCode : '',
    insurance_type: data.insurance.InsuranceType ? data.insurance.InsuranceType : ''
  };
}

module.exports = main;