/** @jsx React.DOM */
var React = require('react');
var d3 = require('d3');
var topojson = require('topojson');
var d3geotile = require('d3.geo.tile');
var renderQueue = require('../util/renderqueue.js');
var $ = require('jquery');

var overlayTypes = {
    "detectors" : { location: "data/detector_inventory.csv", color: "#083283", radius: 3 },
    "cameras" : { location: "data/camera_inventory.csv", color: "#8073E9", radius: 2 },
    "events" : { location: "data/events_training.csv", color: "#F9210C", radius: 1}
};

// Colors for map
var backgroundLayerTypes = {
  "vectiles-highroad": {
    "major_road": { color: "#999", width: 1.4 },
    "minor_road": { color: "#aaa", width: 0.8 },
    "path": { color: "#ccc", width: 0.8 },
    "highway":    { color: "#888", width: 1.8 },
    "rail": { color: "#00F", width: 3}
  },
  "vectiles-water-areas" : {color: "#C6E1FF"}
};


var Overlay = React.createClass({
    handleMouseMove:function(e){
        mouseX = parseInt(e.clientX - this.state.canvasOffset.left);
        mouseY = parseInt(e.clientY - this.state.canvasOffset.top);
        var dx = mouseX - myCircle.x;
        var dy = mouseY - myCircle.y;

        // math to test if mouse is inside circle
        if (dx * dx + dy * dy < myCircle.rr) {

            // change to hovercolor if previously outside
            if (!myCircle.isHovering) {
                myCircle.isHovering = true;
                drawCircle(myCircle);
            }

        } else {

            // change to blurcolor if previously inside
            if (myCircle.isHovering) {
                myCircle.isHovering = false;
                drawCircle(myCircle);
            }
        }
    },

    getInitialState:function(){ 
        var renderObj = renderQueue(this.draw);
        var radius2 = overlayTypes[this.props.type].radius * overlayTypes[this.props.type].radius; 
        return { data: null, radius: overlayTypes[this.props.type].radius, radius2: radius2, renderQ: renderObj, currentNodes: {}, canvasOffset: null } 
    },

    componentWillMount:function(){
        this.setState({ currentNodes: {} });
    },

    componentDidMount:function(){
        var thisObj = this,
            id = "#" + this.props.type,
            canvas = document.getElementById(this.props.type),
            ctxObj = canvas.getContext('2d');

        var canvasOffset = $(id).offset();

        $(id).mousemove(function (e) {
            thisObj.handleMouseMove(e);
        });
  
        d3.csv(overlayTypes[this.props.type].location, function(error, data){
            thisObj.setState({
                data: data,
                ctx: ctxObj,
                canvasOffset: canvasOffset
            });
        });
    },
    

    draw:function(datum){
        var longitude = +datum.longitude,
            latitude = +datum.latitude,
            translate = this.props.projection([longitude, latitude]);

        this.state.ctx.fillStyle = overlayTypes[this.props.type].color;
        this.state.ctx.beginPath();
        this.state.ctx.arc(translate[0],translate[1],this.state.radius,0,Math.PI*2,true); 
        this.state.ctx.fill();

        var x = "x"+translate[0],
            y = "y"+translate[1];

        this.state.currentNodes[x] = translate[0];
        this.state.currentNodes[y] = translate[1];
    },

    render:function(){    
        if( this.state.ctx && this.state.data ){
            this.state.renderQ.init();
            this.state.ctx.clearRect ( 0, 0, this.props.width, this.props.height );

            this.state.renderQ.add(this.state.data);
        }

        return (
            <canvas 
                width={this.props.width}
                height={this.props.height}
                className={this.props.type} 
                id={this.props.type}>      
            </canvas>
        )
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
    var thisObj = this,
        k = Math.pow(2, d[2]) * 256,
        x = (d[0] + tiles.translate[0]) * tiles.scale,
        y = (d[1] + tiles.translate[1]) * tiles.scale,
        s = tiles.scale / 256;

    this.state.path
        .projection()
        .translate([ k / 2 - d[0] * 256, k / 2 - d[1] * 256 ])
        .scale(k / 2 / Math.PI);
    this.state.ctx.save();
    this.state.ctx.translate(x, y);
    this.state.ctx.scale(s, s);

    for (key in data) {
        var style = backgroundLayerTypes[thisObj.props.type];

        if (style) {

            thisObj.state.ctx.beginPath();
            data[key].forEach(thisObj.state.path);
            thisObj.state.ctx.closePath();

            if (thisObj.props.type == "vectiles-highroad"){

                thisObj.state.ctx.strokeStyle = style[key].color;
                thisObj.state.ctx.lineWidth = style[key].width;
                thisObj.state.ctx.stroke();

            } else {

                thisObj.state.ctx.fillStyle = style.color;
                thisObj.state.ctx.fill();

            }
        }
    }

    thisObj.state.ctx.restore();
  },

  zoomed: function() {
    var thisObj = this;
    this.state.renderQ.init();
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

                } else {

                    var data = json.features.sort(function(a, b) {
                      return a.properties.sort_key - b.properties.sort_key;
                    });

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
    var canvas = document.getElementById(this.props.type),
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
          id={this.props.type}>
        </canvas>     
    )
  }
});

var Map = React.createClass({
    getInitialState:function(){
      var tile = d3geotile()
        .size([this.props.width, this.props.height]);
      
      var center = [-77.0366, 38.8977];
      // var center = [-96.65447, 33.03357]; // Dallas

      var projection = d3.geo.mercator()
        .scale((1 << 20) / 2 / Math.PI)
        .translate([-(this.props.width) / 2, -(this.props.height) / 2]);  

      var zoomBehavior = d3.behavior.zoom()
        .scale(projection.scale() * 2 * Math.PI)
        .scaleExtent([1 <<16, 1 << 26])
        .size([this.props.width, this.props.height])
        .translate(projection(center).map(function(x) { return -x; }))
        .on("zoom", this.zoomed);

      return {
        tile: tile,
        tiles: null,
        zoom: zoomBehavior,
        projection: projection,
        className: "map-wrapper"
      }
    },

    zoomed:function(){

        var tiles = this.state.tile
            .scale(this.state.zoom.scale())
            .translate(this.state.zoom.translate())
            .call();

        var projection = this.state.projection
            .translate(this.state.zoom.translate())
            .scale(this.state.zoom.scale() / 2 / Math.PI);

        this.setState({
            tiles: tiles,
            projection: projection
        })

    },

    componentWillMount:function(){
      this.zoomed();
    },

    componentDidMount:function(){
        var className = "." + this.state.className,
            wrapper = d3.select(className);
        this.state.zoom(wrapper); // Attach zoom to the map element
    },

    render:function(){
        var thisObj = this, 
            // backgroundLayerTypes = ["vectiles-highroad", "vectiles-water-areas"],
            backgroundLayers = [],
            overlays = [];

        for(layer in backgroundLayerTypes){
            backgroundLayers.push(
              <BackgroundLayer 
                width={thisObj.props.width}
                height={thisObj.props.height}
                tiles={thisObj.state.tiles}
                type={layer} >
              </BackgroundLayer>
            )
        }

        for(overlay in overlayTypes){
            overlays.push(
                <Overlay 
                    type={overlay}
                    projection={this.state.projection} 
                    width={this.props.width}
                    height={this.props.height} >
                </Overlay>
            );
        };

      return (
        <div className={this.state.className}>
            {overlays}
            {backgroundLayers}
        </div>
      )
    }
});

module.exports = Map;