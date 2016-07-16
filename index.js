var togeojson = require('osmtogeojson')
var osmdb = require('osm-p2p')
var geojsonvt = require('geojson-vt')
var router = require('routes')()

router.addRoute('GET /tiles/:z/:x/:y.pbf', function (req, res, osm, m) {
  var xspan = 360 / Math.pow(2,Number(m.params.z))
  var yspan = xspan * Math.cos(m.params.y / 180 * Math.PI)
  var q = [
    [m.params.y-yspan,m.params.y+yspan],
    [m.params.x-xspan,m.params.x+xspan]
  ]
  osm.query(q, function (err, elems) {
    var geo = togeojson(wrap(elems))
    var tileIndex = geojsonvt(geo)
    console.log(tileIndex.getTile(1, 0, 0))
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
