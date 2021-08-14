var mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://usera6:mno@web322-a6.un4k1.mongodb.net/web322-a6?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});

var userSchema = new Schema({
    "userName"     : String,
    "password"     : String,
    "email"        : String,
    "loginHistory" : [{
        "dateTime" : Date,
        "userAgent": String
    }]
});

let User = mongoose.model("User", userSchema); 

module.exports.initialize = function(){
    return new Promise((resolve, reject)=>{
       let db = mongoose.createConnection(
           "mongodb+srv://usera6:mno@web322-a6.un4k1.mongodb.net/web322-a6?retryWrites=true&w=majority");

       db.on("error", (err)=>{   
        reject(`Unable to connect, error: ${err}`);
       });
       db.once("open", ()=>{
            User = db.model("users", userSchema);
            resolve();
       });
    });
};

module.exports.registerUser = function(userData){
    return new Promise((resolve, reject)=>{
        if(userData.password === userData.password2){
            bcrypt.genSalt(10).then((salt)=>{
                bcrypt.hash(userData.password, salt).then((hash)=>{
                    userData.password = hash;
                    let newUser = new User(userData);
                    newUser.save((err)=>{
                        if(err){
                            if(err.code == 11000){
                                reject("Username already taken");
                            }
                            else{
                                reject("There was an error creating the user " + err);
                            }
                        }else{
                            resolve();
                        }
                })
            }).catch((err)=>{
                console.log(err);
            });
            });
        }else{
            reject("Passwords do not match");
        }
    });
};

module.exports.checkUser = function(userData){
    return new Promise((resolve, reject)=>{
        User.find({ userName: userData.userName }).exec().then((users)=>{
            if(!users){
                reject(`Unable to find user: ${userData.userName}`);
            }
            bcrypt.compare(userData.password, users[0].password,
                function(err, result){
                    if(err) reject(`Incorrect password for user: ${userData.userName}`)
                    const logSession = {
                        dateTime: new Date().toString,
                        userAgent: userData.userAgent
                    };
                    users[0].loginHistory.push(logSession);
                    User.updateOne({
                        userName: users[0].userName},
                        { $set: {loginHistory: users[0].loginHistory }}
                    ).exec().then(()=> resolve(users[0])).catch((err)=>{
                        reject('Could not verify user');
                    })
                });

        }).catch((err)=>{
            reject(err + ". unable to find user: " + userData.user);
        });
    });
};