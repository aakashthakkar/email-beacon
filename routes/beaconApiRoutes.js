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
const fs = require('fs');




beaconApi.use(bodyParser.json({limit: '5mb'}));

beaconApi.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

//subscribe api supports an input of an email address and we add it to the database and send a welcome email.
beaconApi.post('/subscribe', (req, res) => {
  const email = req.body.hasOwnProperty('email') ? req.body.email : '';
  if(email != '' && commonUtilities.validateEmail(email)){
    const uniqueID = uniqid();
    const subscribeData = JSON.stringify({ID: uniqueID, email: email});
    try{
      const client = redis.createClient();
      client.set(uniqueID, subscribeData);
      client.quit();
			let token;
      if(token = commonUtilities.getTokenFromSubscribeData(subscribeData)){
				const URL = `${req.protocol}://${req.headers.host}/${token}/${commonConfig.subscribImageName}`;
				const mailOptions = {
					to: email,
					subject: 'Sending Email using Node.js',
					html: `<meta http-equiv="Content-Type" content="text/html; charset=utf-8"><table><tr><td><img src="${URL}"/></td></tr></table>`,
				};
				emailTransporter.sendMail(mailOptions, (error, info) => {
					if (error) {
						return res.status(400).json({
							message: 'Subscription Failed!'
						});
					} else {
						fs.appendFileSync('./logs/logs.txt', `Added user ${email} to the subscription list and sent the welcome email!\r\n`);
						return res.status(200).json({
							message:"Thanks for subscribing",
							data: URL
						});
					}
				});
			} else {
				return res.status(400).json({
	        message: 'Token generation failed!'
	      });
			}
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

});
beaconApi.get('/logs', (req, res) => {
  fs.readFile('./logs/logs.txt', (err, data) => {
    if(err) {console.log('please add a logs folder and log.txt file in the root of this repo'); return false};
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write(data);
    res.end();
  });

});

//URL to get image, it takes in the apiKey and filename and processes the apikey to get details of the user and returns the image file if everything goes well
beaconApi.get('/:apiKey/:fileName', (req, res) => {

  const processBeacon = async (req, callback) => {
    const apiKey = req.params.hasOwnProperty('apiKey') ? req.params.apiKey : '';
    const fileName = req.params.hasOwnProperty('fileName') ? req.params.fileName : '';
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);

    const device = req.headers['user-agent'];

    if(apiKey != '' && fileName != ''){
      let userDetails = commonUtilities.getUserDetailsFromApiKey(apiKey);
      if(userDetails){
        userDetails=JSON.parse(userDetails.data);
        userDetails = await commonUtilities.getUserDetailsFromDB(userDetails.ID);
        if(userDetails){
          userDetails = JSON.parse(userDetails);
          if(userDetails.hasOwnProperty('ip_list')){
            userDetails=commonUtilities.checkAndAddIfNewIPOrDevice(ipAddress, device, userDetails);
          } else {
            userDetails.ip_list = [ipAddress];
            userDetails.devices = [device];
            try{
              fs.appendFileSync('./logs/logs.txt',`Email sent to ${userDetails.email} was opened for the first time on IP Address ${ipAddress} using a new device ${device} on ${new Date()} \r\n`);
            } catch(e){
               console.log('please add a logs folder and log.txt file in the root of this repo');
            }
          }
          callback((await commonUtilities.upsertUserDetails(userDetails)) ? commonUtilities.getImageFromFile(fileName) : false);

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
