var passport=require('passport');
var LocalStrategy=require('passport-local').Strategy;
var FacebookStrategy=require('passport-facebook').Strategy;
var User=require('./models/user');
require('dotenv').config({silent: true});
exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



exports.facebook = passport.use(new FacebookStrategy({
  clientID: process.env.facebookclientID,
  clientSecret: process.env.facebookclientSecret,
  callbackURL: process.env.facebookcallbackURL
},
function(accessToken, refreshToken, profile, done){
  User.findOne({OauthId: profile.id}, function(err, user){
    if(err){
      console.log(err);
    }
    if(!err && user !== null){
      done(null,user);
    }
    else{
      user=new User({
        username: profile.displayName
      });
      user.OauthId=profile.id;
      user.OauthToken=accessToken;
      user.save(function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("saving user");
          done(null, user);
        }
      });
    }
  });
}
));
