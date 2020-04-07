const XLSX = require('xlsx');
const filePath = './data/device-details.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { raw: true });
    let deviceDetails = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('deviceDetails-------------', deviceDetails);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    deviceDetails = deviceDetails.map(deviceDetail => {
      return constructData(deviceDetail, userIds);
    });
    // console.log('deviceDetails-------+++++++------', deviceDetails);
    await db.collection('devicedetails').insertMany(deviceDetails);
    console.log('Device Details created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds) => {
  return {
    device_info_id: data.DeviceInfoID,
    name: data.DeviceName ? data.DeviceName : '',
    model: data.DeviceModel ? data.DeviceModel : '',
    device_id: data.DeviceID ? data.DeviceID : '',
    type: data.PlatformName ? data.PlatformName : '',
    version: data.PlatformVersion ? data.PlatformVersion : '',
    rsa_public_key: data.RSAPublicKey ? `-----BEGIN RSA PUBLIC KEY-----\n${data.RSAPublicKey}\n-----END RSA PUBLIC KEY-----\n` : '',
    rsa_private_key: data.RSAPrivateKey ? data.RSAPrivateKey : '',
    is_deleted: (data.Status && data.Status.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: new Date(data.CreatedDatetime),
    updatedAt: new Date(data.UpdatedDatetime)
  };
}

module.exports = main;