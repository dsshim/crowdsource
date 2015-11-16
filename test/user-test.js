const assert = require('assert');
const User = require('../user.js');

describe('User', function() {
  describe('#create', function () {
    it('should create a user with only an id', function () {
      user = new User(5)
      assert.equal(5, user.userId);
    });
    it('should create a user with all parameters', function () {
      user = new User(25, "34weifkej293","MD5 hash" )
      assert.equal(25, user.userId);
      assert.equal("34weifkej293", user.socketId);
      assert.equal("MD5 hash", user.url);
    });
  });
});
