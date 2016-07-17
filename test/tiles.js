var test = require('tape')
var osmdb = require('osm-p2p')
var tmpdir = require('os').tmpdir()
var path = require('path')
var http = require('http')
var hyperquest = require('hyperquest')
var concat = require('concat-stream')
var fs = require('fs')
var pbuf = require('protocol-buffers')
var protofile = require.resolve('vector-tile/proto/vector_tile.proto')

var messages = pbuf(fs.readFileSync(protofile, 'utf8'))

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

test('json tiles', function (t) {
  t.plan(1)
  var hq = hyperquest.get(href + 'tiles/9/64/-147.5.json')
  hq.pipe(concat({ encoding: 'string' }, function (body) {
    var json = JSON.parse(body)
    var geom = {}
    json.features.forEach(function (f) {
      geom[f.tags.id] = f.geometry[0]
    })
    t.deepEqual(geom, {
      A: [ 744, 2159 ],
      B: [ 737, 2190 ],
      C: [ 740, 2174 ]
    })
  }))
})

test('pbf tiles', function (t) {
  t.plan(1)
  var hq = hyperquest.get(href + 'tiles/9/64/-147.5.pbf')
  hq.pipe(concat(function (body) {
    var tile = messages.tile.decode(body)
    var geom = {}
    var layer = tile.layers[0]
    layer.features.forEach(function (f) {
      var tags = {}
      for (var i = 0; i < f.tags.length; i += 2) {
        var k = f.tags[i], v = f.tags[i+1]
        tags[layer.keys[k]] = layer.values[v].string_value
      }
      geom[tags.id] = f.geometry
    })
    t.deepEqual(geom, {
      A: [ 9, 744*2, 2159*2 ],
      B: [ 9, 737*2, 2190*2 ],
      C: [ 9, 740*2, 2174*2 ]
    })
  }))
})

test('teardown', function (t) {
  server.close()
  t.end()
})
