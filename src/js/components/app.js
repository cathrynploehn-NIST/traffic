/** @jsx React.DOM */
var React = require('react');
var Bar = require('../components/Bar.js');

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
          <Bar 
            width={this.props.width}
            height={500} 
            type="cats"
          >
          </Bar> 
        </div>
      )
    }
  });

module.exports = App;
