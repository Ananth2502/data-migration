const XLSX = require('xlsx');
const filePath = './data/facility-type.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let facilityTypes = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let facilityTypeMapper = {
      'BP Check Locations': 'BP Glucose Assessment Locations',
      'Pharmacies': 'Pharmacies',
      'Health Care Facilities': 'Health Care Facilities'
    };
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    facilityTypes = facilityTypes.map(facilityType => {
      return constructData(facilityType, userIds, facilityTypeMapper);
    });
    // console.log('facilityTypes---------++++++++++------', facilityTypes);
    await db.collection('facilitytype').insertMany(facilityTypes);

    console.log('Facility Types created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, facilityTypeMapper) => {
  return {
    facility_type_id: data.FacilityTypeID,
    type: data.FacilityTypeName ? facilityTypeMapper[data.FacilityTypeName] : '',
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
  }
}

module.exports = main;