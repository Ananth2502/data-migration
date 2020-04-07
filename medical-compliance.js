const XLSX = require('xlsx');
const filePath = './data/medical-compliance.xlsx';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let res = [];
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let medicalcompliance = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let users = await db.collection('users').find().toArray();
    let userIds = {};
    users.forEach(user => {
      if (user.user_id) userIds[user.user_id] = user._id;
    });
    res = medicalcompliance.map(data => {
      return constructData(data, userIds);
    });
    res = await db.collection('medicalcompliance').insertMany(res);
    let complianceIds = {};
    res.ops.forEach(data => {
      complianceIds[data.medical_compliance_id] = data._id;
    });
    res.ops.forEach(data => {
      if (data.parent_compliance_id) {
        data.parent_compliance_id = complianceIds[data.parent_compliance_id].toString();
        db.collection('medicalcompliance').update({ _id: data._id }, data);
      } else {
        delete data.parent_compliance_id;
        db.collection('medicalcompliance').update({ _id: data._id }, data);
      }
    });
    console.log('Medical Compliance data created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data, userIds) => {
  return {
    medical_compliance_id: data.MedicationComplianceID,
    name: data.MedCompliance ? data.MedCompliance : '',
    status: (data.Status && data.Status.toLowerCase() == 't') ? true : false,
    sequence_number: data.SequenceNumber ? data.SequenceNumber : 0,
    app_type: data.AppType ? data.AppType : 0,
    created_by: userIds[data.CreatedBy] ? userIds[data.CreatedBy].toString() : '',
    updated_by: userIds[data.UpdatedBy] ? userIds[data.UpdatedBy].toString() : '',
    createdAt: data.CreatedDatetime ? new Date(data.CreatedDatetime).toISOString() : '',
    updatedAt: data.UpdatedDatetime ? new Date(data.UpdatedDatetime).toISOString() : '',
    is_deleted: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? true : false,
    is_active: (data.IsDeleted && data.IsDeleted.toLowerCase() == 't') ? false : true,
    parent_compliance_id: data.ParentMedicationComplianceID
  };
}

module.exports = main;