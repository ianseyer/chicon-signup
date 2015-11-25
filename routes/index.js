var express = require('express');
var router = express.Router();
var stripe = require('stripe')(process.env.STRIPE_SECRET);
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(process.env.MANDRILL);


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

/*
Simple, static thank you page
*/
router.get('/thanks', function(req, res){
  res.render('thanks')
})

/*
A route to handle charging a customer and subscribing them to a stripe plan.
All plan info should be managed via stripe. Use descriptive plan ids, and place them in index.jade on the "type" parameter of the payment button.

If it's a dropin, simply create a new customer and charge them 1000 pennies.
Otherwise, create a new customer that is subscribed to that plan. Assuming their cc info was correct, this will immediately charge them and begin the subscription.

Regardless, mail them an invoice.
*/
router.post('/charge', function(req, res){
  //construct our email
  var message = {
    'subject': 'Successful Chicon Signup & Information',
    'from_email': 'amanda@chicon.co',
    'from_name': 'Amanda Phillips',
    'to': [{'email':req.body.email, 'type':'to'}]
  }

  //it was a drop in
  if(req.body.type == "drop"){
    stripe.customers.create({
      description: "Chicon Collective Drop In",
      email: req.body.email,
      source: req.body.token.id
    })
    .then(function(customer){
      stripe.charges.create({
        amount: 1000,
        currency: "USD",
        customer: customer.id
      })
      .then(function(charge){
        mandrill_client.messages.sendTemplate({'template_name':'signon-1', 'template_content':[{}], 'message':message, 'async':false, 'ip_pool':'Main Pool'}, function(result){
          res.send(200)
        }, function(err){
          console.log(err)
          res.send(500)
        })
      })
    })
    .catch(function(err){
      console.log(err)
    })
  }
  //It was a subscription
  else {
    stripe.customers.create({
      description: "Chicon Collective",
      email: req.body.email,
      source: req.body.token.id,
      plan: req.body.type
    })
    .then(function(customer){
      mandrill_client.messages.sendTemplate({'template_name':'signon-1', 'template_content':[{}], 'message':message, 'async':false, 'ip_pool':'Main Pool'}, function(result){
        res.send(200)
      }, function(err){
        console.log(err)
        res.send(500)
      })
    })
    .catch(function(err){
      console.log(err);
    })
  }

})

module.exports = router;
