var express = require('express');
var router = express.Router();


var pool = require('./pool');


const util = require('util');
const queryAsync = util.promisify(pool.query).bind(pool);
const nodemailer = require('nodemailer');


// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'filemakr@gmail.com',
      pass: 'mlgv tdpy tlnx sorq',
    },
  });



  async function sendInviduallyMail(result,subject,message) {
    try {
      console.log('Data Recieve',result); 
      // Fetch recipients from an API (replace 'api_url' with your API endpoint)
      const recipients = result; // Assuming the API returns an array of recipients
  
      // Loop through recipients and send emails
   
  
          // console.log('recipients',recipients)
          try {
            const mailOptions = {
              from: 'support@gurudevdattamorale.in',
              to: result.email,
              subject: subject,
              html: `
              <html>
                <head>
                  <style>
                    body {
                      style="font-family: Georgia;
                      color: black;
                    }
                    strong {
                      font-weight: bold;
                    }
                  </style>
                </head>
                <body style="font-family: Georgia;color:'black'">
                  ${message}
                </body>
              </html>
            `,
          
            };
  
            // Send the email
            const info = await transporter.sendMail(mailOptions);
            console.log('information',info)
            console.log(`Email sent to ${result.email}: ${info.response}`);
          } catch (emailError) {
            console.error(`Error sending email to ${result.email}:`, emailError);
          }
        
      
    } catch (fetchError) {
      console.error('Error fetching recipients or sending emails:', fetchError);
    }
  }

// function userAuthenticationToken(req,res,next){
//     // const token = req.headers['authrorization'];
//     const token = undefined
//     if(!token) return res.status(401).json({message : 'Token not provided'})
//     jwt.verify(token,secretkey,(err,data)=>{
//       if(err) res.status(401).json({message:'Invalid Token Recieved'})
//       req.user = data
//       next();
//     })
//   }


// function userAuthenticationToken(req, res, next) {
//   const token = req.headers['authorization'];
//   if (!token) {
//       return res.status(401).json({ message: 'Token not provided' });
//   }
//   jwt.verify(token, secretkey, (err, data) => {
//       if (err) {
//           return res.status(401).json({ message: 'Invalid Token Received' });
//       }
//       req.user = data;
//       next();
//   });
// }



function adminAuthenticationToken(req,res,next){
  if(req.session.adminid) {
    req.categories = true;
     next();
  }
  else {
    res.render('login',{msg:'Wrong Credentials'})
    next()
  }
}


function userAuthenticationToken(req,res,next){
  if(req.session.userid) {
    req.categories = true;
     next();
  }
  else {
    res.render('userlogin',{message:'Wrong Credentials',color:'red'})
    next()
  }
}







function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = date.getFullYear();
    return yyyy + '-' + mm + '-' + dd ;
  }


  function getCurrentDate() {
    const today = new Date();
    return formatDate(today);
  }
  
  
  function getCurrentWeekDates() {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (7 - today.getDay()));
    return { startDate: formatDate(startOfWeek), endDate: formatDate(endOfWeek) };
  }
  // Function to get the start and end dates of the current month
  
  function getCurrentMonthDates() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { startDate: formatDate(startOfMonth), endDate: formatDate(endOfMonth) };
  }
  
  function getLastMonthDates() {
    const today = new Date();
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    return { startDate: formatDate(firstDayOfLastMonth), endDate: formatDate(lastDayOfLastMonth) };
  }

  
  // Function to get the start and end dates of the current year
  
  function getCurrentYearDates() {
  
    //   const today = new Date();
  
    //   const startOfYear = new Date(today.getFullYear(), 3, 1);

    //   const endOfYear = new Date(today.getFullYear(), 2, 31);
  
    //   return { startDate: formatDate(startOfYear), endDate: formatDate(endOfYear) };

    const today = new Date();
   // Check if the current month is April or later
   // If so, the financial year starts from April of the current year
   // Otherwise, it starts from April of the previous year
   const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
   // The financial year ends on March 31st of the following year
   const endYear = today.getMonth() >= 3 ? today.getFullYear() + 1 : today.getFullYear();
   // Set the start date to April 1st of the start year
   const startDate = new Date(startYear, 3, 1);
   // Set the end date to March 31st of the end year
   const endDate = new Date(endYear, 2, 31);
   return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
  
  }


  function getLastFinancialYearDates() {
    const today = new Date();

    // Check if the current month is April or later
    // If so, the financial year started from April of the current year
    // Otherwise, it started from April of the previous year
    const startYear = today.getMonth() >= 3 ? today.getFullYear() - 1 : today.getFullYear() - 2;

    // The financial year ended on March 31st of the current year
    const endYear = today.getMonth() >= 3 ? today.getFullYear() - 1 : today.getFullYear() - 1;

    // Set the start date to April 1st of the start year
    const startDate = new Date(startYear, 3, 1);

    // Set the end date to March 31st of the end year
    const endDate = new Date(endYear, 2, 31);

    return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
}


function generateId() {
  const prefix = "WCR";
  const alphanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomChars = '';
  for (let i = 0; i < 9; i++) {
      randomChars += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
  }
  return prefix + randomChars;
}


function generateOrderId() {
  const prefix = "ORD";
  const alphanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomChars = '';
  for (let i = 0; i < 9; i++) {
      randomChars += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
  }
  return prefix + randomChars;
}


// console.log('Last Financial Year',getCurrentYearDates())

  

  module.exports = {
    adminAuthenticationToken,
    getCurrentWeekDates,
    getCurrentMonthDates,
    getLastMonthDates,
    getCurrentYearDates,
    userAuthenticationToken,
    getCurrentDate,
    getLastFinancialYearDates,
    generateId,
    generateOrderId,
    sendInviduallyMail
  }


//   wkltwfbwnhnvzmwr