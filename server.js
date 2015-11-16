const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const moment = require('moment');

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis")
  var client = redis.createClient(rtg.port, rtg.hostname);

  client.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require('redis');
  var client = redis.createClient();
}

const bodyParser = require('body-parser');
const User = require('./user.js')
var crypto = require('crypto');
var PORT = process.env.PORT || 3000;
const _ = require('lodash')
const server = http.listen(PORT, function() {
  console.log("Server is up and running on port: " + PORT)
});
const renderHomepage = require("./routes.js")

var questions;

var count = 0;
var votes = {}
var userUrlHash;
var adminUrlHash;
var currentUser;
var voteCount = {};
var adminVoteCount = {}

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// app.get('/', function(request, response) {
//   response.sendFile(__dirname + '/public/index.html')
// });

app.get('/', renderHomepage);

app.get('/voted', function(request, response){
  response.render('voted')
})

app.get('/new', function(request, response) {
  response.render('new' , {userUrl: userUrlHash, adminUrl: adminUrlHash})
});

app.get('/closed', function(request, response) {
  response.render('closed')
})

io.on('connection', function(socket) {
//nextTick eventLoop
  app.get("/poll/:id", function(request, response) {
    client.hgetall(request.params.id, function(err, dbset){
      if(dbset.user_url === request.params.id) {
        if(dbset.status === "0"){
          response.render('user', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2, answer_3: dbset.answer_3, answer_4: dbset.answer_4,answer_5: dbset.answer_5, answer_6: dbset.answer_6})
        }else{
          response.render('closed')
        }
      } else {
        client.hgetall(dbset.admin_user_url, function(err, dbset){
          if(dbset.status === "0"){
            if(dbset.timer > 0) {
              var eventTime= moment().add('seconds', dbset.timer);
              var currentTime = moment();
              var diffTime = eventTime - currentTime;
              setTimeout(function(){
                closePollTimer(dbset.user_url);
              }, diffTime);
            }
            answers = []
            answers.push(dbset.answer_1)
            answers.push(dbset.answer_2)
            answers.push(dbset.answer_3)
            answers.push(dbset.answer_4)
            answers.push(dbset.answer_5)
            answers.push(dbset.answer_6)
            buildAdminVoteHash(answers,dbset.user_url)
            response.render('admin', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2, answer_3: dbset.answer_3, answer_4: dbset.answer_4,answer_5: dbset.answer_5, answer_6: dbset.answer_6})
          }else{
            response.render('closed')
          }
        });

      }
    })
  })
  console.log('User has connected.'+socket.id, io.engine.clientsCount);
  io.sockets.emit('usersConnected', io.engine.clientsCount);

  socket.on("close", function (message) {

    client.hgetall(message.admin_url, function(err, dbset){

      client.hset(dbset.admin_user_url, "status", 1, redis.print)
      io.sockets.in(dbset.admin_user_url).emit('closePoll');
    })


  })

  socket.on("poll", function (message) {

    userUrlHash = crypto.createHash("md5").update(socket.id+Date.now()).digest("hex");
    adminUrlHash = crypto.createHash("md5").update(socket + Date.now()).digest("hex")
    currentUser = new User(count,adminUrlHash, userUrlHash)
    client.hset(userUrlHash, "question", message.question, redis.print);
    _.forEach(message.answers, function(value, index) {
      client.hset(userUrlHash,"answer_"+(index+1), value, redis.print)
    })
    client.hset(userUrlHash,"answer_1_count", 0, redis.print);
    client.hset(userUrlHash,"answer_2_count", 0, redis.print);
    client.hset(userUrlHash,"answer_3_count", 0, redis.print);
    client.hset(userUrlHash,"answer_4_count", 0, redis.print);
    client.hset(userUrlHash,"admin_url", adminUrlHash, redis.print);
    client.hset(userUrlHash, "user_url",userUrlHash, redis.print);
    client.hset(userUrlHash, "socketId",socket.id, redis.print);
    client.hset(userUrlHash, "timer",message.timer, redis.print);
    client.hset(userUrlHash, "status", 0, redis.print);
    client.hset(adminUrlHash, "admin_user_url",userUrlHash, redis.print);
  });

  socket.on('voteCast', function (message) {
    votes[message.currentUrl]={}
    votes[message.currentUrl][socket.id] = message.answer;
    io.sockets.in(message.currentUrl).emit('voteCount', countVotes(votes,message.answers, message.currentUrl, socket.id));
    io.sockets.in(message.currentUrl).emit('adminVoteCount', countAdminVotes(votes,message.answers, message.currentUrl, socket.id));
    console.log(votes);
  });

  socket.on('setRooms', function(data) {
    client.hgetall(data.currentUrl, function(err, dbset){
      if(dbset.user_url === data.currentUrl ){
        socket.join(dbset.user_url);
        console.log(io.sockets.adapter.rooms)
      }else{
        socket.join(dbset.admin_user_url);
        console.log(io.sockets.adapter.rooms)
      }
    });
  })
  socket.on('disconnect', function () {
    console.log('A user has disconnected.', io.engine.clientsCount);
    io.sockets.emit('usersConnected', io.engine.clientsCount);
  });
});

function closePollTimer(url) {
  client.hset(url, "status", 1, redis.print)
  io.sockets.in(url).emit('closePoll');
}


function buildVoteHash(answers, roomId, socketId) {
  voteCount[roomId] = {}
  voteCount[roomId][socketId]={}

  _.forEach(answers, function(answer) {

    if(!(answer in voteCount)){

      voteCount[roomId][socketId][answer] = 0
    }
  })

}

function buildAdminVoteHash(answers, roomId, socketId) {
  adminVoteCount[roomId] = {}

  _.forEach(answers, function(answer) {

    if(!(answer in voteCount)){


      adminVoteCount[roomId][answer] = 0

    }
  })

}

function countVotes(votes, answers, room, socketId) {

  buildVoteHash(answers,room, socketId)

  _.forEach(votes, function(vote) {
    voteCount[room][socketId][vote[socketId]]++
  })
  return voteCount[room][socketId];
}

function countAdminVotes(votes, answers, room, socketId) {
  _.forEach(votes, function(vote) {
    adminVoteCount[room][vote[socketId]]++
  })

  
  return adminVoteCount[room];
}

function closePoll(userUrl) {
  client.hset(userUrl, "status", 1, redis.print)
}

module.exports = app;
