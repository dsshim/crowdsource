const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const moment = require('moment');
const bodyParser = require('body-parser');
const User = require('./user.js');
const crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const _ = require('lodash');
const server = http.listen(PORT, function() {
});
const routes = require('./routes/routes');
var count = 0;
var votes = {};
var userUrlHash, adminUrlHash;
var voteCount = {};
var adminVoteCount = {};
var answers = [];

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis");
  var client = redis.createClient(rtg.port, rtg.hostname);

  client.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require('redis');
  var client = redis.createClient();
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join('public')));
app.set('view engine', 'ejs');
app.get('/', routes);
app.get('/voted', routes);
app.get('/closed', routes);

app.get('/new', function(request, response) {
  response.render('new' , {userUrl: userUrlHash, adminUrl: adminUrlHash});
});

io.on('connection', function(socket) {
  app.get("/poll/:id", function(request, response) {
    client.hgetall(request.params.id, function(err, dbset){
      if(dbset.user_url === request.params.id) {
        if(dbset.status === "0"){
          response.render('user', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2, answer_3: dbset.answer_3, answer_4: dbset.answer_4,answer_5: dbset.answer_5, answer_6: dbset.answer_6});
        }else{
          response.render('closed', {question: dbset.question, answer_1: dbset.answer_1_name, answer_2: dbset.answer_2_name, answer_3: dbset.answer_3_name, answer_4: dbset.answer_4_name,answer_5: dbset.answer_5_name, answer_6: dbset.answer_6_name, answer_1_total: dbset.answer_1_count,answer_2_total: dbset.answer_2_count,answer_3_total: dbset.answer_3_count,answer_4_total: dbset.answer_4_count,answer_5_total: dbset.answer_5_count,answer_6_total: dbset.answer_6_count});
        }
      } else {
        client.hgetall(dbset.admin_user_url, function(err, dbset){
          if(dbset.status === "0"){
            if(dbset.timer > 0) {
              setTimer(dbset.user_url, dbset.timer);
            }
            buildAdminVoteHash(answers,dbset.user_url);
            buildVoteHash(answers,dbset.user_url);
            response.render('admin', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2, answer_3: dbset.answer_3, answer_4: dbset.answer_4,answer_5: dbset.answer_5, answer_6: dbset.answer_6});
          }else{
            response.render('closed', {question: dbset.question, answer_1: dbset.answer_1_name, answer_2: dbset.answer_2_name, answer_3: dbset.answer_3_name, answer_4: dbset.answer_4_name,answer_5: dbset.answer_5_name, answer_6: dbset.answer_6_name, answer_1_total: dbset.answer_1_count,answer_2_total: dbset.answer_2_count,answer_3_total: dbset.answer_3_count,answer_4_total: dbset.answer_4_count,answer_5_total: dbset.answer_5_count,answer_6_total: dbset.answer_6_count});
          }
        });
      }
    });
  });

  io.sockets.emit('usersConnected', io.engine.clientsCount);
  socket.on("close", function (message) {
    client.hgetall(message.admin_url, function(err, dbset){
      closePollTimer(dbset.admin_user_url);
    });
  });

  socket.on("poll", function (message) {
    createHashes(socket);
    createUser(count,adminUrlHash,userUrlHash);
    storePoll(userUrlHash,adminUrlHash, message.question, message.answers,socket,message.timer, message.checkbox);
    setAnswers(message.answers);
  });

  socket.on('voteCast', function (message) {
    setVotesHash(message.answer,socket, message.currentUrl);
    io.sockets.in(message.currentUrl).emit('adminVoteCount', countAdminVotes(votes,message.answers, message.currentUrl, socket.id));

    client.hgetall(message.currentUrl, function(err, dbset) {
      if(dbset.checkbox === "1"){
        io.sockets.in(message.currentUrl).emit('voteCount', countVotes(votes, message.answers,message.currentUrl, socket.id));
      }
    });
  });

  socket.on('setRooms', function(data) {
    client.hgetall(data.currentUrl, function(err, dbset){
      if(dbset.user_url === data.currentUrl ){
        socket.join(dbset.user_url);
      }else{
        socket.join(dbset.admin_user_url);
      }
    });
  })
  socket.on('disconnect', function () {
    io.sockets.emit('usersConnected', io.engine.clientsCount);
  });
});

function setAnswers(pollAnswers){
  answers = pollAnswers;
}

function setVotesHash(answer,socket, url){
  votes[url]={};
  votes[url][socket.id] = answer;
}
function closePollTimer(url) {
  client.hset(url, "status", 1, redis.print)
  io.sockets.in(url).emit('closePoll');
}

function buildVoteHash(answers, roomId, socketId) {
  voteCount[roomId] = {}
  _.forEach(answers, function(answer) {
    if(!(answer in voteCount)){
      voteCount[roomId][answer] = 0
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
  _.forEach(votes, function(vote) {
    voteCount[room][vote[socketId]]++
  })
  return voteCount[room];
}

function countAdminVotes(votes, answers, room, socketId) {
  _.forEach(votes, function(vote) {
    adminVoteCount[room][vote[socketId]]++;
  });
  storeResults(adminVoteCount[room], room);
  return adminVoteCount[room];
}

function storeResults(votes, room) {
  var voteArray = [];

  _.forEach(votes, function(total, answer) {
    voteArray.push([answer,total]);
  })
  _.forEach(voteArray, function(result,index) {
    if(!(result[0] === "undefined")){
      client.hset(room, "answer_"+(index+1)+"_name", result[0], redis.print);
      client.hset(room, "answer_"+(index+1)+"_count", result[1], redis.print)
    };
  })
}

function closePoll(userUrl) {
  client.hset(userUrl, "status", 1, redis.print);
}

function setTimer(url, timer) {
  var eventTime= moment().add('seconds', timer);
  var currentTime = moment();
  var diffTime = eventTime - currentTime;
  setTimeout(function(){
    closePollTimer(url);
  }, diffTime);
}

function createHashes(socket) {
  userUrlHash = crypto.createHash("md5").update(socket.id+Date.now()).digest("hex");
  adminUrlHash = crypto.createHash("md5").update(socket + Date.now()).digest("hex");
}

function createUser(count,adminUrlHash, userUrlHash) {
  var currentUser = new User(count,adminUrlHash, userUrlHash)
}

function storePoll(userUrlHash,adminUrlHash,question,answers,socket,timer, checkbox) {
  storeQuestion(userUrlHash, question)
  storeAnswers(userUrlHash, answers)
  storeUrls(adminUrlHash,userUrlHash, timer,socket)
  storeCheckbox(userUrlHash, checkbox)
}

function storeAnswers(userUrlHash, answers){
  _.forEach(answers, function(value, index) {
    client.hset(userUrlHash,"answer_"+(index+1), value, redis.print)
  })
}

function storeQuestion(userUrlHash, question) {
  client.hset(userUrlHash, "question", question, redis.print);
}

function storeUrls(adminUrlHash, userUrlHash, timer, socket){
  client.hset(userUrlHash,"admin_url", adminUrlHash, redis.print);
  client.hset(userUrlHash, "user_url",userUrlHash, redis.print);
  client.hset(userUrlHash, "socketId",socket.id, redis.print);
  client.hset(userUrlHash, "timer",timer, redis.print);
  client.hset(userUrlHash, "status", 0, redis.print);
  client.hset(adminUrlHash, "admin_user_url",userUrlHash, redis.print);
}

function storeCheckbox(userUrlHash, checkbox) {
  if(checkbox === true) {
    client.hset(userUrlHash, "checkbox", 1, redis.print);
  } else {
    client.hset(userUrlHash, "checkbox", 0, redis.print);
  }
}
module.exports = app;
