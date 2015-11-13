/** @jsx React.DOM */
var React = require('react');
var d3 = require('d3');
var renderQueue = require('../util/renderqueue.js');
var $ = require('jquery');

var data = [
	{"name" : "Felix", "weight": 10},
	{"name": "Casper", "weight": 12},
	{"name": "Snowball", "weight": 1},
]; 

var Bar = React.createClass({
	
	propTypes:{
		width: React.PropTypes.number,
		height: React.PropTypes.number
	},

    getInitialState:function(){
    	var margin = {top: 20, right: 20, bottom: 30, left: 40}
    		width = this.props.width - margin.left - margin.right,
   	 		height = this.props.height - margin.top - margin.bottom,
    		x = d3.scale.ordinal().rangeRoundBands([0, width], .02),
    		y = d3.scale.linear().rangeRound([height, 0]);

    	return { x:x , y:y, ctx:null, margin:margin, width:width, height:height}
    },

    draw:function(){
    	var thisObj = this,
    		context = this.state.ctx;

    	this.state.x.domain(data.map(function(d) { return d["name"]; }));
  		this.state.y.domain([0, d3.max(data, function(d) { return d["weight"]; })]);
    
		/* x-ticks */
		context.beginPath();
		this.state.x.domain().forEach(function(d) {
			context.moveTo(thisObj.state.x(d) + thisObj.state.x.rangeBand() / 2, this.propsheight);
			context.lineTo(thisObj.state.x(d) + thisObj.state.x.rangeBand() / 2, this.propsheight + 6);
		});
		context.strokeStyle = "black";
		context.stroke();

		/* x-tick labels */
		context.textAlign = "center";
		context.textBaseline = "top";
		this.state.x.domain().forEach(function(d) {
			context.fillText(d, thisObj.state.x(d) + thisObj.state.x.rangeBand() / 2, thisObj.state.height + 6);
		});

		/* y-ticks */
		context.beginPath();
		this.state.y.ticks(10).forEach(function(d) {
			context.moveTo(0, thisObj.state.y(d) + 0.5);
			context.lineTo(-6, thisObj.state.y(d) + 0.5);
		});
		context.strokeStyle = "black";
		context.stroke();

		/* y-tick labels */
		var format = thisObj.state.y.tickFormat(10, "%");
		context.textAlign = "right";
		context.textBaseline = "middle";
		this.state.y.ticks(10).forEach(function(d) {
			context.fillText(format(d), -9, thisObj.state.y(d));
		});

		/* y-axis */
		context.beginPath();
		context.moveTo(-6.5, 0 + 0.5);
		context.lineTo(0.5, 0 + 0.5);
		context.lineTo(0.5, thisObj.state.height + 0.5);
		context.lineTo(-6.5, thisObj.state.height + 0.5);
		context.strokeStyle = "black";
		context.stroke();

		/* y-axis title */
		context.save();
		context.rotate(-Math.PI / 2);
		context.textAlign = "right";
		context.textBaseline = "top";
		context.fillText("Frequency", 0, 3);
		context.restore();

		/* bars */
		context.fillStyle = "black";
		data.forEach(function(d) {
			context.fillRect(thisObj.state.x(d["name"]), thisObj.state.y(d["weight"]), thisObj.state.x.rangeBand(), thisObj.state.height - thisObj.state.y(d["weight"]));
		});
    },

    componentDidMount:function(){
    	var canvas = document.getElementById(this.props.type),
        	ctx = canvas.getContext('2d');
        	ctx.translate(this.state.margin.left, this.state.margin.top);
        	this.setState({ ctx:ctx });
    },

    render:function(){
    	if(this.state.ctx && data) this.draw();
        return (
        	<canvas 
    			width={this.props.width}
                height={this.props.height}
                className={this.props.type} 
                id={this.props.type}>    
            </canvas>
	    );
    }

});

module.exports = Bar;