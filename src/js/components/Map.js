/** @jsx React.DOM */
var React = require('react');
var d3 = require('d3');
var topojson = require('topojson');
var d3geotile = require('d3.geo.tile');
var renderQueue = require('../util/renderqueue.js')

var roadStyles = {
    "major_road": { color: "#555", width: 1.4 },
    "minor_road": { color: "#aaa", width: 0.8 },
    "highway":    { color: "#222", width: 1.8 }
  };

var Overlay = React.createClass({
  getInitialState:function(){
    return {
      data: null,
      radius: 2
    }
  },

  componentDidMount:function(){
    var thisObj = this,
      canvas = document.getElementById(this.props.id),
      ctxObj = canvas.getContext('2d');

    d3.csv(this.props.dataLocation, function(error, lane_detectors){
      thisObj.setState({
        data: lane_detectors,
        ctx: ctxObj
      });
    });
  },

  render:function(){
    var circles = [],
      thisObj = this;

    if(this.state.ctx){
      thisObj.state.ctx.clearRect(0,0,thisObj.props.width, thisObj.props.height);

      for(key in this.state.data){
        var longitude = +this.state.data[key].longitude;
        var latitude = +this.state.data[key].latitude;
        var transf = "translate(" + thisObj.props.projection([longitude, latitude]) + ")";
        var translate = thisObj.props.projection([longitude, latitude]);

        this.state.ctx.beginPath();
        this.state.ctx.arc(translate[0],translate[1],thisObj.state.radius,0,Math.PI*2,true); 
        this.state.ctx.fill();
      }
    }

    return (null)
  }
});

var BackgroundLayer = React.createClass({
  groupByKind:function(data){
    return data.reduce(function(memo, d) {
      var kind = d.properties.kind;
      if (memo[kind]) { memo[kind].push(d); }
      else            { memo[kind] = [ d ]; }
      return memo;
    }, {});
  },

  drawTile:function(tiles, d, data){
    var thisObj = this;
    console.log(tiles);
    console.log(d);
    console.log(data);
    var k = Math.pow(2, d[2]) * 256;
    var x = (d[0] + tiles.translate[0]) * tiles.scale;
    var y = (d[1] + tiles.translate[1]) * tiles.scale;
    var s = tiles.scale / 256;

    this.state.path
      .projection()
      .translate([ k / 2 - d[0] * 256, k / 2 - d[1] * 256 ])
      .scale(k / 2 / Math.PI);
    this.state.ctx.save();
    this.state.ctx.translate(x, y);
    this.state.ctx.scale(s, s);

    for (key in data) {
      var style = roadStyles[key];
      
      if (style) {

        thisObj.state.ctx.beginPath();
        data[key].forEach(thisObj.state.path);
        thisObj.state.ctx.closePath();
        thisObj.state.ctx.strokeStyle = style.color;
        thisObj.state.ctx.lineWidth = style.width;
        thisObj.state.ctx.stroke();

      }
    }

    thisObj.state.ctx.restore();

  },

  zoomed: function() {
    var thisObj = this;
    // this.state.renderQ.init();
    this.state.ctx.clearRect(0,0,this.props.width,this.props.height);

    this.props.tiles.forEach(function(d){
      // create url
      var letters = [ "a", "b", "c" ];
      var letter = letters[(d[0] * 31 + d[1]) % 3];
      var url = "http://" + letter + ".tile.openstreetmap.us/" + thisObj.props.type + "/" + d[2] + "/" + d[0] + "/" + d[1] + ".json";

      // check cached
      if (thisObj.state.cachedTiles[url] && thisObj.state.cachedTiles[url].caching === false && thisObj.state.cachedTiles[url].drawing === false) {

        thisObj.drawTile(thisObj.props.tiles, d, thisObj.state.cachedTiles[url].data);

      } else if (!thisObj.state.cachedTiles[url]) {

        thisObj.state.cachedTiles[url] = { caching: true, drawing: false, data: [] };

        d3.json(url, function(error, json) {
          if (error) {
            console.error("caching tiles error", error, url, json);
            delete cachedTiles[url];

          }
          else {

            var data = json.features.sort(function(a, b) {
              return a.properties.sort_key - b.properties.sort_key;
            });
            console.log(data)
            thisObj.state.cachedTiles[url] = { caching: false, drawing: true, data: thisObj.groupByKind(data) };

            thisObj.drawTile(thisObj.props.tiles, d, thisObj.state.cachedTiles[url].data);

            thisObj.state.cachedTiles[url].drawing = false;

          }
        });
      }
    });
  },
  
  getInitialState:function(){
    var renderObj = renderQueue(this.drawTile);
    return { ctx:null, renderQ:renderObj, cachedTiles: {}, path: null }
  },

  componentDidMount:function(){
    var canvas = document.getElementById(this.props.id),
      ctxObj = canvas.getContext('2d');
    var tilePath = d3.geo.path()
    .projection(d3.geo.mercator())
    .context(ctxObj);
    this.setState({ ctx: ctxObj, path: tilePath });
  },

  render:function(){
    if(this.state.ctx && this.props.tiles){
      this.zoomed();
    }

    return (
        <canvas 
          width={this.props.width}
          height={this.props.height}
          className={this.props.id}
          id={this.props.id}>
        </canvas>     
    )
  }
});

var Map = React.createClass({
    getInitialState:function(){
      var thisObj = this;
      var tile = d3geotile()
        .size([this.props.width, this.props.height]);
      
      // var center = [-74.1, 39.94];
      var center = [-77.0365298, 38.8976763];

      var projection = d3.geo.mercator()
        .scale((1 << 22) / 2 / Math.PI)
        .translate([-(this.props.width) / 2, -(this.props.height) / 2]);  

      var zoomBehavior = d3.behavior.zoom()
        .scale(projection.scale() * 2 * Math.PI)
        .scaleExtent([1 << 18, 1 << 26])
        .size([this.props.width, this.props.height])
        .translate(projection(center).map(function(x) { return -x; }))
        .on("zoom", thisObj.zoomed);

      var tilePath = d3.geo.path()
        .projection(d3.geo.mercator());

      return {
        projection: projection,
        path: tilePath,
        tile: tile,
        tiles: null,
        zoom: zoomBehavior,
        className: "map-wrapper"
      }
    },

    zoomed:function(){

      var tilesArray= this.state.tile
        .scale(this.state.zoom.scale())
        .translate(this.state.zoom.translate())
        .call();

      this.setState({
        tiles: tilesArray,
      })

    },

    componentWillMount:function(){
      this.zoomed();
    },

    componentDidMount:function(){
      var className = "." + this.state.className,
        wrapper = d3.select(className);
      this.state.zoom(wrapper);
    },

    render:function(){
      var thisObj = this;

      return (
        <div className={this.state.className}>
          <canvas 
            width={this.props.width}
            height={this.props.height}
            className="detectors" 
            id="detectors">
              <Overlay 
                id="detectors"
                className="detectors"
                projection={this.state.projection} 
                dataLocation="data/detector_inventory.csv"
                width={this.props.width}
                height={this.props.height} >
              </Overlay>
          </canvas>
          <BackgroundLayer 
            width={this.props.width}
            height={this.props.height}
            tiles={this.state.tiles}
            path={this.state.path}
            zoom={this.state.zoom}
            id="roadTiles"
            type="vectiles-highroad"
          >
          </BackgroundLayer>
          <BackgroundLayer 
            width={this.props.width}
            height={this.props.height}
            tiles={this.state.tiles}
            path={this.state.path}
            zoom={this.state.zoom}
            id="waterTiles"
            type="vectiles-water-areas"
          >
          </BackgroundLayer>
        </div>
      )
    }
});

module.exports = Map;