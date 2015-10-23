/** @jsx React.DOM */
var React = require('react');
var Map = require('../components/Map.js');

var Graph = React.createClass({
    render:function(){
      return (
        <svg 
          width={this.props.width}
          height={this.props.height}> 
          
          <Map 
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
        width: window.innerWidth,
        height: window.innerHeight
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
