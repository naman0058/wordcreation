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



// router.post('/assignment/insert',verify.userAuthenticationToken, upload.fields([{ name: 'assignment' }, { name: 'supporting_documents' }]), async (req, res) => {
//     const { body, params, files } = req;
//     const { name } = params;


   

//     try {
//         body.created_at = verify.getCurrentDate();
//         body.status = 'pending';
//         body.updated_at = verify.getCurrentDate();
//         body.assignment = files['assignment'][0].filename; // Assuming you want the first image
//         body.supporting_documents = files['supporting_documents'][0].filename; 
//         body.userid = req.session.userid;
//         body.orderid = verify.generateOrderId();


//         console.log('body',body)


//         let subject = `Your Order Has Been Created`;
//         let message = `<p>Hi ${req.session.username},</p>
    
//     <p>Your order ${body.orderid} has been successfully created!</p>
    
    
//    <p> You will receive another email once your order is processed. </p>
    
//    <p> Thank you for choosing WordCreation! </p>
    
//    <p> Best regards </p>
//     `;

//         await queryAsync(`INSERT INTO orders SET ?`, body);
//         await verify.sendUserMail(req.session.useremail,subject,message)

//         res.redirect(`/user/dashboard/new/assignment?message=${encodeURIComponent('Saved Successfully')}`);
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Internal Server Error');
//     }
// });




router.post('/assignment/insert', verify.userAuthenticationToken, upload.fields([{ name: 'assignment' }, { name: 'supporting_documents' }]), async (req, res) => {
  const { body, params, files } = req;
  const { name } = params;

  try {
      body.created_at = verify.getCurrentDate();
      body.status = 'pending';
      body.updated_at = verify.getCurrentDate();
      body.assignment = files['assignment'][0].filename; // Assuming you want the first file
      body.supporting_documents = files['supporting_documents'][0].filename;
      body.userid = req.session.userid;
      body.orderid = verify.generateOrderId();

      console.log('body', body);

      let subject = `Order Creation Confirmation`;
      let message = `
          <p>Dear ${req.session.username},</p>
          
          <p>Thank you for submitting your task with WordCreation!</p>
          
          <p>We are pleased to inform you that we have successfully received your order. Our team is currently reviewing the details of your task to provide you with an accurate price estimate. You can expect to hear back from us within the next 6-12 hours with a detailed quote.</p>
          
          <p>We appreciate your patience and are committed to delivering the highest quality service to meet your needs. If you have any additional information or specific requirements that you would like to share, please feel free to reply to this email.</p>
          
          <p>In the meantime, should you have any questions or require further assistance, do not hesitate to reach out to our support team at <a href="mailto:support@wordcreation.in">support@wordcreation.in</a>.</p>
          
          <p>Thank you for choosing WordCreation. We look forward to working with you and helping you achieve your goals.</p>
          
          <p>Best regards,</p>
          <p>The WordCreation Team</p>
      `;

      await queryAsync(`INSERT INTO orders SET ?`, body);
      await verify.sendUserMail(req.session.useremail, subject, message);
      await verify.sendUserMail('support@wordcreation.in', 'New Order Received', 'A new order has been received.');


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



//    router.post('/update',verify.userAuthenticationToken, async(req, res) => {
//     console.log('req.body', req.body);
//     pool.query('UPDATE users SET ? WHERE id = ?', [req.body, req.body.id], async(err, result) => {
//         if (err) {
//             console.error('Error updating data:', err);
//             return res.status(500).json({ msg: 'error' });
//         }
//         else{
//           let subject = `Your Account Information Has Been Updated`
//           let message = `<p>Hi ${req.body.name},</p>

// <p>We wanted to let you know that your account information has been successfully updated. If you made these changes, no further action is needed.</p>

// <p>If you did not make these changes, please contact us immediately.</p>

// <p>Best regards </p>`
//           await verify.sendUserMail(req.body.email,subject,message)
//         return res.redirect('/user/dashboard/myprofile')
//         }

//     });
//   });
  


router.post('/update', verify.userAuthenticationToken, async (req, res) => {
  console.log('req.body', req.body);
  pool.query('UPDATE users SET ? WHERE id = ?', [req.body, req.body.id], async (err, result) => {
      if (err) {
          console.error('Error updating data:', err);
          return res.status(500).json({ msg: 'error' });
      } else {
          let subject = `Confirmation: Your Account Information Has Been Updated`;
          let message = `
              <p>Dear ${req.body.name},</p>
              
              <p>We hope this message finds you well.</p>
              
              <p>We are writing to confirm that your account information on WordCreation has been successfully updated. The changes you requested have been implemented, and you can now enjoy the enhanced security and updated details of your account.</p>
              
              <p>If you updated your password, please use your new password the next time you log in. If you updated other account details, such as your email address or contact information, these changes have been saved and are now active.</p>
              
              <p>Should you notice any discrepancies or if you did not authorize this update, please contact our support team immediately at support@wordcreation.in. We are here to assist you 24/7.</p>
              
              <p>Thank you for being a valued member of the WordCreation community.</p>
              
              <p>Best regards,</p>
              <p>The WordCreation Team</p>
              <p>support@wordcreation.in</p>
              <p>https://wordcreation.in</p>
          `;
          await verify.sendUserMail(req.body.email, subject, message);
          return res.redirect('/user/dashboard/myprofile');
      }
  });
});

  

  router.get('/transaction', (req, res) => {
    const { username, usernumber, orderid, from_date, to_date, uniqueid } = req.query;
  
    let query = `SELECT pr.*, u.name as username, u.number as usernumber, u.unique_id as uniqueid
                 FROM payment_response pr
                 JOIN users u ON pr.userid = u.id
                 WHERE 1`;

                 query += ` AND u.id = '${req.session.userid}'`;
  
    if (username) query += ` AND u.name = '${username}'`;
    if (usernumber) query += ` AND u.number = '${usernumber}'`;
    if (uniqueid) query += ` AND u.unique_id = '${uniqueid}'`;
    if (orderid) query += ` AND pr.orderid = '${orderid}'`;
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
      res.render(`${folder}/orderDetails`, { result,msg:req.query.msg,name:req.session.username,email:req.session.useremail,number:req.session.usernumber });
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



  function generatereceipt() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let receipt = 'order_rcptid_';
    for (let i = 0; i < 12; i++) {
      receipt += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return receipt;
}

router.get('/generate-order',async(req,res)=>{
  let type = req.query.type;
  let result =  await user.getOrderDetails(req.query.orderid);
  let original_amount = result[0].remaining_payment;
  let payable_amount;


      if(type=='half'){ 
payable_amount = original_amount/2;
    }
    else {
payable_amount = original_amount;
}


var options = {
  amount: payable_amount*100,  // amount in the smallest currency unit
  // amount: 100,  // amount in the smallest currency unit
  currency: "INR",
  receipt: generatereceipt()
};
instance.orders.create(options, function(err, order) {
  console.log(order);
  req.session.payable_amount = order.amount/100;
  req.session.generateOrderId = order.id
  res.json(order)
});
 })


 const crypto = require('crypto');

 function hmac_sha256(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

//  router.post('/razorpay-response',async(req,res)=>{
//   let body = req.body;

//   if(body.razorpay_payment_id && body.razorpay_order_id && body.razorpay_signature){
//     const data = req.session.generateOrderId + '|' + body.razorpay_payment_id;
//     let generated_signature = hmac_sha256(data, 'M3PlBQetVxVHN6SX3PkqtooV');
//     if (generated_signature == body.razorpay_signature) {
//       body.orderid = req.query.orderid;
//       body.type = req.query.type
//       body.amount = req.session.payable_amount;
//       body.generateOrderId = req.session.generateOrderId;
//       body.userid = req.session.userid
//       body.created_at = verify.getCurrentDate()
// //  res.json({body:req.body,query:req.query})
// pool.query(`insert into payment_response set ?`,body,(err,result)=>{
//   if(err) throw err;
//   else {
//     pool.query(`update orders set advance_payment = advance_payment+${body.amount} , remaining_payment = remaining_payment-${body.amount} , status = 'ongoing' where orderid = '${body.orderid}'`,async(err,result)=>{
//       if(err) throw err;
//       else {
//         let subject = `Payment Received for Order ${req.query.orderid}`
//         let message = `Hi ${req.session.username},

// Thank you for your payment!

// **Order Details:**
// - **Order Number:** ${req.query.orderid}
// - **Amount Paid:** ${req.session.payable_amount}
// - **Payment Date:** ${verify.getCurrentDate()}

// We are processing your order and will keep you updated on its status.

// Best regards,
// `
//         await verify.sendUserMail(req.session.useremail,subject,message)
//         await verify.sendUserMail('contact@wordcreation.in',subject,message)

//         res.redirect(`/user/dashboard/view/orders/details?orderid=${body.orderid}`)
//       }
//     })

//   }
// })
//     }
//     else{
//       res.json({msg:'Unauthroized Payment'})
//     }
    

//   }
//   else{
//     res.json({msg:'Error Occured'})
//   }
 
 
//  })



router.post('/razorpay-response', async (req, res) => {
  let body = req.body;

  if (body.razorpay_payment_id && body.razorpay_order_id && body.razorpay_signature) {
    const data = req.session.generateOrderId + '|' + body.razorpay_payment_id;
    let generated_signature = hmac_sha256(data, 'M3PlBQetVxVHN6SX3PkqtooV');

    if (generated_signature == body.razorpay_signature) {
      body.orderid = req.query.orderid;
      body.type = req.query.type;
      body.amount = req.session.payable_amount;
      body.generateOrderId = req.session.generateOrderId;
      body.userid = req.session.userid;
      body.created_at = verify.getCurrentDate();

      pool.query(`INSERT INTO payment_response SET ?`, body, (err, result) => {
        if (err) throw err;
        else {
          pool.query(`UPDATE orders SET advance_payment = advance_payment + ${body.amount}, remaining_payment = remaining_payment - ${body.amount}, status = 'ongoing' WHERE orderid = '${body.orderid}'`, async (err, result) => {
            if (err) throw err;
            else {
              let userSubject = `Payment Confirmation for Your Recent Transaction`;
              let userMessage = `
                <p>Dear ${req.session.username},</p>
                
                <p>Thank you for your recent payment. We are pleased to inform you that your payment of ${req.session.payable_amount} has been successfully processed.</p>
                
                <p><strong>Transaction Details:</strong></p>
                <p>- <strong>Transaction ID:</strong> ${body.razorpay_payment_id}</p>
                <p>- <strong>Order ID:</strong> ${req.query.orderid}</p>
                <p>- <strong>Amount:</strong> ${req.session.payable_amount}</p>
                <p>- <strong>Date:</strong> ${verify.getCurrentDate()}</p>
                
                <p>If you have any questions or need further assistance, please do not hesitate to contact us.</p>
                
                <p>Thank you for choosing WordCreation.</p>
                
                <p>Best regards,</p>
                <p>The WordCreation Team</p>
                <p>support@wordcreation.ind</p>
                <p>https://wordcreation.in</p>
              `;

              let adminSubject = `Payment Received Confirmation`;
              let adminMessage = `
                <p>Dear Admin,</p>
                
                <p>We have successfully received a payment from ${req.session.username} for ${req.session.payable_amount}. Please find the details of the transaction below:</p>
                
                <p><strong>Transaction Details:</strong></p>
                <p>- <strong>User Name:</strong> ${req.session.username}</p>
                <p>- <strong>Transaction ID:</strong> ${body.razorpay_payment_id}</p>
                <p>- <strong>Order ID:</strong> ${req.query.orderid}</p>
                <p>- <strong>Amount:</strong> ${req.session.payable_amount}</p>
                <p>- <strong>Date:</strong> ${verify.getCurrentDate()}</p>
                
                <p>Please update your records accordingly and let us know if any further action is required.</p>
                
                <p>Thank you for your attention to this matter.</p>
                
                 <p>Best regards,</p>
                <p>The WordCreation Team</p>
                <p>support@wordcreation.ind</p>
                <p>https://wordcreation.in</p>
              `;

              await verify.sendUserMail(req.session.useremail, userSubject, userMessage);
              await verify.sendUserMail('contact@wordcreation.in', adminSubject, adminMessage);

              res.redirect(`/user/dashboard/view/orders/details?orderid=${body.orderid}`);
            }
          });
        }
      });
    } else {
      res.json({ msg: 'Unauthorized Payment' });
    }
  } else {
    res.json({ msg: 'Error Occurred' });
  }
});

 



  router.get('/payment',async(req,res)=>{
    let orderid = req.query.orderid;
    let type = req.query.type;
    let result =  await user.getOrderDetails(req.query.orderid);
    let original_amount = result[0].remaining_payment;
    let done_assignment = result[0].done_assignment;
    let payable_amount;
    let status ;


  


    if(type=='half'){ 
payable_amount = original_amount/2;
status = 'ongoing'
    }
    else {
payable_amount = original_amount;

if(done_assignment){
  status = 'completed'
}
else{
  status = 'ongoing'
}

    }


    pool.query(`update orders set advance_payment = advance_payment+${payable_amount} , remaining_payment = remaining_payment-${payable_amount} , status = '${status}' where orderid = '${orderid}'`,(err,result)=>{
      if(err) throw err;
      else {
        res.redirect(`/user/dashboard/view/orders/details?orderid=${orderid}`)
      }
    })

  })



  


router.get('/logout',(req,res)=>{
    req.session.userid = null;
    res.redirect('/user/login');
  })

module.exports = router;