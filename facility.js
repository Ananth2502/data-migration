const XLSX = require('xlsx');
const filePath1 = './data/facility.csv';
const filePath2 = './data/facility-type-map.csv';
const filePath3 = './data/facility-contact.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook1 = XLSX.readFile(filePath1, { cellDates: true });
    let facilityList = XLSX.utils.sheet_to_json(workbook1.Sheets[workbook1.SheetNames[0]]);
    let workbook2 = XLSX.readFile(filePath2, { cellDates: true });
    let facilityTypeMaps = XLSX.utils.sheet_to_json(workbook2.Sheets[workbook2.SheetNames[0]]);
    let workbook3 = XLSX.readFile(filePath3, { cellDates: true });
    let facilityContacts = XLSX.utils.sheet_to_json(workbook3.Sheets[workbook3.SheetNames[0]]);
    // console.log('facilityList-------------------', facilityList);
    // console.log('facilityTypeMaps-------------------', facilityTypeMaps);
    // console.log('facilityContacts-------------------', facilityContacts);
    let facilities = {};
    facilityList.forEach(facility => {
      if (facility.FacilityID) facilities[facility.FacilityID] = facility;
    });
    facilityTypeMaps.forEach(type => {
      if (type.FacilityID) facilities[type.FacilityID].type = type.FacilityTypeID;
    });
    facilityContacts.forEach(contact => {
      if (contact.FacilityID) facilities[contact.FacilityID].phone = contact.PhoneNumber;
    });
    // console.log('facilities-------------------', facilities);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let countries = await db.collection('country').find().toArray();
    let countryIds = {};
    countries.forEach(country => {
      if (country.country_id) countryIds[country.country_id] = country._id;
    });
    let types = await db.collection('facilitytype').find().toArray();
    let typeIds = {};
    types.forEach(type => {
      if (type.facility_type_id) typeIds[type.facility_type_id] = type._id;
    });
    let organizations = await db.collection('organizations').find().toArray();
    let organizationIds = {};
    organizations.map(organization => {
      if (organization.facility_id) organizationIds[organization.facility_id] = organization._id;
    });
    let res = [];
    for (let id in facilities) {
      res.push(constructData(facilities[id], userIds, countryIds, typeIds, organizationIds));
    }
    // console.log('res---------++++++++++------', res);
    await db.collection('facility').insertMany(res);
    console.log('Facilities created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, countryIds, typeIds, organizationIds) => {
  return {
    facility_id: data.FacilityID,
    tenant_id: organizationIds[data.FacilityID] && organizationIds[data.FacilityID].toString(),
    name: data.FacilityName ? data.FacilityName : '',
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    description: data.FacilityShortDescription ? data.FacilityShortDescription : '',
    country: countryIds[data.CountryID],
    address: data.Address ? data.Address : '',
    city_town: data.City ? data.City : '',
    max_no_hcp: data.MaxNofHCP ? data.MaxNofHCP : 0,
    max_no_patient: data.MaxNofPatPharma ? data.MaxNofPatPharma : 0,
    facility_type: typeIds[data.type],
    phone_number: data.phone ? data.phone.toString() : ''
  };
}

module.exports = main;