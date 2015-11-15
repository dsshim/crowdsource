const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis")
  var client = redis.createClient(rtg.port, rtg.hostname);

  client.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require('redis');
  var client = redis.createClient(); //creates a new client
}

const bodyParser = require('body-parser');
const User = require('./user.js')
var crypto = require('crypto');
var PORT = process.env.PORT || 3000;
const _ = require('lodash')
const server = http.listen(PORT, function() {
  console.log("Server is up and running on port: " + PORT)
});
var questions;

var count = 0;
var votes = {}
var userUrlHash;
var adminUrlHash;
var currentUser;
var voteCount = {};
var adminVoteCount = {}

// var sessionSocket;

// app.configure(function(){
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
// });




app.get('/', function(request, response) {
  response.sendFile(__dirname + '/public/index.html')
});

// app.get('/new', function(request, response) {
//   // var adminUrl = client.hget(''+User.socketId, "admin-url", function(err, object) {
//   //   debugger;
//   //     console.dir(object);
//   // });
//   response.render('new')
//   // response.render('new' , {userUrl: request.params.id, adminUrl: client.hget(request.params.id).admin_url})
// });

app.get('/voted', function(request, response){
  response.render('voted')
})

// app.get("/poll/:id", function(request, response) {
//   // var userPage = io.of('/poll/'+request.params.id)
//   // userPage.on('connection', function(socket) {
//   //   console.log("voter connected")
//   // })
//   client.hgetall(request.params.id, function(err, dbset){
//
//     if(dbset.user_url === request.params.id) {
//
//       response.render('user', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2, answer_3: dbset.answer_3, answer_4: dbset.answer_4})
//     } else {
//       client.hgetall(dbset.admin_user_url, function(err, dbset){
//
//
//         response.render('admin', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2})
//       });
//     }
//   })
//   joinRoom(request.params.id)
// })
app.get('/new', function(request, response) {
  // var adminUrl = client.hget(''+User.socketId, "admin-url", function(err, object) {
  //   debugger;
  //     console.dir(object);
  // });
  // response.render('new')


  response.render('new' , {userUrl: userUrlHash, adminUrl: adminUrlHash})
});


// var homePage = io.of('/')
// homePage.on('connection', function(socket) {
//   console.log("voter connected")
// })

io.on('connection', function(socket) {

  app.get("/poll/:id", function(request, response) {
    // var userPage = io.of('/poll/'+request.params.id)
    // userPage.on('connection', function(socket) {
    //   console.log("voter connected")
    // })

    client.hgetall(request.params.id, function(err, dbset){

      if(dbset.user_url === request.params.id) {


        response.render('user', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2, answer_3: dbset.answer_3, answer_4: dbset.answer_4})
        // socket.join(dbset.user_url);
        // console.log(io.sockets.adapter.rooms)

      } else {

        client.hgetall(dbset.admin_user_url, function(err, dbset){
          answers = []
          answers.push(dbset.answer_1)
          answers.push(dbset.answer_2)
          answers.push(dbset.answer_3)
          answers.push(dbset.answer_4)
          buildAdminVoteHash(answers,dbset.user_url)
          response.render('admin', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2})
          // socket.join(dbset.user_url);
          // console.log(io.sockets.adapter.rooms)
        });

      }
    })


  })

  // function joinRoom(id){
  //   socket.join(id)
  //   console.log("join voting room")
  // }
  // sessionSocket = socket
  //add currentDate to adminUrl

  // var userUrlHash = crypto.createHash("md5").update(socket.id+Date.now()).digest("hex");
  // var adminUrlHash = crypto.createHash("md5").update(socket + Date.now()).digest("hex")
  // currentUser = new User(count,adminUrlHash, userUrlHash)
  console.log('User has connected.'+socket.id, io.engine.clientsCount);
  io.sockets.emit('usersConnected', io.engine.clientsCount);

  // app.get("/poll/:id", function(request, response) {
  //   client.hgetall(request.params.id, function(err, dbset){
  //
  //     if(dbset.user_url === request.params.id) {
  //
  //       response.render('user', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2})
  //     } else {
  //       client.hgetall(dbset.admin_user_url, function(err, dbset){
  //
  //
  //         response.render('admin', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2})
  //       });
  //     }
  //   })
  // })

  // app.get("/poll/:id", function(request, response) {
  //   // var currentUrl = request.originalUrl
  //
  //   client.hgetall(request.params.id, function(err, dbset){
  //     // console.log(dbset)
  //     // return dbset.question
  //     socket.emit("currentUrl", {currentUrl: request.originalUrl})
  //     response.render('user', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2})
  //   });
  //
  // })

  socket.on("poll", function (message) {


    userUrlHash = crypto.createHash("md5").update(socket.id+Date.now()).digest("hex");
    adminUrlHash = crypto.createHash("md5").update(socket + Date.now()).digest("hex")
    currentUser = new User(count,adminUrlHash, userUrlHash)
    client.hset(userUrlHash, "question", message.question, redis.print);
    client.hset(userUrlHash, "answer_1",message.answer_1, redis.print);
    client.hset(userUrlHash, "answer_2",message.answer_2, redis.print);
    client.hset(userUrlHash, "answer_3",message.answer_3, redis.print);
    client.hset(userUrlHash, "answer_4",message.answer_4, redis.print);
    client.hset(userUrlHash,"answer_1_count", 0, redis.print);
    client.hset(userUrlHash,"answer_2_count", 0, redis.print);
    client.hset(userUrlHash,"answer_3_count", 0, redis.print);
    client.hset(userUrlHash,"answer_4_count", 0, redis.print);
    client.hset(userUrlHash,"admin_url", adminUrlHash, redis.print);
    client.hset(userUrlHash, "user_url",userUrlHash, redis.print);
    client.hset(userUrlHash, "socketId",socket.id, redis.print);
    client.hset(adminUrlHash, "admin_user_url",userUrlHash, redis.print);
    createRoomVote()
    // socket.emit("urls", {adminUrl: adminUrlHash, userUrl: userUrlHash})

    // var answers = []
    // answers.push(message.answer_1)
    // answers.push(message.answer_2)
    // answers.push(message.answer_3)
    // answers.push(message.answer_4)
    // buildVoteHash(answers,userUrlHash, socket.id)
    // console.log(userUrlHash)
    // console.log(adminUrlHash)
    //
    //


  });

  socket.on('voteCast', function (message) {

    // if (channel === 'voteCast') {
    votes[message.currentUrl]={}


      votes[message.currentUrl][socket.id] = message.answer;


      io.sockets.in(message.currentUrl).emit('voteCount', countVotes(votes,message.answers, message.currentUrl, socket.id));
      io.sockets.in(message.currentUrl).emit('adminVoteCount', countAdminVotes(votes,message.answers, message.currentUrl, socket.id));
      console.log(votes);
    // }
  });

  socket.on('setRooms', function(data) {

    client.hgetall(data.currentUrl, function(err, dbset){
      if(dbset.user_url === data.currentUrl ){
      socket.join(dbset.user_url);
      console.log(io.sockets.adapter.rooms)
    }else{
      socket.join(dbset.admin_user_url);
      console.log(io.sockets.adapter.rooms)
      // console.log(io.sockets.adapter.rooms)
    }
    });
  })

  // socket.on("votes", function(message){
  //   // console.log("received votes")
  //   // var answer1count = client.hgetall(message.currentUrl, function(err, dbset){
  //   //   // console.log(dbset)
  //   //   // return dbset.question
  //   //   // response.render('user', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2})
  //   //   return dbset.answer_1_count
  //   // });
  //   client.hgetall(message.currentUrl, function(err, dbset){
  //     // console.log(dbset)
  //     // return dbset.question
  //     // response.render('user', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2})
  //     // return dbset.answer_1_count+1
  //     client.hset(message.currentUrl, message.votedAnswer+"_count", parseInt(dbset.answer_1_count)+1, redis.print);
  //   })
  //
  //
  //
  //   client.hgetall(message.currentUrl, function(err, dbset){
  //     // console.log(dbset)
  //     // return dbset.question
  //     // response.render('user', {question: dbset.question, answer_1: dbset.answer_1, answer_2: dbset.answer_2})
  //     // return dbset.answer_1_count
  //     io.sockets.emit("liveVotes", {
  //       votedAnswer: dbset.answer_1_count
  //     })
  //
  //
  //   });
  // });

  socket.on('disconnect', function () {
    console.log('A user has disconnected.', io.engine.clientsCount);
    // delete votes[socket.id];
    // console.log(votes);
    // socket.emit('voteCount', countVotes(votes));
    io.sockets.emit('usersConnected', io.engine.clientsCount);
  });

});


function buildVoteHash(answers, roomId, socketId) {
  // voteCount[roomId] = {}
  // voteCount[roomId][socketId]={}
  voteCount[roomId] = {}
  voteCount[roomId][socketId]={}

  _.forEach(answers, function(answer) {

    if(!(answer in voteCount)){

      voteCount[roomId][socketId][answer] = 0

    }
  })

}

function buildAdminVoteHash(answers, roomId) {
  // voteCount[roomId] = {}
  // voteCount[roomId][socketId]={}
  adminVoteCount[roomId] = {}
  // voteCount[roomId][socketId]={}

  _.forEach(answers, function(answer) {

    if(!(answer in voteCount)){

      adminVoteCount[roomId][answer] = 0

    }
  })

}

function countVotes(votes, answers, room, socketId) {

  buildVoteHash(answers,room, socketId)




_.forEach(votes, function(vote) {







  // if(room in votes){

  // voteCount[vote[socketId]]++

  voteCount[room][socketId][vote[socketId]]++




  // client.hset(room, "votes"+socketId, vote[socketId], redis.print);

// }
})

// var totalVotes = [];
// socketKey ="votes"+socketId
// client.hgetall(room, function(err, dbset){
//
//   pry = require('pryjs')
//   eval(pry.it)
//
//   totalVotes.push(dbset.socketKey)
//   // for (vote in votes) {
//   //   voteCount[votes[vote]]++
//   // }
// })

  return voteCount[room][socketId];

}

function countAdminVotes(votes, answers, room, socketId) {
  _.forEach(votes, function(vote) {


  adminVoteCount[room][vote[socketId]]++

  })

    return adminVoteCount[room];


}
module.exports = server;
// function sendUrl() {
//   socket.emit("currentUrl", {currentUrl: request.originalUrl})
// }

// function emitUrls() {
//   console.log("emitted urls")
//   // var adminUrl = client.hget(''+sessionSocket.id, "admin-url", function(err, object) {
//   //     console.dir(object);
//   // });
//   // sessionSocket.emit("urls", {adminUrl: currentUser.socketId, userUrl: currentUser.url})
// };



// app.listen(process.env.PORT || 3000, function(){
//   console.log('Your server is up and running on Port 3000. Good job!');
// });
