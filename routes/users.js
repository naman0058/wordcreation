var express = require('express');
var router = express.Router();
var pool = require('./pool');
const util = require('util');
const queryAsync = util.promisify(pool.query).bind(pool);
var verify = require('./verify');
var user = require('./function');
const upload = require('./multer');
var folder = 'users'
var isimage = ['brand','type']
var databasetable = 'users'



router.get('/list/:status', verify.adminAuthenticationToken, async (req, res) => {
    try {
      const result = await user.getlist(req.params.status,false);
      res.render(`${folder}/list`,{result,status:req.params.status});
    } catch (error) {
      console.error('Error in route:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/update',verify.adminAuthenticationToken,async(req,res)=>{
  try {
    const result = await user.profile(req.query.id);
    res.render(`${folder}/update`,{result,id:req.params.id,msg:req.query.message});
  } catch (error) {
      console.error('Error in route:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
})


router.post('/update',verify.adminAuthenticationToken,async(req,res)=>{
  try {
    const result = await user.update(req.body.id,req.body);
    res.redirect(`/admin/dashboard/users/update?id=${req.body.id}&message=${encodeURIComponent('Saved Successfully')}`);

  } catch (error) {
      console.error('Error in route:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
})


router.get('/delete',verify.adminAuthenticationToken, async (req, res) => {
  const { id , status , value } = req.query;
  
  try {
      await queryAsync(`UPDATE ${databasetable} SET status = '${value}' WHERE id = ?`, [id]);
      res.redirect(`/admin/dashboard/users/list/${status}`);
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});


router.get('/permanent-delete',verify.adminAuthenticationToken, async (req, res) => {
  const { id } = req.query;
  
  try {
      await queryAsync(`delete from ${databasetable} WHERE id = ?`, [id]);
      res.redirect(`/admin/dashboard/users/list/delete`);
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});
  


router.get('/view/orders', verify.adminAuthenticationToken, async (req, res) => {
  try {
    let result;
    if (req.query.id) {
      result = await user.getOrder(req.query.id);
    } else {
      result = await user.getOrder(req.query.status);
    }
    res.render(`${folder}/orders`, { result });
  } catch (error) {
    console.error('Error in route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});









router.get('/view/orders/details', verify.adminAuthenticationToken, async (req, res) => {
  try {
    let result =  await user.getOrderDetails(req.query.orderid);
    res.render(`${folder}/orderDetails`, { result,msg:req.query.msg });
  } catch (error) {
    console.error('Error in route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// router.get('/view/orders/delete', verify.adminAuthenticationToken, async (req, res) => {
//   try {
//     let orderDetails = await user.getOrderDetails(req.query.orderid);
//     let userdetails = await user.profile(orderDetails[0].userid);
//     let result =  await user.deleteOrder(req.query.orderid);


//     let subject = `Your Order Has Been Cancelled`
//     let message = `<p> Hi ${userdetails[0].name},</p>

// <p>We're sorry to inform you that your order ${req.query.orderid} has been cancelled. </p>


// <p>Best regards</p>`


// await verify.sendUserMail(userdetails[0].email,subject,message);

//     res.redirect(`/admin/dashboard/users/view/orders?status=${req.query.status}`)
//   } catch (error) {
//     console.error('Error in route:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });



router.get('/view/orders/delete', verify.adminAuthenticationToken, async (req, res) => {
  try {
    let orderDetails = await user.getOrderDetails(req.query.orderid);
    let userdetails = await user.profile(orderDetails[0].userid);
    let result = await user.deleteOrder(req.query.orderid);

    let subject = `Order Cancellation Confirmation`;
    let message = `
      <p>Dear ${userdetails[0].name},</p>
      
      <p>We hope this message finds you well.</p>
      
      <p>We regret to inform you that due to an unusually high volume of orders, we have had to cancel your recent order placed on ${orderDetails[0].created_at} with order number ${req.query.orderid}.</p>
      
      <p>We understand how important your order is and apologize for any inconvenience this may cause. Our team is working diligently to manage the current demand and improve our services to prevent such issues in the future.</p>
      
      <p>Thank you for your understanding and continued support.</p>
      
      <p>Best regards,</p>
      <p>WordCreation Team</p>
      <p>support@wordcreation.in</p>
      <p>https://wordcreation.in</p>
    `;

    await verify.sendUserMail(userdetails[0].email, subject, message);

    res.redirect(`/admin/dashboard/users/view/orders?status=${req.query.status}`);
  } catch (error) {
    console.error('Error in route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});







router.get('/view/transaction', verify.adminAuthenticationToken, async (req, res) => {
  try {
    let result;
    if (req.query.id) {
      result = await user.getTransaction(req.query.id);
    } else {
      result = await user.getTransaction('all');
    }
    res.render(`${folder}/transaction`, { result });
  } catch (error) {
    console.error('Error in route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.get('/view/logs', verify.adminAuthenticationToken, async (req, res) => {
  try {
    let result;
    if (req.query.id) {
      result = await user.getLogs(req.query.id);
    } else {
      result = await user.getLogs('all');
    }
    res.render(`${folder}/logs`, { result });
  } catch (error) {
    console.error('Error in route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.get('/view/transaction/details', verify.adminAuthenticationToken, async (req, res) => {
  try {
    
    const result = await user.getTransactionDetails(req.query.status,req.query.orderid);
    if(req.query.status == 'credit'){
      res.render(`${folder}/transactionDetails`, { result });
    }
    else{
      res.render(`${folder}/bookingDetails`, { result });
    }
  } catch (error) {
    console.error('Error in route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// router.post('/update/orders',verify.adminAuthenticationToken,upload.single('done_assignment'),async(req,res)=>{
//   try {
//     let body = req.body
//     let status;
//     let subject;
//     let message;
//     if (req.file && req.file.filename) {

//       body.done_assignment = req.file.filename
//     }
//     let result1 =  await user.getOrderDetails(req.body.orderid);
//     let userData = await user.profile(req.body.userid)
//     console.log('status',result1[0].status)
//     if(result1[0].status == 'pending'){
//       status = 'quoted'
//       body.advance_payment = '0'
//       body.remaining_payment = body.amount;
//       subject = `Your Order Quote is Ready`
//       message = `<p>Hi ${userData[0].name},</p>

// <p>We have prepared a quote for your order ${req.body.orderid}.</p>

// <p>**Quote Details:**</p>
// <p>- **Quoted Amount:** ${req.body.amount} </p>


// <p>Best regards,</p>

// `
//     }
//     else{
//       status = result1[0].status
//       body.advance_payment
//     body.remaining_payment
//       subject = `Task Submitted Successfully`
//       message = `<p>Hi ${userData[0].name},</p>

// <p>Your task ${req.body.orderid} has been submitted successfully!</p>

// <p>Best regards </p>

// `
//     }

//     body.updated_at = verify.getCurrentDate();
//     body.status = status



//     const result = await user.updateOrders(req.body.orderid,req.body);
//     await verify.sendUserMail(userData[0].email,subject,message);
//     res.redirect(`/admin/dashboard/users/view/orders/details?orderid=${body.orderid}&msg=Updated Successfull`)
//   } catch (error) {
//       console.error('Error in route:', error);
//       res.status(500).json({ error: 'Internal server error' });
//   }
// })



router.post('/update/orders', verify.adminAuthenticationToken, upload.single('done_assignment'), async (req, res) => {
  try {
    let body = req.body;
    let status;
    let subject;
    let message;

    if (req.file && req.file.filename) {
      body.done_assignment = req.file.filename;
    }

    let result1 = await user.getOrderDetails(req.body.orderid);
    let userData = await user.profile(req.body.userid);

    if (result1[0].status == 'pending') {
      status = 'quoted';
      body.advance_payment = '0';
      body.remaining_payment = body.amount;
      
      subject = `Payment Quotation Confirmation for Your Task`;
      message = `
        <p>Dear ${userData[0].name},</p>
        
        <p>We hope this message finds you well.</p>
        
        <p>We are pleased to inform you that your payment for the task has been successfully quoted. Our admin team has reviewed and confirmed the payment details associated with your task.</p>
        
        <p><strong>Details:</strong></p>
        <p>- <strong>Order ID:</strong> ${req.body.orderid}</p>
        <p>- <strong>Quoted Amount:</strong> ${req.body.amount}</p>
        <p>- <strong>Payment Status:</strong> Successfully Quoted</p>
        
        <p>Should you have any questions or need further assistance regarding this payment or any other matter, please feel free to reach out to our support team.</p>
        
        <p>Thank you for your continued support and cooperation.</p>
        
        <p>Best regards,</p>
        <p>The WordCreation Team</p>
        <p>support@wordcreation.in</p>
        <p>https://wordcreation.in/</p>
      `;
    } else {
      status = result1[0].status;
      
      subject = `Task Submission Confirmation and Review Instructions`;
      message = `
        <p>Dear ${userData[0].name},</p>
        
        <p>We are pleased to inform you that your task has been successfully submitted and is now ready for review. Our admin team has completed the task and prepared the task file for your verification.</p>
        
        <p><strong>To review your task:</strong></p>
        <ol>
          <li>Please download the task file</li>
          <li>Review the completed task to ensure it meets your requirements.</li>
          <li>If you have any feedback or require any changes, kindly reply to this email with your comments.</li>
        </ol>
        
        <p>We appreciate your prompt attention to this matter. Your feedback will help us ensure that we meet your expectations and deliver high-quality results.</p>
        
        <p>Thank you for choosing WordCreation. If you have any questions or need further assistance, please feel free to reach out to us.</p>
        
        <p>Best regards,</p>
      <p>support@wordcreation.in</p>
        <p>https://wordcreation.in/</p>
      `;
    }

    body.updated_at = verify.getCurrentDate();
    body.status = status;

    const result = await user.updateOrders(req.body.orderid, req.body);
    await verify.sendUserMail(userData[0].email, subject, message);

    res.redirect(`/admin/dashboard/users/view/orders/details?orderid=${body.orderid}&msg=Updated Successfully`);
  } catch (error) {
    console.error('Error in route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});





// router.get('/order/update',verify.adminAuthenticationToken,async(req,res)=>{
//   pool.query(`update orders set status = '${req.query.status}' where orderid = '${req.query.orderid}'`,async(err,result)=>{
//     if(err) throw err;
//     else {
//       let subject = `Your Order ${req.query.orderid} is Complete`
      
//       let orderDetails = await user.getOrderDetails(req.query.orderid)
//       let userData = await user.profile(orderDetails[0].userid)
//       let message = `<p>Hi ${userData[0].name}</p>,

// <p>We are pleased to inform you that your order ${req.query.orderid} has been marked as complete!</p>

// <p>**Order Details:**</p>

// <p>- **Completion Date:** ${verify.getCurrentDate()}</p>

// <p>Thank you for choosing. We hope to serve you again soon!</p>

// <p>Best regards</p>`
//       await verify.sendUserMail(userData[0].email,subject,message)
//       res.redirect('/admin/dashboard/users/view/orders?status=ongoing')
//     } 
//   })
// })


router.get('/order/update', verify.adminAuthenticationToken, async (req, res) => {
  const { status, orderid } = req.query;

  try {
    // Parameterized query to prevent SQL injection
    const query = 'UPDATE orders SET status = ? WHERE orderid = ?';
    await queryAsync(query, [status, orderid]);

    const orderDetails = await user.getOrderDetails(orderid);
    const userData = await user.profile(orderDetails[0].userid);

    const subject = 'Your Order is Complete!';
    const message = `
      <p>Dear ${userData[0].name},</p>

      <p>We are pleased to inform you that your order ${(orderid)} with WordCreation has been successfully completed!</p>

      <p>Thank you for choosing our services. We hope you are satisfied with the results. If you have any questions or need further assistance, please do not hesitate to reach out to us.</p>

      <p>We look forward to serving you again in the future.</p>

      <p>Best regards,</p>
      <p>The WordCreation Team</p>
      <p>support@wordcreation.in</p>
      <p>https://wordcreation.in</p>
    `;

    await verify.sendUserMail(userData[0].email, subject, message);

    res.redirect('/admin/dashboard/users/view/orders?status=ongoing');
  } catch (error) {
    console.error('Error updating order or sending email:', error);
    res.status(500).send('Internal Server Error');
  }
});






module.exports = router;