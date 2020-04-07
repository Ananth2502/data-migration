const XLSX = require('xlsx');
const filePath = './data/screening-log.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let logs = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let deviceDetails = await db.collection('devicedetails').find().toArray();
    let deviceIds = {};
    deviceDetails.forEach(deviceDetail => {
      if (deviceDetail.device_info_id) deviceIds[deviceDetail.device_info_id] = deviceDetail._id;
    });
    let facilities = await db.collection('facility').find().toArray();
    let facilityIds = {};
    let tenantIds = {};
    facilities.forEach(facility => {
      if (facility.facility_id) facilityIds[facility.facility_id] = facility._id;
      if (facility.facility_id) tenantIds[facility.facility_id] = facility.tenant_id;
    });
    let countyIds = {};
    let counties = await db.collection('county').find().toArray();
    counties.forEach(county => {
      if (county.county_id) countyIds[county.county_id] = county._id;
    });
    let subcountyIds = {};
    let subcounties = await db.collection('subcounty').find().toArray();
    subcounties.forEach(subcounty => {
      if (subcounty.subcounty_id) subcountyIds[subcounty.subcounty_id] = subcounty._id;
    });
    logs = logs.map(log => {
      return constructData(log, userIds, deviceIds, facilityIds, countyIds, subcountyIds, tenantIds);
    });
    // console.log('logs--------+++++++++-------', logs);
    await db.collection('screeninglog').insertMany(logs);
    console.log('Screening logs created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, deviceIds, facilityIds, countyIds, subcountyIds, tenantIds) => {
  let post_meal = '6_hrs_post_meal';
  return {
    screening_log_id: data.ScreeningLogID,
    device_info_id: deviceIds[data.DeviceInfoID] ? deviceIds[data.DeviceInfoID] : '',
    request_id: data.RequestID ? data.RequestID.toString() : '',
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    country_code: data.CountryCode ? data.CountryCode.toString() : '',
    facility_id: facilityIds[data.FacilityID],
    tenant_id: tenantIds[data.FacilityID] && tenantIds[data.FacilityID].toString(),
    systolic_1: data.Systolic_1 ? Number(data.Systolic_1) : 0,
    diastolic_1: data.Diastolic_1 ? Number(data.Diastolic_1) : 0,
    pulse_1: data.Pulse_1 ? Number(data.Pulse_1) : 0,
    systolic_2: data.Systolic_2 ? Number(data.Systolic_2) : 0,
    diastolic_2: data.Diastolic_2 ? Number(data.Diastolic_2) : 0,
    pulse_2: data.Pulse_2 ? Number(data.Pulse_2) : 0,
    rbs: data.RBS ? Number(data.RBS) : 0,
    fbs: data.FBS ? Number(data.FBS) : 0,
    hba1c: data.HbA1C ? Number(data.HbA1C) : 0,
    ogtt: data.OGTT ? Number(data.OGTT) : 0,
    [post_meal]: (data['6hrs_Post_Meal'] && data['6hrs_Post_Meal'].toLowerCase() == 't') ? true : false,
    first_name: data.FirstName ? data.FirstName : '',
    last_name: data.LastName ? data.LastName : '',
    phone_number: data.PhoneNumber ? data.PhoneNumber.toString() : '',
    county_id: countyIds[data.CountyID],
    subcounty_id: subcountyIds[data.SubCountyID],
    gender: data.Gender ? data.Gender : '',
    age: data.Age ? Number(data.Age) : 0,
    height: data.Height ? Number(data.Height) : 0,
    weight: data.Weight ? Number(data.Weight) : 0,
    bmi: data.BMI ? Number(data.BMI) : 0,
    waist_size: data.WaistSize ? Number(data.WaistSize) : 0,
    date_of_birth: data.DateOfBirth ? data.DateOfBirth : {},
    htn_diagnosis: (data.HTN_Diagnosis && data.HTN_Diagnosis.toLowerCase() == 't') ? true : false,
    htn_on_treatment: (data.HTN_On_Treatment && data.HTN_On_Treatment.toLowerCase() == 't') ? true : false,
    dbm_diagnosis: (data.DBM_Diagnosis && data.DBM_Diagnosis.toLowerCase() == 't') ? true : false,
    dbm_on_Treatment: (data.DBM_On_Treatment && data.DBM_On_Treatment.toLowerCase() == 't') ? true : false,
    alcohol_usage: (data.Alcohol_usage && data.Alcohol_usage.toLowerCase() == 't') ? true : false,
    tobacco_usage: (data.Tobacco_usage && data.Tobacco_usage.toLowerCase() == 't') ? true : false,
    refer_assessment: (data.Refer_Assessment && data.Refer_Assessment.toLowerCase() == 't') ? true : false,
    town_name: data.TownName ? data.TownName : ''
  }
}

module.exports = main;