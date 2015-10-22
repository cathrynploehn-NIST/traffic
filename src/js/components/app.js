/** @jsx React.DOM */
var React = require('react');
var d3 = require('d3');
var topojson = require('topojson');

var Map = React.createClass({
    getInitialState:function(){
      // Set projection and path
      var projection = d3.geo.albers()
            .center([0, 55.4])
            .rotate([4.4, 0])
            .parallels([50, 60])
            .scale(6000)
            .translate([this.props.width / 2, this.props.height / 2]);

      var calcPath = d3.geo.path()
        .projection(projection);

      return {
        path: calcPath,
        geoData: null
      }
    },
    
    shouldComponentUpdate:function(nextProps, nextState){
      return nextProps.data !== this.props.data;
    },

    componentWillReceiveProps:function(nextProps){
      if(nextProps.data){
        var uk = nextProps.data;
        var data = topojson.feature(uk, uk.objects.subunits);
        console.log(data);
        this.setState({ geoData: data });
      }
    },

    render:function(){
      console.log(this.state.geoData);
      console.log(this.props.data);
      var pathObj = this.state.path(this.state.geoData);
      return (
        <path d={pathObj}></path>
      )
    }
});

var Graph = React.createClass({
    getInitialState:function(){
      return {
        data: null
      };
    },
    componentDidMount:function(){
      var thisObj = this;
      
      // Load data
      d3.json("uk.json", function(error, uk) {
        if (error) return console.error(error);
        thisObj.setState({data: uk});
      });
    },

    render:function(){
      return (
        <svg 
          width={this.props.width}
          height={this.props.height}> 
          
          <Map 
            data={this.state.data} 
            width={this.props.width}
            height={this.props.height}
          ></Map>       
        </svg>
      )
    }
  });

var App = React.createClass({
    getDefaultProps: function() {
      return {
        width: 1500,
        height: 1000
      }
    },

    render:function(){
      return (
        <div className="wrapper">
          <Graph 
            width={this.props.width}
            height={this.props.height} >
          </Graph> 
        </div>
      )
    }
  });

module.exports = App;
