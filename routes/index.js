var express = require('express');
var router = express.Router();
var pool = require('./pool');
const util = require('util');
const queryAsync = util.promisify(pool.query).bind(pool);
var verify = require('./verify');


/* GET home page. */
router.get('/', function(req, res, next) {
  var query = `select * from manage_filters where filters = 'services' and status = true order by id desc;`
  var query = `select * from manage_filters where filters = 'portfolio' and status = true order by id desc;`

  res.render('index', { title: 'Express' , page:'home'});
});


router.get('/user/signup',(req,res)=>{
  res.render('signup',{msg:req.query.message,color:req.query.color,page:'signup'})
})


router.get('/user/login',(req,res)=>{
  res.render('userlogin',{msg:req.query.message,color:req.query.color,page:'login'})
})



router.post('/user/signup', async (req, res) => {
  try {
      let body = req.body;

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
      res.render('services',{result,page:'service'})
      // res.json(result)
    }
  })
})


router.get('/portfolio',(req,res)=>{
  pool.query(`select * from manage_filters where filters = 'portfolio' and status = true order by id desc`,(err,result)=>{
    if(err) throw err;
    else {
      res.render('portfolio',{result,page:'portfolio'})
      // res.json(result)
    }
  })
})


router.get('/blog',(req,res)=>{
  pool.query(`select * from blogs order by id desc`,(err,result)=>{
    if(err) throw err;
    else {
      res.render('blog',{result,page:'blog'})
      // res.json(result)
    }
  })
})


router.get('/contact-us',(req,res)=>{
  res.render('contact',{page:'contact',message:req.query.message})
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
    key_id: 'rzp_live_2AYlv8GRAaT63p',
    key_secret: 'iIzpixX7YsDSUVPtAtbO5SMn',
  });




router.get('/sportzkeeda-create',(req,res)=>{
  const url = `https://rzp_live_2AYlv8GRAaT63p:iIzpixX7YsDSUVPtAtbO5SMn@api.razorpay.com/v1/orders/`;
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



module.exports = router;
