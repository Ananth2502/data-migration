const XLSX = require('xlsx');
const filePath = './data/training-material.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
  let client = await MongoClient.connect(url);
  let db = await client.db();
  let workbook = XLSX.readFile(filePath, { cellDates: true });
  let trainingMaterials = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  trainingMaterials = trainingMaterials.map(trainingMaterial => {
    return constructData(trainingMaterial);
  });
  await db.collection('trainingmaterial').insertMany(trainingMaterials);
  console.log('Training materials created successfully');
  client.close();
  } catch (error) {
    console.log(error);
}
}

const constructData = (data) => {
  return {
    training_material_id: data.TrainingMaterialID,
    url: data.TrainingMaterialUrl ? data.TrainingMaterialUrl : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    is_deleted: (data.Status && data.Status.toLowerCase() == 't') ? true : false,
    display_app_type: data.TrainingMaterialDisplayApp ? Number(data.TrainingMaterialDisplayApp) : 0
  };
}

module.exports = main;