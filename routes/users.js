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


router.get('/view/orders/delete', verify.adminAuthenticationToken, async (req, res) => {
  try {
    let result =  await user.deleteOrder(req.query.orderid);
    res.redirect(`/admin/dashboard/users/view/orders?status=${req.query.status}`)
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



router.post('/update/orders',verify.adminAuthenticationToken,upload.single('done_assignment'),async(req,res)=>{
  try {
    let body = req.body
    let status;
    if (req.file && req.file.filename) {

      body.done_assignment = req.file.filename
    }
    let result1 =  await user.getOrderDetails(req.body.orderid);
    console.log('status',result1[0].status)
    if(result1[0].status == 'pending'){
      status = 'quoted'
    }
    else{
      status = result1[0].status
    }

    body.updated_at = verify.getCurrentDate();
    body.advance_payment = '0'
    body.remaining_payment = body.amount;
    body.status = status


    const result = await user.updateOrders(req.body.orderid,req.body);
    res.redirect(`/admin/dashboard/users/view/orders/details?orderid=${body.orderid}&msg=Updated Successfull`)
  } catch (error) {
      console.error('Error in route:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
})




router.get('/order/update',verify.adminAuthenticationToken,(req,res)=>{
  pool.query(`update orders set status = '${req.query.status}' where orderid = '${req.query.orderid}'`,(err,result)=>{
    if(err) throw err;
    else res.redirect('/admin/dashboard/users/view/orders?status=ongoing')
  })
})





module.exports = router;