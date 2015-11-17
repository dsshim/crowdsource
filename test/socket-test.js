var should = require('should');
var io = require('socket.io-client');


var socketURL = 'http://localhost:3000';

var options ={
  transports: ['websocket'],
  'force new connection': true
};

describe("Poll Server",function(){
  it('Should broadcast the count to all users', function(done){
    var client1 = io.connect(socketURL, options);
    var completeTest = function(){
      client1.disconnect();
      done();
    };



    client1.on('connect', function(data){
      client1.emit('usersConnected', 1);

      client1.on('newUser', function(count){
        count.should.equal(1);

      })
      setTimeout(completeTest, 40);
    });
  });

  it('Should respond with closed when requested', function(done){
    var client1 = io.connect(socketURL, options);

    var completeTest = function(){
      client1.disconnect();
      done();
    };

    client1.on('connect', function(data){
      client1.emit('closePoll');

      client1.on('pollClosed', function(text){
        text.should.equal("closed");
      })
    })
    setTimeout(completeTest, 40);
  })

  it('Should count votes', function(done){
    var client1 = io.connect(socketURL, options);
    var completeTest = function(){
      client1.disconnect();
      done();
    };

    client1.on('connect', function(data){
      client1.emit('countVotes', {answer: 5});

      client1.on('countedVotes', function(vote){
        vote.should.equal("answer: 5");
      })
    })
    setTimeout(completeTest, 40);
  })

  it('Should count admin votes', function(done){
    var client1 = io.connect(socketURL, options);
    var completeTest = function(){
      client1.disconnect();
      done();
    };

    client1.on('connect', function(data){
      client1.emit('countAdminVotes', {answer: 12, answer2: 10});

      client1.on('countedAdminVotes', function(vote){
        vote.should.equal("answer: 12, answer2: 10");
      })
    })
    setTimeout(completeTest, 40);
  })

});
