const XLSX = require('xlsx');
const filePath1 = './data/user.csv';
const filePath2 = './data/user-contact.csv';
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://192.168.0.103:27018/test_db_1';
const main = async () => {
  try {
    let workbook1 = XLSX.readFile(filePath1, { cellDates: true });
    let users = XLSX.utils.sheet_to_json(workbook1.Sheets[workbook1.SheetNames[0]]);
    let workbook2 = XLSX.readFile(filePath2, { cellDates: true });
    let userContacts = XLSX.utils.sheet_to_json(workbook2.Sheets[workbook2.SheetNames[0]]);
    let userData = {};
    users.forEach(user => {
      if (user.UserID) userData[user.UserID] = user;
    });
    userContacts.forEach(userContact => {
      if (userContact.UserID) userData[userContact.UserID].phone_number = userContact.PhoneNumber;
    });
    let res = [];
    for (let id in userData) {
      res.push(constructData(userData[id]));
    }
    let client = await MongoClient.connect(url);
    let db = await client.db();
    // console.log('users---------------', res);
    await db.collection('users').insertMany(res);
    console.log('Users created successfully');
    client.close();
  } catch (error) {
    console.log(error);
  }
}

const constructData = (data) => {
  return {
    user_id: data.UserID,
    first_name: data.FirstName ? data.FirstName : '',
    last_name: data.LastName ? data.LastName : '',
    username: data.Email ? data.Email : '',
    email: data.Email ? data.Email : '',
    password: data.Password ? data.Password : '',
    number_of_incorrect_attempts: data.LoginFailureCount ? Number(data.LoginFailureCount) : 0,
    created_by: data.CreatedBy,
    updated_by: data.UpdatedBy,
    createdAt: data.CreatedDatetime ? data.CreatedDatetime.toISOString() : '',
    updatedAt: data.UpdatedDatetime ? data.UpdatedDatetime.toISOString() : '',
    is_blocked: (data.IsBlocked.toLowerCase() == 't') ? true : false,
    is_deleted: (data.IsDeleted.toLowerCase() == 't') ? true : false,
    license_acceptance: (data.LicenseAcceptance.toLowerCase() == 't') ? true : false,
    last_logged_in: data.LastLoginTimestamp ? data.LastLoginTimestamp : '',
    blocked_date: data.BlockedDateTime ? data.BlockedDateTime : '',
    country: data.CountryName,
    city: data.City ? data.City : '',
    phone_number: data.phone_number ? data.phone_number.toString() : ''
  };
}

module.exports = main;