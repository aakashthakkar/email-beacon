'use strict';
/*
	DEPENDENCIES ----------------------------------------------------------------------------------------------------------------------------
*/
const express = require('express');
const beaconApi = express.Router();
const bodyParser = require('body-parser');
const commonUtilities = require('../utilities/commonUtilities');
const commonConfig = require('../config/commonConfig').commonConfig;
const emailTransporter = require('../config/emailConfig').transporter;
const uniqid = require('uniqid');
const jwt = require('jsonwebtoken');
const redis = require("redis-mock");



beaconApi.use(bodyParser.json({limit: '5mb'}));

beaconApi.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

beaconApi.post('/subscribe', (req, res) => {
  const email = req.body.hasOwnProperty('email') ? req.body.email : '';
  if(email != ''){
    if(commonUtilities.validateEmail(email)){
      const uniqueID = uniqid();
      const subscribeData = JSON.stringify({ID: uniqueID, email: email});
      try{
        const client = redis.createClient();
        client.set(uniqueID, subscribeData);
        client.quit();

        const token = jwt.sign({
          data: subscribeData
        }, commonConfig.secretKey, {expiresIn: 86400 * 50});
        const URL = `${req.headers.host}/${token}/${commonConfig.subscribImageName}`;
        const mailOptions = {
          to: email,
          subject: 'Sending Email using Node.js',
          html: `<img src="${URL}"/>`,
        };
        emailTransporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return res.status(400).json({
              message: 'Subscription Failed!'
            });
          } else {
            return res.status(200).json({
              message:"Thanks for subscribing",
              data: URL
            });
          }
        });
      } catch(e){
        console.log(`Error: subscribe api ${e}`);
        return res.status(400).json({
          message: 'Subscription Failed!'
        });
      }


    } else {
      return res.status(400).json({
        message: 'invalid email'
      });
    }
  }
});

beaconApi.get('/:apiKey/:fileName', (req, res) => {

  var processBeacon = async (req, callback) => {
    const apiKey = req.params.hasOwnProperty('apiKey') ? req.params.apiKey : '';
    const fileName = req.params.hasOwnProperty('fileName') ? req.params.fileName : '';
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);

    if(apiKey != '' && fileName != ''){
      let userDetails = commonUtilities.getUserDetailsFromApiKey(apiKey);
      if(userDetails){
        userDetails=JSON.parse(userDetails.data);
        userDetails = await commonUtilities.getUserDetailsFromDB(userDetails.ID);
        if(userDetails){
          userDetails = JSON.parse(userDetails);
          if(userDetails.hasOwnProperty('ip_list')){
            userDetails.ip_list=commonUtilities.checkAndAddIfNewIP(ipAddress, userDetails.ip_list);
          } else {
            userDetails.ip_list = [ipAddress];
          }
          callback((await commonUtilities.upsertNewUserDetails(userDetails)) ? commonUtilities.getImageFromFile(fileName) : false);

        } else {
          callback(false);
        }
      } else {
        callback(false);
      }
    }
  }

processBeacon(req, (img) => {
  if(img){
    res.writeHead(200, {'Content-Type': 'image/png' });
    res.end(img, 'binary');
  } else {
    return res.status(400).json({
      message: 'Invalid request'
    });
  }
});


});


module.exports = {
		beaconApi: beaconApi
};
