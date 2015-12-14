/** @jsx React.DOM */
var React = require('react');
var Bar = require('../components/Bar.js');
var Map = require('../components/Map.js');
var Bar = require('../components/Bar.js');

var App = React.createClass({
    getDefaultProps: function() {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        data: [
            {"name": "Ashley", "weight (kg)": 12},
            {"name": "Beezlebub", "weight (kg)": 20},
            {"name": "Chad", "weight (kg)": 17},
            {"name": "Dolores", "weight (kg)": 4},
            {"name": "El Borrachito", "weight (kg)": 7},
            {"name": "Flip", "weight (kg)": 1}
        ]
      }
    },

    render:function(){
      return (
        <div className="wrapper">
          <Map>
            width={this.props.width}
            height={this.props.height} 
          </Map>
        </div>
      )
    }
  });

module.exports = App;
