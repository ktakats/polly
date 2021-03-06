var express = require('express');
var router = express.Router();
var Verify=require('./verify');

/* GET home page. */
router.get('/', Verify.verifyOrdinaryUser, function(req, res, next) {
  if(req.decoded){
    var user=req.decoded._doc.username;
  }
  else{
    var user=null;
  }
  res.render('home', {name: user});
});

router.get('/about', function(req,res){

  res.render('about')
})

router.get('/signup', function(req,res){
  res.render('signup')
})

router.route('/profile')
.get(Verify.verifyOrdinaryUser,function(req,res){
  res.render('profile', {name: req.decoded._doc.username});
});

router.route('/newPoll')
.get(Verify.verifyOrdinaryUser, function(req,res){
  res.render('newPoll', {name: req.decoded._doc.username})
});

router.route('/myPolls')
.get(Verify.verifyOrdinaryUser, function(req,res){
  if(req.decoded){
    var user=req.decoded._doc.username;
  }
  else{
    var user=null;
  }
  res.render('myPolls', {name: user})
});


module.exports = router;
