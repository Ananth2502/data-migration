const XLSX = require('xlsx');
const filePath = './data/network.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let networks = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('networks----------------', networks);
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
    networks = networks.map(network => {
      return constructData(network, userIds, countryIds);
    });
    // console.log('networks--------+++++++++++--------', networks);
    await db.collection('network').insertMany(networks);
    console.log('Networks created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, countryIds) => {
  return {
    network_id: data.NetworkID,
    name: data.NetworkName ? data.NetworkName : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    country: countryIds[data.CountryID]
  };
}

module.exports = main;