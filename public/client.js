var socket = io();
var count = 3

// socket.on("urls", function(urls) {
//   console.log(urls)
//   $('.admin-url').append("http://myURL.com/"+urls.adminUrl)
//   $('.user-url').append("http://myURL.com/"+urls.userUrl)
//
// });


window.onload = function () {
  if(window.location.pathname.length > 5){
    socket.emit("setRooms", {currentUrl: window.location.pathname.substr(6)})
  }
}


var connectionCount = document.getElementById('connection-count');

socket.on('usersConnected', function (count) {
  connectionCount.innerText = 'Connected Users: ' + count;
});

socket.on('voteCount', function (data) {
  // document.getElementById("vote-results").innerText =
  var votes = []
  for (var key in data) {
    // if (Object.prototype.hasOwnProperty.call(data, key)) {
      if(!(key === "undefined" || key ==="")){
      votes.push(key+": "+data[key]+" ")
      // var val = obj[key];
      // use val
    }
  // }
  }

    // var temp = [];
    //
    // for(let i of votes)
    // i && temp.push(i);
    //
    // votes = temp;
    // delete temp;


  var userVoteString = "<ul><li>"
  for (var i = 0; i < votes.length; i++) {
    userVoteString = userVoteString +votes[i]+"</li><li>"
  }

document.getElementById("vote-results").innerHTML =  userVoteString

  // document.getElementById("vote-results").innerHTML = ("<ul><li>"+votes[0]+"</li><li>"+votes[1]+"</li><li>"+votes[2]+"</li><li>"+votes[3]+"</li></ul>")

});


socket.on('adminVoteCount', function (data) {
  // document.getElementById("vote-results").innerText =
  var votes = []
  for (var key in data) {
    if(!(key === "undefined")){
      votes.push(key+" : "+data[key]+" ")
      // var val = obj[key];
      // use val
    }
  }

  var voteString = "<ul><li>"
  for (var i = 0; i < votes.length; i++) {
    voteString = voteString +votes[i]+"</li><li>"
  }
document.getElementById("admin-results").innerHTML =  voteString
  // document.getElementById("admin-results").innerHTML =  ("<ul><li>"+votes[0]+"</li><li>"+votes[1]+"</li><li>"+votes[2]+"</li><li>"+votes[3]+"</li></ul>")

});

function closePoll() {
  socket.emit("timerEnded", {currentUrl: currentUrl})
}


// socket.on("liveVotes", function(data) {
//   console.log(data)
//   $("#answer-1-count").append(data.votedAnswer)
// })

// socket.on("urls")

var buttons = document.querySelectorAll('#choices button');

for (var i = 0; i < buttons.length; i++) {

  buttons[i].addEventListener('click', function () {
    answers = getAnswers();
    var currentUrl = window.location.pathname.substr(6)
    socket.emit('voteCast', {answer: this.innerText, currentUrl: currentUrl, answers: answers, socketId: socket.id});
    console.log(this.innerText);
  });
}

function getAnswers() {
  var answers = [$("#a").text(),$("#b").text(),$("#c").text(),$("#d").text(),$("#e").text(),$("#f").text()];
  return answers
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
  var answers = []
  $.each($( ".poll" ).find( ".answers" ), function(index, value) {
    answers.push(value["value"])
  })
  socket.emit("poll", {
    question: $("#question").val(),
    timer: $("#timer").val(),
    // $.each($( ".poll" ).find( ".answers" ), function(index, value) {
    //   return value["id"]+": "+value["value"],
    // });
    // answer_1: $("#answer-1").val(),
    // answer_2: $("#answer-2").val(),
    // answer_3: $("#answer-3").val(),
    // answer_4: $("#answer-4").val(),
    answers: answers,
  });
});

$("#close").on("click", function(event) {
  socket.emit("close", {admin_url: window.location.pathname.substr(6)})
})

$("#add-response").on("click", function(event) {
  $(".poll ul").append('<li>Add Response&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input class = "answers" id ="answer-'+count+'" value="Answer '+count+'" ></li>');
  count++
})
// $(".admin-url").on("click", function(event){
//   socket.send("userData", {
//     adminUrl: event.target.text()
//   });
// })
