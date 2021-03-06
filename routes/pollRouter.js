var express=require('express');
var bodyParser=require('body-parser');
var mongoose=require('mongoose');
var Verify=require('./verify');
var Polls=require('../models/polls');
var requestIp=require("request-ip");

var pollRouter=express.Router();
pollRouter.use(bodyParser.json());

//mounted at localhost:3000/polls

pollRouter.route('/')
.get(Verify.verifyOrdinaryUser, function(req, res){

  if(req.decoded){
    if(req.decoded._doc.username=="admin"){
      var search={}
    }
    else{
      var search={$or: [{public: true}, {createdBy: req.decoded._doc._id}]};
    }
  }
  else{
    var search={public: true};
  }

  Polls.find(search)
    .populate("createdBy")
    .exec(function(err, item){
    if (err) throw err;

    var poll=item.map(function(poll){
      if(req.decoded){
        var user=req.decoded._doc.username;
      }
      else{
        var user="None"
      }

      return {question: poll.question, id: poll._id, owner: (poll.createdBy.username==user || user=="admin")}})

      res.json(poll)
  });
})
.post(Verify.verifyOrdinaryUser,function(req,res,next){
  var ops=req.body.option;

  var ans=ops.map(function(item){
    return {"option": item, "votes": 0}
  });
  req.body.answers=ans;
  if (req.body.public==undefined){
    req.body.public=true;
  }
  else{
    req.body.public=!req.body.public;
  }
  //req.body.public!=req.body.public;
  req.body.createdBy=req.decoded._doc._id;
  Polls.create(req.body, function(err, poll){
    if(err) throw err;
    var id=poll._id;
    res.send({redirect: '/myPolls'});
  })
});


pollRouter.route('/:id')
.get(Verify.verifyOrdinaryUser,function(req, res){
  if(req.decoded){
    var user=req.decoded._doc.username;
  }
  else{
    var user=null;
  }
  res.render('viewPoll', {name: user});
})
.post(function(req,res){

    var ip=requestIp.getClientIp(req);

    Polls.findById(req.params.id, function(err,poll){
      if(err) throw err;
      var arr=poll.answers;
      var j=[];
      j=arr.filter(function(item, i){

        return item.option==req.body.vote;

      });

      var voters=poll.voters.map(function(item){
        return item.ip;
      });

      if(j.length==0){
          poll.answers.push({option: req.body.vote, votes: 1});
      }
      else{
        poll.answers.id(j[0]._id).votes+=1;
      }
      if(voters.indexOf(ip)<0){
        poll.voters.push({ip: ip});
      }
      poll.save(function(err,poll){
        if(err) throw err;


        res.redirect(req.get('referer'));

      });
  });
})
.delete(Verify.verifyOrdinaryUser,function(req,res){
  Polls.remove({_id: req.params.id}, function(err, resp){
    if(err) throw err;
    res.json(resp);
  });
});

pollRouter.route('/polls/:id')
.get(Verify.verifyOrdinaryUser,function(req,res){
  Polls.findById(req.params.id)
  .populate('createdBy')
  .exec(function(err,poll){
    if(err) throw err;
    if(req.decoded){
      var user=req.decoded._doc.username;
    }
    else{
      var user="None"
    }
    
    var data=poll.toJSON();
    data.owner=(user=="admin" || poll.createdBy.username==user)
    res.send(data);
  })
});

module.exports=pollRouter;
