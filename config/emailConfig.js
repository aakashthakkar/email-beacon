const nodemailer = require('nodemailer');

//add a username and password for a supported transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '',
    pass: ''
  }
});

module.exports={
  transporter: transporter
}
