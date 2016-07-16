var togeojson = require('osmtogeojson')
var osmdb = require('osm-p2p')
var geojsonvt = require('geojson-vt')
var vtpbf = require('vt-pbf')
var router = require('routes')()

router.addRoute('GET /tiles/:z/:x/:y.:type', function (req, res, osm, m) {
  var x = Number(m.params.x), y = Number(m.params.y)
  var xspan = 360 / Math.pow(2,Number(m.params.z))
  var yspan = xspan * Math.abs(Math.cos(y / 180 * Math.PI))
  var q = [ [x-xspan,x+xspan], [y-yspan,y+yspan] ]
  if (!/^(json|pbf)$/.test(m.params.type)) {
    res.statusCode = 404
    return res.end('unrecognized type\n')
  }
  osm.query(q, function (err, elems) {
    var geo = togeojson(wrap(elems))
    var tileIndex = geojsonvt(geo)
    var tile = tileIndex.getTile(1, 0, 0)
    if (m.params.type === 'json') {
      res.setHeader('content-type', 'text/geojson')
      res.end(JSON.stringify({
        type: 'FeatureCollection',
        features: tile.features
      }))
    } else if (m.params.type === 'pbf') {
      res.setHeader('content-type', 'application/x-protobuf')
      res.end(vtpbf.fromGeojsonVt({ 'geojsonLayer': tile }))
    }
  })
})

module.exports = function (osm) {
  return {
    match: match,
    handle: handle
  }
  function handle (req, res) {
    var method = req.headers.X_HTTP_METHOD_OVERRIDE || req.method
    var m = match(method, req.url)
    if (!m) return null
    m.fn(req, res, osm, m)
    return m
  }
}

function match (method, url) {
  return router.match(method.toUpperCase() + ' ' + url)
}

function csplit (x) { return x.split(',').map(Number) }
function wrap (elems) {
  return {
    version: 0.6,
    generator: 'osm-p2p',
    elements: elems.map(function (elem) {
      if (elem.type === 'way' && elem.refs) {
        elem.nodes = elem.refs
        delete elem.refs
      }
      return elem
    })
  }
}
