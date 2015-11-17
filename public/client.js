var socket = io();
var count = 3

window.onload = function () {
  if(window.location.pathname.length > 10){
    socket.emit("setRooms", {currentUrl: window.location.pathname.substr(6)})
  }
}

var connectionCount = document.getElementById('connection-count');

socket.on('usersConnected', function (count) {
  connectionCount.innerText = 'Connected Users: ' + count;
  socket.emit('newUser', count)
});

socket.on('closePoll', function(){
  $("#choices a").addClass('hidden');

  document.getElementById('poll-closed').innerText = "This Poll is Closed!"
  socket.emit("pollClosed", "closed")
})

socket.on('voteCount', function (data) {
  var votes = []
  for (var key in data) {
    if(!(key === "undefined" || key ==="")){
      votes.push(key+": "+data[key]+" ")
    }
  }

  var userVoteString = "<ul><li>"
  for (var i = 0; i < votes.length; i++) {
    userVoteString = userVoteString +votes[i]+"</li><li>"
  }
  document.getElementById("vote-results").innerHTML =  userVoteString
  socket.emit("countedVotes", votes)
});

socket.on('adminVoteCount', function (data) {
  var votes = []
  for (var key in data) {
    if(!(key === "undefined")){
      votes.push(key+" : "+data[key]+" ")
    }
  }

  var voteString = "<ul><li>"
  for (var i = 0; i < votes.length; i++) {
    voteString = voteString +votes[i]+"</li><li>"
  }
  document.getElementById("admin-results").innerHTML =  voteString
  socket.emit("countedAdminVotes", votes)
});

function closePoll() {
  socket.emit("timerEnded", {currentUrl: currentUrl})
}

var buttons = document.querySelectorAll('#choices a');

for (var i = 0; i < buttons.length; i++) {

  buttons[i].addEventListener('click', function () {

    answers = getAnswers();
    var currentUrl = window.location.pathname.substr(6)
    socket.emit('voteCast', {answer: this.innerText, currentUrl: currentUrl, answers: answers, socketId: socket.id});
    $("#choices a").addClass('hidden');
    $("#thanks-voted").append("Thanks for Voting!")
    console.log(this.innerText);
  });
}

function getAnswers() {
  var answers = [$("#a").text(),$("#b").text(),$("#c").text(),$("#d").text(),$("#e").text(),$("#f").text()];
  return answers
}

$("#submit").on("click", function(event){
  console.log("clicked")
  var answers = []
  $.each($( ".poll" ).find( ".answers" ), function(index, value) {
    answers.push(value["value"])
  })
  var checkbox = $('.voteCheckbox:checked').length > 0;
  socket.emit("poll", {
    question: $("#question").val(),
    timer: $("#timer").val(),
    answers: answers,
    checkbox: checkbox
  });
});

$("#close").on("click", function(event) {
  document.getElementById('poll-closed').innerText = "This Poll is Closed!"
  socket.emit("close", {admin_url: window.location.pathname.substr(6)})
})

$("#add-response").on("click", function(event) {
  if(count<7){
  $(".poll ul").append('<li>Add Response&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input class = "answers" id ="answer-'+count+'" placeholder="Answer '+count+'" ></li>');
}
  count++
})
