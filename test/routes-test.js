const assert = require('assert');
const request = require('request');
const app = require('../server');


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

  it('should return a 200 when rendering poll closed page', function (done){
    this.request.get('/closed', function (error, response) {
      if (error) { done(error); }
      assert.equal(response.statusCode, 200);
      done();
    });
  });

});

// const sinon = require('sinon');
// const chai = require('chai');
// const expect = chai.expect;
//
// const renderHomepage = require('../routes');
//
// describe("Routes", function() {
//   describe("GET Homepage", function() {
//
//       it("should respond", function() {
//         var req,res,spy;
//
//         req = res = {};
//         spy = res.send = sinon.spy();
//
//         renderHomepage(req, res);
//         expect(spy.calledOnce).to.equal(true);
//       });
//
//   });
// });
