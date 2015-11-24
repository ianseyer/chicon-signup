var express = require('express');
var router = express.Router();
var stripe = require('stripe')(process.env.STRIPE_SECRET);
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
*/
router.post('/charge', function(req, res){
  if(req.body.type == "drop"){
    stripe.customers.create({
      description: "Chicon Collective Drop In",
      email: req.body.token.email,
      source: req.body.token.id
    })
    .then(function(customer){
      stripe.charges.create({
        amount: 1000,
        currency: "USD",
        customer: customer.id
      })
      .then(function(charge){
        res.send(200)
      })
    })
    .catch(function(err){
      console.log(err)
    })
  }
  else {
    stripe.customers.create({
      description: "Chicon Collective",
      email: req.body.token.email,
      source: req.body.token.id,
      plan: req.body.type
    })
    .then(function(customer){
      res.send(200)
    })
    .catch(function(err){
      console.log(err);
    })
  }
})

module.exports = router;
