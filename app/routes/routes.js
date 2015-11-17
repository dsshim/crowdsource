module.exports = (function() {
    'use strict';
    var router = require('express').Router();

    router.get('/', function(request, response) {
        response.sendFile(__dirname + '/public/index.html')
    });

    router.get('/voted', function(request, response) {
        response.render('voted')
    });

    router.get('/closed', function(request, response) {
        response.render('closed')
    });

    return router;
})();
