var express = require('express');
var router = express.Router();
var pool = require('./pool');
const util = require('util');
const queryAsync = util.promisify(pool.query).bind(pool);
var verify = require('./verify');
var onPageSeo = require('./onPageSeo');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'filemakr@gmail.com',
    pass: 'mlgv tdpy tlnx sorq',
  },
});

router.post('/send-otp', async (req, res) => {
  const { email, otp } = req.body;

  const mailOptions = {
      from: 'filemakr@gmail.com',
      to: email,
      subject: 'Your OTP for Verification',
      html: `<p>Your OTP for verification is: <strong>${otp}</strong></p>`
  };

  try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true });
  } catch (error) {
      console.error('Error sending email:', error);
      res.json({ success: false });
  }
});




router.post('/user/forgot-password', async (req, res) => {

  pool.query(`select * from users where email = '${req.body.email}'`,async(err,result)=>{
    if(err) throw err;
    else if(result.length>0){
  let newPassword = verify.generatePassword(12);
  pool.query(`update users set password = '${newPassword}' where email = '${req.body.email}'`,async(err,result)=>{
    if(err) throw err;
    else {

      const subject = 'Password Reset Request';
      const message = `
        <h1>Password Reset</h1>
        <p>Dear User,</p>
        <p>Your password has been reset. Please use the following password to log in:</p>
        <p><strong>${newPassword}</strong></p>
        <p>Make sure to change your password after logging in.</p>
        <br>
        <p>Regards,</p>
        <p>Your Company Name</p>
      `;
      await verify.sendUserMail(req.body.email,subject,message);
      res.redirect(`/user/forgot-password?message=${encodeURIComponent('Password sent successfully to your email.')}`)
    }
  })

    }
    else{
      res.redirect(`/user/forgot-password?message=${encodeURIComponent('Email ID Not Exists')}`)
    }
  })

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



router.post('/user/signup', async (req, res) => {
  try {
      let body = req.body;
      let subject = `Welcome Subject`
      let message = `Welcome Message`

      // Check if email or number already exists
      const existingRecord = await queryAsync('SELECT id FROM users WHERE email = ? OR number = ?', [body.email, body.number]);

      if (existingRecord.length > 0) {
          return res.redirect(`/user/signup?message=${encodeURIComponent('Email ID or Mobile Number Already Exists')}&color=${encodeURIComponent('red')}`);
      }

      body.created_at = verify.getCurrentDate();
      body.status = 'unverified';
      body.unique_id = verify.generateId();

      // Insert new record
      const insertResult = await queryAsync('INSERT INTO users SET ?', req.body);

      if (insertResult.affectedRows > 0) {
          await verify.sendInviduallyMail(req.body,subject,message)
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
