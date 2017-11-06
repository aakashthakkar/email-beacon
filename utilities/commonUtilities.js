const uniqid = require('uniqid');
const jwt = require('jsonwebtoken');
const redis = require("redis-mock");
const fs = require('fs');
const commonConfig = require('../config/commonConfig').commonConfig;
const path = require('path');



var validateEmail = (email) => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
const checkAndAddIfNewIP = (ipAddress, ip_list) => {
  if (ip_list.indexOf(ipAddress) != -1) return ip_list;
  ip_list.push(ipAddress);
  return ip_list;
}
const getImageFromFile = (fileName) => {
  try{
    const img = fs.readFileSync('./images/'+fileName);
    return img;
  } catch(e){
    console.log(`Error: getImageFromFile() ${e}`);
    return false;
  }
}
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
  checkAndAddIfNewIP: checkAndAddIfNewIP,
  getImageFromFile: getImageFromFile,
  getUserDetailsFromDB: getUserDetailsFromDB,
  upsertNewUserDetails: upsertNewUserDetails,
  getUserDetailsFromApiKey: getUserDetailsFromApiKey
}
