const XLSX = require('xlsx');
const filePath = './data/facility-network.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
  let client = await MongoClient.connect(url);
  let db = await client.db();
  let workbook = XLSX.readFile(filePath, { cellDates: true });
  let facilityNetworks = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  // console.log('facilityNetworks------------------', facilityNetworks);
  let users = await db.collection('users').find().toArray();
  let userIds = {};
  users.forEach(user => {
    if (user.user_id) userIds[user.user_id] = user._id;
  });
  let facilities = await db.collection('facility').find().toArray();
  let facilityIds = {};
  facilities.forEach(facility => {
    if (facility.facility_id) facilityIds[facility.facility_id] = facility._id;
  });
  let networks = await db.collection('network').find().toArray();
  let networkIds = {};
  networks.forEach(network => {
    if (network.network_id) networkIds[network.network_id] = network._id;
  });
  facilityNetworks = facilityNetworks.map(facilityNetwork => {
    return constructData(facilityNetwork, userIds, facilityIds, networkIds);
  });
  // console.log('facilityNetworks---------+++++++---------', facilityNetworks);
  await db.collection('facilitynetwork').insertMany(facilityNetworks);
  console.log('Facility network created successfully');
  client.close();
  } catch (error) {
    console.log(error);
}
}

const constructData = (data, userIds, facilityIds, networkIds) => {
  return {
    facility_network_id: data.FacilityNetworkID,
    facility: facilityIds[data.FacilityID],
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    network: networkIds[data.NetworkID]
  }
}

module.exports = main;