const uniqid = require('uniqid');
const jwt = require('jsonwebtoken');
const redis = require("redis-mock");
const fs = require('fs');
const commonConfig = require('../config/commonConfig').commonConfig;
const path = require('path');


//check to validate email format
var validateEmail = (email) => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
// check for new ip and device and 
const checkAndAddIfNewIPOrDevice = (ipAddress, device, userDetails) => {
  let message = '';
  if (userDetails.ip_list.indexOf(ipAddress) == -1){ 
    message+=`Email sent to ${userDetails.email} was opened using a new IP ${ipAddress}`;
    userDetails.ip_list.push(ipAddress);
  } else {
    message+=`Email sent to ${userDetails.email} was opened using an old IP ${ipAddress}`;
  }
  if(userDetails.devices.indexOf(device) == -1){
    message+=` and using a new device ${device}`
    userDetails.devices.push(device);
  } else {
    message+=` and using an old device ${device}`
  }
  message+=` on ${new Date()} \r\n`;
  try{
    fs.appendFileSync('./logs/logs.txt', message);
  }catch(e){
    console.log('please add a logs folder and log.txt file in the root of this repo');
  }
  return userDetails;
}
//simple file system function to get file from a directory
const getImageFromFile = (fileName) => {
  try{
    const img = fs.readFileSync('./images/'+fileName);
    return img;
  } catch(e){
    console.log(`Error: getImageFromFile() ${e}`);
    return false;
  }
}
//getting user details from the database from ID
const getUserDetailsFromDB = (ID) => {
  return new Promise((resolve) => {
    try{
      const client = redis.createClient();
      client.get(ID, function(err, userDetails){
        client.quit();
        if(err){
          return resolve(false);
        } else if(userDetails === null) {
          return resolve(false);
        } else {
          return resolve(userDetails);
        }
      });
    } catch(e){
      console.log(`Error: getUserDetailsFromDB() ${e}`);
      return resolve(false);
    }
  });
}
//upserting data into the database 
const upsertNewUserDetails = (userDetails) => {
  return new Promise((resolve) => {
    try{
      const client = redis.createClient();
      client.set(userDetails.ID, JSON.stringify(userDetails));
      client.quit();
      return resolve(true);
    } catch(e){
      console.log(`Error: upsertNewUserDetails() ${e}`);
      return resolve(false);
    }
  });
}

//getting basic user details by decrypting json web token
const getUserDetailsFromApiKey = (apiKey) => {
  try {
    return jwt.verify(apiKey, commonConfig.secretKey);
  } catch (e) {
    console.log(`Error: getUserDetailsFromApiKey() ${e}`);
    return false;
  }
}

module.exports = {
  validateEmail: validateEmail,
  checkAndAddIfNewIPOrDevice: checkAndAddIfNewIPOrDevice,
  getImageFromFile: getImageFromFile,
  getUserDetailsFromDB: getUserDetailsFromDB,
  upsertNewUserDetails: upsertNewUserDetails,
  getUserDetailsFromApiKey: getUserDetailsFromApiKey
}
