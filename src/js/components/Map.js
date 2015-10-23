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
    var thisObj = this;
    d3.csv("data/detector_inventory.csv", function(error, lane_detectors){
      thisObj.setState({data: lane_detectors});
      console.log(lane_detectors);
    });
  },

  render:function(){
    var circles = [],
      thisObj = this;

    for(key in this.state.data){
      var longitude = +this.state.data[key].longitude;
      var latitude = +this.state.data[key].latitude;
      var transf = "translate(" + thisObj.props.projection([longitude, latitude]) + ")";
      circles.push(<circle r={thisObj.state.radius} transform={transf}></circle>);
    }

    return (
      <g>{circles}</g>
    )
  }
});

var Tile = React.createClass({
  getInitialState:function(){
    return {features: null};
  },

  componentDidMount:function(){
    var thisObj = this,
        d = this.props.data;
    
    d3.json("http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/"+thisObj.props.type+"/" + d[2] + "/" + d[0] + "/" + d[1] + ".json", function(error, json) {
      if (error) return console.error(error);
      var featuresObj = json.features.sort(function(a, b) { return a.properties.sort_key - b.properties.sort_key; });
      thisObj.setState({ features: featuresObj });
    });
  },

  render: function(){
    var paths = [],
      thisObj = this;

    if (thisObj.state.features) {
      thisObj.state.features.forEach(function(name){ 
        dVal = thisObj.props.path(name.geometry);
        paths.push(<path className={name.properties.kind} d={dVal} ></path>)
      }); 
    }

    return (<g>{paths}</g>)
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
        tiles: tilesArray
      }
    },

    render:function(){
      var roadTiles = [],
          waterTiles = [],
          counter = 0,
          thisObj = this;

      for(key in this.state.tiles){
        if(thisObj.state.tiles[key].length > 2) {
          waterTiles.push(<Tile type="vectiles-water-areas" path={thisObj.state.path} data={thisObj.state.tiles[key]} ></Tile>);
          roadTiles.push(<Tile type="vectiles-highroad" path={thisObj.state.path} data={thisObj.state.tiles[key]} ></Tile>);
        }
      };

      return (
        <g>
          <g className="waterTiles">{waterTiles}</g>
          <g className="roadTiles">{roadTiles}</g>
          <g classname="detectors"><Detector projection={this.state.projection}></Detector></g>
        </g>
      )
    }
});

module.exports = Map;