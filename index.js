var zlib = require('zlib')
var VectorTileIndex = require('osm-p2p-vector-tile-index')
var router = require('routes')()

router.addRoute('GET /tiles/:z/:x/:y.:type(mvt)', function (req, res, vti, m) {
  var z = Number(m.params.z)
  var x = Number(m.params.x)
  var y = Number(m.params.y)

  vti.ready(function () {
    vti.getPbfTile(z, x, y, function (err, pbfTile) {
      if (err || !pbfTile) {
        res.statusCode = 404
        res.end('Missing tile')
      } else {
        res.setHeader('Content-Encoding', 'gzip')
        res.setHeader('Content-Type', 'application/x-protobuf')
        zlib.gzip(pbfTile, function (err, data) {
          if (err) {
            res.statusCode = 500
            res.end('Error compressing tile')
          } else {
            res.end(data)
          }
        })
      }
    })
  })
})

router.addRoute('GET /tiles/osm-p2p.json', function (req, res, vti) {
  vti.ready(function () {
    var tileJson = Object.assign({
      tilejson: '2.1.0',
      name: 'osm-p2p',
      tiles: [
        'http://' + req.headers.host + '/tiles/{z}/{x}/{y}.mvt'
      ]
    }, vti.meta())
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(tileJson, null, 2))
  })
})

module.exports = function (osm, opts) {
  var tileIndex = new VectorTileIndex(osm, opts)
  return {
    match: match,
    handle: handle
  }
  function handle (req, res) {
    var method = req.headers.X_HTTP_METHOD_OVERRIDE || req.method
    var m = match(method, req.url)
    if (!m) return null
    m.fn(req, res, tileIndex, m)
    return m
  }
}

function match (method, url) {
  return router.match(method.toUpperCase() + ' ' + url)
}
