const XLSX = require('xlsx');
const filePath = './data/role.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';

const main = async () => {
  try {
    let client = await MongoClient.connect(url);
    let db = await client.db();
    let workbook = XLSX.readFile(filePath, { cellDates: true });
    let roles = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // console.log('roles--------------', roles);
    let roleMapper = {
      'SYSTEM_ADMIN': roles[roles.findIndex(role => role.RoleName == 'SysAdmin')].RoleID,
      'PHARMACIST': roles[roles.findIndex(role => role.RoleName == 'Pharmacist')].RoleID,
      'BPCHECKER': roles[roles.findIndex(role => role.RoleName == 'BPChecker')].RoleID,
      'REDRISK_NOTIFICATION_CONTACT': roles[roles.findIndex(role => role.RoleName == 'Red Risk Notification Contact')].RoleID,
      'LOCAL_ADMIN': roles[roles.findIndex(role => role.RoleName == 'LocalAdmin')].RoleID,
      'PATIENT': roles[roles.findIndex(role => role.RoleName == 'Patient')].RoleID,
      'PHYSICIAN': roles[roles.findIndex(role => role.RoleName == 'Physician')].RoleID,
      'NURSE': roles[roles.findIndex(role => role.RoleName == 'Nurse')].RoleID,
      'SPECIALIST_OR_CONSULTANT': roles[roles.findIndex(role => role.RoleName == 'Specialist/Consultant')].RoleID,
      'MEDICAL_OR_PHYSICIAN_ASSISTANT': roles[roles.findIndex(role => role.RoleName == 'Medical/Physician Assistant')].RoleID,
      'MEDICAL_OR_CLINICAL_OFFICER': roles[roles.findIndex(role => role.RoleName == 'Medical/Clinical Officer')].RoleID,
      'MED_REVIEW_HIGH_RISK_PATIENTS': 2,
      'MED_REVIEW_MODERATE_RISK_PATIENTS': 3,
      'MED_REVIEW_LOW_RISK_PATIENTS': 4,
      'PRESCRIPTION_WRITE_EDIT_REFILL': 5,
      'HTNPLAN_ACCEPT_EDIT': 1,
      'NETWORK_ADMIN': 60
    };
    // console.log('roleMapper---------------------', roleMapper);
    let roleList = await db.collection('roles').find({ name: { $nin: ['superuser', 'job', 'employee'] } }).toArray();
    for (let i = 0; i < roleList.length; i++) {
      roleList[i].role_id = roleMapper[roleList[i].name];
      // console.log('role----------------------', roleMapper[roleList[i].name]);
      await db.collection('roles').update({ _id: roleList[i]._id }, roleList[i]);
    }
    console.log('Roles updated successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

module.exports = main;