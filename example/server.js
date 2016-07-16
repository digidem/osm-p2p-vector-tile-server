var http = require('http')
var osmdb = require('osm-p2p')

var osm = osmdb('/tmp/osm.db')
var osmserver = require('osm-p2p-server')(osm)
var vector = require('../')(osm)

var server = http.createServer(function (req, res) {
  if (osmserver.handle(req, res)) {}
  else if (vector.handle(req, res)) {}
  else {
    res.statusCode = 404
    res.end('not found\n')
  }
})
server.listen(5000)
