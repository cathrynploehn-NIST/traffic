/** @jsx React.DOM */
var React = require('react');
var d3 = require('d3');
var topojson = require('topojson');
var d3geotile = require('d3.geo.tile');
var renderQueue = require('../util/renderqueue.js')

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

var Tile = React.createClass({
  getInitialState:function(){
    return {features: null};
  },

  componentDidMount:function(){
    var thisObj = this,
          d = this.props.data;

    this.xhr = d3.json("http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/"+thisObj.props.type+"/" + d[2] + "/" + d[0] + "/" + d[1] + ".json", function(error, json) {
      if (error) return console.error(error);
      var featuresObj = json.features.sort(function(a, b) { return a.properties.sort_key - b.properties.sort_key; });
      thisObj.setState({ 
        features: featuresObj,
      });
    }.bind(this));
  },

  componentWillUnmount: function(){
    this.xhr.abort();
  },

  render: function(){
    var paths = [],
      thisObj = this;

    if (thisObj.state.features) {
      thisObj.state.features.forEach(function(name){ 
        dVal = thisObj.props.path(name.geometry);
        var path = new Path2D(dVal);
        paths.push([path, thisObj.props.type, name.properties.kind, thisObj.props.ctx]);
      }); 
 
     thisObj.props.renderQ.add(paths);
    }
    
    return (null)
  }
});

var BackgroundLayer = React.createClass({
  getInitialState:function(){

    var renderTile = function(options){
      if(options[1] == "vectiles-highroad"){
        switch(options[2]){
          case "major_road":
            options[3].strokeStyle = "#aaa";
            break;
          case "minor_road":
            options[3].strokeStyle = "#ddd";
            break;
          case "highway":
          case "bridge":
            options[3].strokeStyle = "#999";
            break;
          case "rail":
            options[3].strokeStyle = "#7de";
            break;
          default:
            break;
        }
        options[3].stroke(options[0]);
      } else if (options[1] == "vectiles-water-areas"){
        options[3].fillStyle = "#E9FBFF";
        options[3].fill(options[0]);
      }
    };

    var renderObj = renderQueue(renderTile);
    return { ctx:null, renderQ:renderObj }
  },

  componentDidMount:function(){
    var canvas = document.getElementById(this.props.id),
      ctxObj = canvas.getContext('2d');
    this.setState({ ctx: ctxObj });
  },

  render:function(){
    var tiles = [],
        thisObj = this;

    if(this.state.ctx && this.props.tiles){
      this.state.renderQ.init();
      this.state.ctx.clearRect(0,0,this.props.width,this.props.height);

      for(key in this.props.tiles){
        if(thisObj.props.tiles[key].length > 2) {
          tiles.push(<Tile type={thisObj.props.type} ctx={thisObj.state.ctx} renderQ={thisObj.state.renderQ} path={thisObj.props.path} data={thisObj.props.tiles[key]} id={this.props.id} width={this.props.width} height={this.props.height}></Tile>);
        }
      };
    }

    return (
        <canvas 
          width={this.props.width}
          height={this.props.height}
          className={this.props.id} 
          id={this.props.id}>
            {tiles}
        </canvas>     
    )
  }
});

var Map = React.createClass({
    getInitialState:function(){
      var tilerObj = d3geotile()
        .size([this.props.width, this.props.height]);
      
      var zoomBehavior = d3.behavior.zoom()
        .scale((1 << 18))
        .scaleExtent([1 << 10, 1 << 30])
        .translate([this.props.width / 2, this.props.height / 2])
        .on("zoom", this.zoomed);

      var projection = d3.geo.mercator()
        .scale(zoomBehavior.scale())
        .translate(zoomBehavior.translate())
        .center([-77.0365298, 38.8976763]);

      var tileProjection = d3.geo.mercator();
      

      var calcPath = d3.geo.path()
        .projection(projection);


      return {
        projection: projection,
        path: calcPath,
        tiler: tilerObj,
        tiles: null,
        zoom: zoomBehavior,
        className: "map-wrapper"
      }
    },

    zoomed:function(){
      var zoom = this.state.zoom;
      
      var proj = this.state.projection;
      proj
        .scale(zoom.scale() / 2 / Math.PI)
        .translate(zoom.translate());
      
      var tilerObj = this.state.tiler;
      var tilesArray= tilerObj
        .scale(zoom.scale())
        .translate(proj([0,0]))
        ();

      this.setState({
        tiles: tilesArray,
        tiler: tilerObj,
        projection: proj
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
            id="roadTiles"
            type="vectiles-highroad"
          >
          </BackgroundLayer>
          <BackgroundLayer 
            width={this.props.width}
            height={this.props.height}
            tiles={this.state.tiles}
            path={this.state.path}
            id="waterTiles"
            type="vectiles-water-areas"
          >
          </BackgroundLayer>
        </div>
      )
    }
});

module.exports = Map;