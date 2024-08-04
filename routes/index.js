var express = require('express');
var router = express.Router();
var pool = require('./pool');
const util = require('util');
const queryAsync = util.promisify(pool.query).bind(pool);
var verify = require('./verify');
var onPageSeo = require('./onPageSeo');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'support@wordcreation.in', // your GoDaddy email address
    pass: 'Swaraj@#Word#890',    // your GoDaddy email password
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

router.post('/send-otp', async (req, res) => {
  const { email, otp } = req.body;

  const mailOptions = {
      from: 'support@wordcreation.in',
      to: email,
      subject: 'Verify Your Email Address - WordCreation',
      html: `
        <p>Dear User,</p>
        <p>Welcome to WordCreation!</p>
        <p>Thank you for signing up. To complete your registration, please verify your email address by entering the OTP provided below:</p>
        <p><strong>Your OTP: ${otp}</strong></p>
        <p>This OTP is valid for 15 minutes. If you did not sign up for a WordCreation account, please ignore this email.</p>
        <p>We are excited to have you on board and look forward to helping you create amazing content with ease. If you have any questions or need assistance, feel free to reach out to our support team at support@wordcreation.in.</p>
        <p>Best regards,</p>
        <p>The WordCreation Team</p>
      `
  };

  try {
      await transporter.sendMail(mailOptions);
      console.log('done')
      res.json({ success: true });
  } catch (error) {
      console.error('Error sending email:', error);
      res.json({ success: false });
  }
});




// router.post('/user/forgot-password', async (req, res) => {

//   pool.query(`select * from users where email = '${req.body.email}'`,async(err,result)=>{
//     if(err) throw err;
//     else if(result.length>0){
//   let newPassword = verify.generatePassword(12);
//   pool.query(`update users set password = '${newPassword}' where email = '${req.body.email}'`,async(err,result)=>{
//     if(err) throw err;
//     else {

//       const subject = 'Password Reset Request';
//       const message = `
//         <h1>Password Reset</h1>
//         <p>Dear User,</p>
//         <p>Your password has been reset. Please use the following password to log in:</p>
//         <p><strong>${newPassword}</strong></p>
//         <p>Make sure to change your password after logging in.</p>
//         <br>
//         <p>Regards,</p>
//         <p>Your Company Name</p>
//       `;
//       await verify.sendUserMail(req.body.email,subject,message);
//       res.redirect(`/user/forgot-password?message=${encodeURIComponent('Password sent successfully to your email.')}`)
//     }
//   })

//     }
//     else{
//       res.redirect(`/user/forgot-password?message=${encodeURIComponent('Email ID Not Exists')}`)
//     }
//   })

//  });



router.post('/user/forgot-password', async (req, res) => {
  pool.query(`SELECT * FROM users WHERE email = ?`, [req.body.email], async (err, result) => {
    if (err) throw err;
    else if (result.length > 0) {
      let newPassword = verify.generatePassword(12);
      pool.query(`UPDATE users SET password = ? WHERE email = ?`, [newPassword, req.body.email], async (err, result) => {
        if (err) throw err;
        else {
          const subject = 'Your Temporary Password';
          const message = `
            <p>Dear User,</p>
            
            <p>We have received your request to reset your password. A temporary password has been generated for you to access your account.</p>
            
            <p><strong>Your temporary password is: ${newPassword}</strong></p>
            
            <p>Please use this password to log in to your account. Once you have successfully logged in, you will be prompted to update your password to one of your choosing.</p>
            
            <p>For security reasons, we recommend that you choose a strong, unique password that you do not use for any other accounts.</p>
            
            <p>If you encounter any issues or have any questions, please do not hesitate to contact our support team.</p>
            
            <p>Thank you for using our services.</p>
            
            <p>Best regards,</p>
            <p>Word Creation Support Team</p>
            <p>support@wordcreation.in</p>
            <p>https://wordcreation.in</p>

          `;
          await verify.sendUserMail(req.body.email, subject, message);
          res.redirect(`/user/forgot-password?message=${encodeURIComponent('Password sent successfully to your email.')}`);
        }
      });
    } else {
      res.redirect(`/user/forgot-password?message=${encodeURIComponent('Email ID Not Exists')}`);
    }
  });
});



/* GET home page. */
router.get('/', function(req, res, next) {
  var query = `select * from manage_filters where filters = 'services' and status = true order by id desc;`
  var query1 = `select * from manage_filters where filters = 'university' and status = true order by id desc;`
  var query2 = `select * from blogs order by id desc limit 3;`
  pool.query(query+query1+query2,(err,result)=>{
    if(err) throw err;
    else res.render('index', { title: 'Express' , page:'home',result, MetaTags : onPageSeo.homePage });
  })
});


router.get('/user/signup',(req,res)=>{
  res.render('signup',{msg:req.query.message,color:req.query.color,page:'signup',MetaTags : onPageSeo.siguupPage})
})


router.get('/user/login',(req,res)=>{
  res.render('userlogin',{msg:req.query.message,color:req.query.color,page:'login',MetaTags : onPageSeo.loginPage})
})


router.get('/user/forgot-password',(req,res)=>{
  res.render('forgot',{msg:req.query.message,color:req.query.color,page:'login',MetaTags : onPageSeo.loginPage})
})


router.get('/privacy-policy',(req,res)=>{
  res.render('privacy-policy',{msg:req.query.message,color:req.query.color,page:'privacy',MetaTags : onPageSeo.privacyPage})
})


router.get('/terms-and-conditions',(req,res)=>{
  res.render('terms',{msg:req.query.message,color:req.query.color,page:'terms',MetaTags : onPageSeo.termsPage})
})


router.get('/refund-policy',(req,res)=>{
  res.render('refund',{msg:req.query.message,color:req.query.color,page:'terms',MetaTags : onPageSeo.refundPage})
})



// router.post('/user/signup', async (req, res) => {
//   try {
//       let body = req.body;
//       let subject = `Welcome Subject`
//       let message = `Welcome Message`

//       // Check if email or number already exists
//       const existingRecord = await queryAsync('SELECT id FROM users WHERE email = ? OR number = ?', [body.email, body.number]);

//       if (existingRecord.length > 0) {
//           return res.redirect(`/user/signup?message=${encodeURIComponent('Email ID or Mobile Number Already Exists')}&color=${encodeURIComponent('red')}`);
//       }

//       body.created_at = verify.getCurrentDate();
//       body.status = 'unverified';
//       body.unique_id = verify.generateId();

//       // Insert new record
//       const insertResult = await queryAsync('INSERT INTO users SET ?', req.body);

//       if (insertResult.affectedRows > 0) {
//           await verify.sendInviduallyMail(req.body,subject,message)
//           return res.redirect(`/user/signup?message=${encodeURIComponent('Signup Successfully')}&color=${encodeURIComponent('green')}`);
//       } else {
//           return res.redirect(`/user/signup?message=${encodeURIComponent('Error Occurred Please Try Again Later')}&color=${encodeURIComponent('red')}`);
//       }
//   } catch (error) {
//       console.error('Error in Linked Account/add:', error);
//       res.status(500).json({ msg: 'error' });
//   }
// });



router.post('/user/signup', async (req, res) => {
  try {
      let body = req.body;
      let subject = `Welcome to WordCreation – Your Partner in Personalized Academic Success!`
      let message = `
      <p>Dear ${body.name},</p>

      <p>Welcome to WordCreation!</p>

      <p>We are delighted to have you join our community. At WordCreation, we specialize in delivering personalized academic content tailored to your unique requirements. Whether you're a student aiming for academic excellence or a professional seeking expert writing support, we are here to help you achieve your goals.</p>

      <h3>Our Services Include:</h3>
      <ul>
        <li><strong>Essay Writing</strong></li>
        <li><strong>Report Writing</strong></li>
        <li><strong>Reflective Writing</strong></li>
        <li><strong>Academic Blogging</strong></li>
        <li><strong>Thesis Writing</strong></li>
        <li><strong>Abstract Writing</strong></li>
        <li><strong>Ethics Forms</strong></li>
        <li><strong>Case Studies</strong></li>
        <li><strong>Technical Writing</strong></li>
        <li><strong>Law Assignments</strong></li>
        <li><strong>Research Articles</strong></li>
        <li><strong>Literary Reviews</strong></li>
        <li><strong>CV and Cover Letter Writing</strong></li>
        <li><strong>Dissertations</strong> (both qualitative and quantitative research)</li>
      </ul>

      <h3>Why Choose WordCreation?</h3>
      <ul>
        <li><strong>Personalized Content:</strong> We customize each piece to meet your specific needs.</li>
        <li><strong>Expert Writers:</strong> Our team consists of experienced professionals from various academic fields.</li>
        <li><strong>On-Time Delivery:</strong> We ensure timely delivery of all your projects.</li>
        <li><strong>Affordable Pricing:</strong> High-quality services at the lowest prices.</li>
      </ul>

      <p>If you have any other projects or unique requirements, don’t hesitate to reach out. We are committed to providing exceptional service and support for all your academic writing needs.</p>

      <p>Feel free to contact us at support@wordcreation.in if you have any questions or need further assistance. We look forward to helping you succeed.</p>

      <p>Warm regards,</p>

      <p>The WordCreation Team</p>
      <p>support@wordcreation.in</p>
      <p>https://wordcreation.in/</p>

      <p><br>
      WordCreation – Crafting Your Academic Success, One Word at a Time</p>
      `;

      // Check if email or number already exists
      const existingRecord = await queryAsync('SELECT id FROM users WHERE email = ? OR number = ?', [body.email, body.number]);

      if (existingRecord.length > 0) {
          return res.redirect(`/user/signup?message=${encodeURIComponent('Email ID or Mobile Number Already Exists')}&color=${encodeURIComponent('red')}`);
      }

      body.created_at = verify.getCurrentDate();
      body.status = 'verified';
      body.unique_id = verify.generateId();

      // Insert new record
      const insertResult = await queryAsync('INSERT INTO users SET ?', req.body);

      if (insertResult.affectedRows > 0) {
          await verify.sendInviduallyMail(req.body, subject, message);
          return res.redirect(`/user/signup?message=${encodeURIComponent('Signup Successfully')}&color=${encodeURIComponent('green')}`);
      } else {
          return res.redirect(`/user/signup?message=${encodeURIComponent('Error Occurred Please Try Again Later')}&color=${encodeURIComponent('red')}`);
      }
  } catch (error) {
      console.error('Error in Linked Account/add:', error);
      res.status(500).json({ msg: 'error' });
  }
});



router.post('/user/login',(req,res)=>{
  let body = req.body;
  console.log("body",body)
 
pool.query(`select * from users where email ='${body.email}' and password = '${body.password}'`,(err,result)=>{
  
   if(err) throw err;
   else if(result[0]) {
    console.log('id',result[0].id)
       req.session.userid = result[0].id
       req.session.useremail = result[0].email
       req.session.username = result[0].name
       req.session.usernumber = result[0].number

       res.redirect('/user/dashboard/new/assignment')
      }
   else {
    return res.redirect(`/user/login?message=${encodeURIComponent('Invalid Credentials')}&color=${encodeURIComponent('red')}`);
    
   }
})
 
})



router.get('/services',(req,res)=>{
  pool.query(`select * from manage_filters where filters = 'services' and status = true order by id desc`,(err,result)=>{
    if(err) throw err;
    else {
      res.render('services',{result,page:'service',MetaTags : onPageSeo.servicePage})
      // res.json(result)
    }
  })
})


router.get('/portfolio',(req,res)=>{
  pool.query(`select * from manage_filters where filters = 'portfolio' and status = true order by id desc`,(err,result)=>{
    if(err) throw err;
    else {
      res.render('portfolio',{result,page:'portfolio', MetaTags : onPageSeo.portfolioPage})
      // res.json(result)
    }
  })
})


router.get('/blog',(req,res)=>{
  pool.query(`select * from blogs order by id desc`,(err,result)=>{
    if(err) throw err;
    else {
      res.render('blog',{result,page:'blog',MetaTags : onPageSeo.blogPage})
      // res.json(result)
    }
  })
})



router.get('/blogs/:seoname',(req,res)=>{
  var query  = `select * from blogs where seo_name = '${req.params.seoname}';`
  var query1 = `select * from blogs where seo_name != '${req.params.seoname}' order by id desc limit 10;`
  var query2 = `select * from comment where blogid = (select b.id from blogs b where b.seo_name = '${req.params.seoname}') order by id desc;`
  pool.query(query+query1+query2,(err,result)=>{
    if(err) throw err;
    else {
      res.render('blogDetails',{result,page:'blog',MetaTags : onPageSeo.blogPage})
      // res.json(result)
    }
  })
})


router.get('/contact-us',(req,res)=>{
  res.render('contact',{page:'contact',message:req.query.message,MetaTags : onPageSeo.contactPage})
})


router.post('/contact',(req,res)=>{
  let body = req.body;
  body.created_at = verify.getCurrentDate()
  pool.query(`insert into contact set ?`,body,(err,result)=>{
    if(err) throw err;
    else res.redirect(`/contact-us?message=${encodeURIComponent('Our Team will contact you soon.')}`)
  })
})





const Razorpay = require("razorpay");
var instance = new Razorpay({
    key_id: 'rzp_test_c9ZSQoNdAZavNr',
    key_secret: 'M3PlBQetVxVHN6SX3PkqtooV',
  });




router.get('/sportzkeeda-create',(req,res)=>{
  const url = `https://rzp_test_c9ZSQoNdAZavNr:M3PlBQetVxVHN6SX3PkqtooV@api.razorpay.com/v1/orders/`;
    const data = {
        amount:100,  // amount in the smallest currency unit
      //amount:100,
      currency: 'INR',
        payment_capture: true
    }
    console.log('data',data)
    const options = {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    }
    fetch(url, options)
        .then(res => res.json())
        .then(
            resu => res.send(resu)
        );
 })




 router.post('/comment/:seoname',(req,res)=>{
  let body = req.body;
  body.created_at = verify.getCurrentDate()
  pool.query(`insert into comment set ?`,body,(err,result)=>{
    if(err) throw err;
    else {
      res.redirect(`/blogs/${req.params.seoname}`)
    }
  })
 })



 

module.exports = router;
