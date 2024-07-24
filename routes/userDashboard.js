var express = require('express');
var router = express.Router();
var pool = require('./pool');
const util = require('util');
const upload = require('./multer');
const queryAsync = util.promisify(pool.query).bind(pool);
var verify = require('./verify');
var user = require('./function');
const { stat } = require('fs');
var folder = 'user'


router.get('/', verify.userAuthenticationToken, (req, res) => {
    var getCurrentWeekDates = verify.getCurrentWeekDates();
    var getCurrentMonthDates = verify.getCurrentMonthDates();
  
    var pendingorder = `select count(id) as counter from orders where status = 'pending';`
    var ongoingorder = `select count(id) as counter from orders where status = 'ongoing';`
    var weeklyorder = `select count(id) as counter from orders where created_at between '${getCurrentWeekDates.startDate}' and '${getCurrentWeekDates.endDate}';`
    var monthlyorder = `select count(id) as counter from orders where created_at between '${getCurrentMonthDates.startDate}' and '${getCurrentMonthDates.endDate}';`
    var weeklypayment = `select count(id) as counter from payment_response where created_at between '${getCurrentWeekDates.startDate}' and '${getCurrentWeekDates.endDate}';`
    var monthlypayment = `select count(id) as counter from payment_response where created_at between '${getCurrentMonthDates.startDate}' and '${getCurrentMonthDates.endDate}';`
    var verifieduser = `select count(id) as counter from users where status = 'verified';`
    var unverifieduser = `select count(id) as counter from users where status = 'unverified';`
   
    
    pool.query(pendingorder+ongoingorder+weeklyorder+monthlyorder+weeklypayment+monthlypayment+verifieduser+unverifieduser, (err, result) => {
        if (err) throw err;
        else res.render(`${folder}/dashboard`,{result})
        // else res.json(result);
    });
  });
  


router.get('/new/assignment',verify.userAuthenticationToken,(req,res)=>{
    res.render(`${folder}/add`,{msg:req.query.message,email:req.session.useremail,name:req.session.username})
})



router.post('/assignment/insert',verify.userAuthenticationToken, upload.fields([{ name: 'assignment' }, { name: 'supporting_documents' }]), async (req, res) => {
    const { body, params, files } = req;
    const { name } = params;

    try {
        body.created_at = verify.getCurrentDate();
        body.status = 'pending';
        body.updated_at = verify.getCurrentDate();
        body.assignment = files['assignment'][0].filename; // Assuming you want the first image
        body.supporting_documents = files['supporting_documents'][0].filename; 
        body.userid = req.session.userid;
        body.orderid = verify.generateOrderId();


        console.log('body',body)

        await queryAsync(`INSERT INTO orders SET ?`, body);
        res.redirect(`/user/dashboard/new/assignment?message=${encodeURIComponent('Saved Successfully')}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});



router.get('/myassignment',verify.userAuthenticationToken, (req, res) => {
    

    pool.query(`SELECT * FROM orders WHERE userid = '${req.session.userid}' order by id desc`, (err, result) => {
        if (err) {
            throw err;
        } else {
            // res.json({ result });
            res.render(`${folder}/list`,{result,email:req.session.useremail,name:req.session.username,page:''})
        }
    });
});








router.get('/myprofile',verify.userAuthenticationToken, async (req, res) => {
    try {
      let query = `SELECT * FROM users where id = '${req.session.userid}'`;
      const result = await queryAsync(query);
      res.render('user/profile',{result,msg:'',name:req.session.username,email:req.session.useremail})
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).send('Internal Server Error');
    }
   });



   router.post('/update',verify.userAuthenticationToken, (req, res) => {
    console.log('req.body', req.body);
    pool.query('UPDATE users SET ? WHERE id = ?', [req.body, req.body.id], (err, result) => {
        if (err) {
            console.error('Error updating data:', err);
            return res.status(500).json({ msg: 'error' });
        }
        return res.redirect('/user/dashboard/myprofile')

    });
  });
  
  

  router.get('/transaction', (req, res) => {
    const { username, usernumber, txnid, from_date, to_date, uniqueid } = req.query;
  
    let query = `SELECT pr.*, u.name as username, u.number as usernumber, u.unique_id as uniqueid
                 FROM payment_response pr
                 JOIN users u ON pr.userid = u.id
                 WHERE 1`;
  
    if (username) query += ` AND u.name = '${username}'`;
    if (usernumber) query += ` AND u.number = '${usernumber}'`;
    if (uniqueid) query += ` AND u.unique_id = '${uniqueid}'`;
    if (txnid) query += ` AND pr.txnid = '${txnid}'`;
    if (from_date && !to_date) query += ` AND DATE(pr.created_at) = '${from_date}'`;
    if (from_date && to_date) query += ` AND pr.created_at BETWEEN '${from_date}' AND '${to_date}'`;
  
    pool.query(query, (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
  
     res.render(`user/transaction`,{result:results,value:req.query,name:req.session.username,email:req.session.useremail})

    });
  });



  router.get('/view/orders/details', verify.userAuthenticationToken, async (req, res) => {
    try {
      let result =  await user.getOrderDetails(req.query.orderid);
      res.render(`${folder}/orderDetails`, { result,msg:req.query.msg,name:req.session.username,email:req.session.useremail });
    } catch (error) {
      console.error('Error in route:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


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


 router.post('/razorpay-response',(req,res)=>{
  let body = req.body;
  console.log('response recieve',body);
 
res.json(body)
 
 })
 



  router.get('/payment',async(req,res)=>{
    let orderid = req.query.orderid;
    let type = req.query.type;
    let result =  await user.getOrderDetails(req.query.orderid);
    let original_amount = result[0].remaining_payment;
    let done_assignment = result[0].done_assignment;
    let payable_amount;
    let status ;


    const url = 'https://api.razorpay.com/v1/orders/';
    const data = {
        amount: 100, // amount in the smallest currency unit
        currency: 'INR',
        payment_capture: true
    };
    console.log('data', data);

    const username = 'rzp_test_c9ZSQoNdAZavNr';
    const password = 'M3PlBQetVxVHN6SX3PkqtooV';
    const basicAuth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');

    const options = {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': basicAuth
        }
    };

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        res.send(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'An error occurred while creating the order' });
    }




//     if(type=='half'){ 
// payable_amount = original_amount/2;
// status = 'ongoing'
//     }
//     else {
// payable_amount = original_amount;

// if(done_assignment){
//   status = 'completed'
// }
// else{
//   status = 'ongoing'
// }

//     }


//     pool.query(`update orders set advance_payment = advance_payment+${payable_amount} , remaining_payment = remaining_payment-${payable_amount} , status = '${status}' where orderid = '${orderid}'`,(err,result)=>{
//       if(err) throw err;
//       else {
//         res.redirect(`/user/dashboard/view/orders/details?orderid=${orderid}`)
//       }
//     })

  })


router.get('/logout',(req,res)=>{
    req.session.userid = null;
    res.redirect('/user/login');
  })

module.exports = router;