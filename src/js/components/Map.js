/** @jsx React.DOM */
var React = require('react');
var d3 = require('d3');
var topojson = require('topojson');
var d3geotile = require('d3.geo.tile');

var Detector = React.createClass({
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

    d3.csv("data/detector_inventory.csv", function(error, lane_detectors){
      thisObj.setState({
        data: lane_detectors,
        ctx: ctxObj
      });
    });
  },

  render:function(){
    var circles = [],
      thisObj = this;

    for(key in this.state.data){
      var longitude = +this.state.data[key].longitude;
      var latitude = +this.state.data[key].latitude;
      var transf = "translate(" + thisObj.props.projection([longitude, latitude]) + ")";
      var translate = thisObj.props.projection([longitude, latitude]);
      // circles.push(<circle r={thisObj.state.radius} transform={transf}></circle>);
      this.state.ctx.beginPath();
      this.state.ctx.arc(translate[0],translate[1],thisObj.state.radius,0,Math.PI*2,true); 
      this.state.ctx.fill();
    }

    return (
      <g></g>
    )
  }
});

var Tile = React.createClass({
  getInitialState:function(){
    return {features: null};
  },

  componentDidMount:function(){
    var thisObj = this,
        d = this.props.data,
        canvas = document.getElementById(this.props.id),
        ctxObj = canvas.getContext('2d');

    d3.json("http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/"+thisObj.props.type+"/" + d[2] + "/" + d[0] + "/" + d[1] + ".json", function(error, json) {
      if (error) return console.error(error);
      var featuresObj = json.features.sort(function(a, b) { return a.properties.sort_key - b.properties.sort_key; });
      thisObj.setState({ 
        features: featuresObj,
        ctx: ctxObj 
      });
    });
  },

  render: function(){
    var paths = [],
      thisObj = this;

    if (thisObj.state.features) {
      thisObj.state.features.forEach(function(name){ 
        dVal = thisObj.props.path(name.geometry);
        var path = new Path2D(dVal);
        if(thisObj.props.type == "vectiles-highroad"){
          switch(name.properties.kind){
            case "major_road":
              thisObj.state.ctx.strokeStyle = "#aaa";
              break;
            case "minor_road":
              thisObj.state.ctx.strokeStyle = "#ddd";
              break;
            case "highway":
            case "bridge":
              thisObj.state.ctx.strokeStyle = "#999";
              break;
            case "rail":
              thisObj.state.ctx.strokeStyle = "#7de";
              break;
            default:
              break;
          }
          thisObj.state.ctx.stroke(path);
        } else if (thisObj.props.type == "vectiles-water-areas"){
          thisObj.state.ctx.fillStyle = "#E9FBFF";
          thisObj.state.ctx.fill(path);
        }
      }); 
    }

    return (<g></g>)
  }
});

var Map = React.createClass({
    getInitialState:function(){

      var projection = d3.geo.mercator()
        .center([-77.0365298, 38.8976763])
        .scale((1 << 18) / 2 / Math.PI)
        .translate([this.props.width / 2, this.props.height / 2]);

      var calcPath = d3.geo.path()
        .projection(projection);

      var tiler = d3geotile()
        .size([this.props.width, this.props.height])
        .scale(projection.scale() * 2 * Math.PI)
        .translate(projection([0, 0]));

      // Array of information for tiles
      var tilesArray = tiler(0);
        
      return {
        path: calcPath,
        projection: projection,
        tiles: tilesArray,
      }
    },

    render:function(){
      var roadTiles = [],
          waterTiles = [],
          counter = 0,
          thisObj = this;

      for(key in this.state.tiles){
        if(thisObj.state.tiles[key].length > 2) {
          waterTiles.push(<Tile type="vectiles-water-areas" path={thisObj.state.path} data={thisObj.state.tiles[key]} id="waterTiles"></Tile>);
          roadTiles.push(<Tile type="vectiles-highroad" path={thisObj.state.path} data={thisObj.state.tiles[key]} id="roadTiles"></Tile>);
        }
      };

      return (
        <div>
          <canvas 
            width={this.props.width}
            height={this.props.height}
            className="detectors" 
            id="detectors">
              <Detector 
                id="detectors"
                className="detectors"
                projection={this.state.projection} >
              </Detector>
          </canvas>
          <canvas 
            width={this.props.width}
            height={this.props.height}
            className="roadTiles" 
            id="roadTiles">
              {roadTiles}
          </canvas>
          <canvas
            width={this.props.width}
            height={this.props.height}
            className="waterTiles" 
            id="waterTiles">
              {waterTiles}
          </canvas>
        </div>
      )
    }
});

module.exports = Map;