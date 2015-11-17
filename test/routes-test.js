const assert = require('assert');
const request = require('request');
const app = require('../app/server');


describe('Server', function () {
  before(function done (){
    this.request = request.defaults({
      baseUrl: 'http://localhost:3000/'
    });
  });

  it('should exist', function () {
    assert(app);
  });

  it('should return a 200 when rendering homepage', function (done){
    this.request.get('/', function (error, response) {
      if (error) { done(error); }
      assert.equal(response.statusCode, 200);
      done();
    });
  });

  it('should return a 200 when rendering voted page', function (done){
    this.request.get('/voted', function (error, response) {
      if (error) { done(error); }
      assert.equal(response.statusCode, 200);
      done();
    });
  });

  it('should return a 200 when rendering new poll page', function (done){
    this.request.get('/new', function (error, response) {
      if (error) { done(error); }
      assert.equal(response.statusCode, 200);
      done();
    });
  });

  it('should return a 500 with no poll data when rendering poll closed page', function (done){
    this.request.get('/closed', function (error, response) {
      if (error) { done(error); }
      assert.equal(response.statusCode, 500);
      done();
    });
  });

  it('should return a 404 when going to page that does not exist', function (done){
    this.request.get('/testpage', function (error, response) {
      if (error) { done(error); }
      assert.equal(response.statusCode, 404);
      done();
    });
  });
});
