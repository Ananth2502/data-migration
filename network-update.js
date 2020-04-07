const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let facilityNetworks = await db.collection('facilitynetwork').find().toArray();
    let facilities = {};
    facilityNetworks.forEach(facilityNetwork => {
      if (!facilities[facilityNetwork.network]) {
        facilities[facilityNetwork.network] = [facilityNetwork.facility];
      } else {
        facilities[facilityNetwork.network].push(facilityNetwork.facility);
      }
    });
    // console.log('facilities----------------', facilities);
    let networks = await db.collection('network').find().toArray();
    for (let index = 0; index < networks.length; index++) {
      networks[index].facilities = (facilities[networks[index]._id] && facilities[networks[index]._id].length) ? facilities[networks[index]._id] : [];
      db.collection('network').update({ _id: networks[index]._id }, networks[index]);
    }
    networks.forEach(network => {
    });
    console.log('Networks successfully updated');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;