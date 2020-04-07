const XLSX = require('xlsx');
const filePath = './data/patient-lab-test.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let patientLabtests = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    let labtests = await db.collection('labtest').find().toArray();
    let labtestIds = {};
    labtests.forEach(labtest => {
      if (labtest.labtest_id) labtestIds[labtest.labtest_id] = labtest._id;
    });
    let patients = await db.collection('patient').find().toArray();
    let patientIds = {};
    let tenantIds = {};
    patients.forEach(patient => {
      if (patient.temp_id) patientIds[patient.temp_id] = patient._id;
      if (patient.temp_id) tenantIds[patient.temp_id] = patient.tenant_id;
    });
    patientLabtests = patientLabtests.map(patientLabtest => {
      return constructData(patientLabtest, userIds, labtestIds, patientIds, tenantIds);
    });
    // console.log('patientLabtests-----------------', patientLabtests);
    await db.collection('patientlabtest').insertMany(patientLabtests);
    console.log('Patient Lab Tests created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds, labtestIds, patientIds, tenantIds) => {
  return {
    patient_labtest_id: data.PatientLabTestID,
    lab_test_id: labtestIds[data.LabTestID],
    patient_id: patientIds[data.PatientID],
    tenant_id: tenantIds[data.PatientID] && tenantIds[data.PatientID].toString(),
    value: data.Value ? data.Value.toString() : '',
    is_value_outof_range: (data.IsValueOutOfRange && data.IsValueOutOfRange.toLowerCase() == 't') ? true : false,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    date_of_collection: data.DateOfCollection ? data.DateOfCollection : '',
    other_lab_test: data.OtherLabTest ? data.OtherLabTest : '',
    is_abnormal: (data.IsAbnormal && data.IsAbnormal.toLowerCase() == 't') ? true : false,
    summary: data.SummaryResult ? data.SummaryResult : ''
  }
}

module.exports = main;