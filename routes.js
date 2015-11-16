function renderHomepage(request, response) {
  
  response.sendFile(__dirname + '/public/index.html')

}

module.exports = renderHomepage;
