var socket = io();


// socket.on("urls", function(urls) {
//   console.log(urls)
//   $('.admin-url').append("http://myURL.com/"+urls.adminUrl)
//   $('.user-url').append("http://myURL.com/"+urls.userUrl)
//
// });
var connectionCount = document.getElementById('connection-count');

socket.on('usersConnected', function (count) {
  connectionCount.innerText = 'Connected Users: ' + count;
});

socket.on('voteCount', function (votes) {
  document.getElementById("vote-results").innerText = "A:"+votes.A+" "+ "B:"+votes.B+" "+ "C:"+votes.C+" "+ "D:"+votes.D
  console.log(votes);
});

// socket.on("liveVotes", function(data) {
//   console.log(data)
//   $("#answer-1-count").append(data.votedAnswer)
// })

// socket.on("urls")

var buttons = document.querySelectorAll('#choices button');

for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', function () {
    socket.send('voteCast', this.innerText);
    console.log(this.innerText);
  });
}

// $(".vote").on("click", function(event){
//   console.log("entered vote")
//   socket.emit("votes", {
//     votedAnswer: "answer_1",
//     currentUrl: window.location.pathname.substr(6)
//   })
// });

// socket.on("currentUrl", function(data) {
//   var currentUrl = data.currentUrl
//
//   $(".vote").on("click", function(event){
//     console.log("entered vote")
//     socket.send("votes", {
//       votedAnswer: $("answer-1").text(),
//       currentUrl: currentUrl
//     })
//   });
// })

$("#submit").on("click", function(event){
  console.log("clicked")
  socket.emit("poll", {
    question: $("#question").val(),
    answer_1: $("#answer-1").val(),
    answer_2: $("#answer-2").val()
  });
});

// $(".admin-url").on("click", function(event){
//   socket.send("userData", {
//     adminUrl: event.target.text()
//   });
// })
