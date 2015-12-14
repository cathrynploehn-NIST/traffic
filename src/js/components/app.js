/** @jsx React.DOM */
var React = require('react');
var Map = require('../components/Map.js');

var App = React.createClass({
    getDefaultProps: function() {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      }
    },

    render:function(){
      return (
        <div className="wrapper">
          <Map 
            width={this.props.width}
            height={this.props.height}
          ></Map>
        </div>
      )
    }
  });

module.exports = App;
