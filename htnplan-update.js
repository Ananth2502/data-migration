const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let htnplanHisData = await db.collection('htnplanhistory').find().toArray();
    let htnplanhistory = {};
    htnplanHisData.forEach(historyData => {
      if (!htnplanhistory[historyData.htnplan_id]) {
        htnplanhistory[historyData.htnplan_id] = [historyData._id];
      } else {
        htnplanhistory[historyData.htnplan_id].push(historyData._id);
      }
    });
    // console.log('htnplanhistory----------------', htnplanhistory);
    let htnplans = await db.collection('htnplan').find().toArray();
    for (let index = 0; index < htnplans.length; index++) {
      htnplans[index].htn_plan_history = (htnplanhistory[htnplans[index]._id] && htnplanhistory[htnplans[index]._id].length) ? htnplanhistory[htnplans[index]._id] : [];
      await db.collection('htnplan').update({ _id: htnplans[index]._id }, htnplans[index]);
    }
    console.log('HTN Plans successfully updated');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;