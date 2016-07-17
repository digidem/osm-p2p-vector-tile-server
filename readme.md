# osm-p2p-vector-tile-server

serve vector tiles for an [osm-p2p][1] database

# example

Here is an example that sets up an OSM http API and vector tile API over the
same http server:

``` js
var http = require('http')
var osmdb = require('osm-p2p')

var osm = osmdb('/tmp/osm.db')
var osmserver = require('osm-p2p-server')(osm)
var vector = require('osm-p2p-vector-tile-server')(osm)

var server = http.createServer(function (req, res) {
  if (osmserver.handle(req, res)) {}
  else if (vector.handle(req, res)) {}
  else {
    res.statusCode = 404
    res.end('not found\n')
  }
})
server.listen(5000)
```

# api

``` js
var vectorTiles = require('osm-p2p-vector-tile-server')
```

## var vector = vectorTiles(osm)

Create a vector tile server handler `vector` from an [osm-p2p][1] handle `osm`.

## var m = vector.match(method, url)

Return a match object if `method` and `url` comprise a valid tile server
request.

## var m = vector.handle(req, res)

Respond to incoming requests for tile geometry.

Returns a match object or `null` if the request was not a a recognized tile
server request.

# install

```
npm install osm-p2p-vector-tiles
```

# license

MIT
