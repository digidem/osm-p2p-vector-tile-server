var test = require('tape')
var osmdb = require('osm-p2p')
var tmpdir = require('os').tmpdir()
var path = require('path')
var http = require('http')
var hyperquest = require('hyperquest')

var dir = path.join(tmpdir, 'osm-p2p-vector-tiles-test-' + Math.random())
var osm = osmdb(dir)
var vector = require('../')(osm)

var server, href
test('setup', function (t) {
  t.plan(2)
  var docs = [
    { type: 'put', key: 'A', value: { type: 'node', lat: 64.5, lon: -147.3 } },
    { type: 'put', key: 'B', value: { type: 'node', lat: 63.9, lon: -147.6 } },
    { type: 'put', key: 'C', value: { type: 'node', lat: 64.2, lon: -147.5 } }
  ]
  osm.batch(docs, function (err, nodes) {
    t.error(err)
  })
  server = http.createServer(function (req, res) {
    if (!vector.handle(req, res)) {
      res.statusCode = 404
      res.end('not found\n')
    }
  })
  server.listen(0, function (err) {
    t.error(err)
    href = 'http://localhost:' + server.address().port + '/'
  })
})

test('tiles', function (t) {
  var hq = hyperquest.get(href + 'tiles/10/64/-147.5.pbf')
})
