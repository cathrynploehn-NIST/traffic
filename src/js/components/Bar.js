/** @jsx React.DOM */
var React = require('react');
var d3 = require('d3');
var renderQueue = require('../util/renderqueue.js');
var $ = require('jquery');

var data = [
	{"name": "Ashley", "weight (kg)": 12},
    {"name": "Beezlebub", "weight (kg)": 20},
    {"name": "Chad", "weight (kg)": 17},
    {"name": "Dolores", "weight (kg)": 4},
    {"name": "El borracho", "weight (kg)": 7},
    {"name": "Flip", "weight (kg)": 1}
]; 

var Bar = React.createClass({
	
	propTypes:{
		width: React.PropTypes.number,
		height: React.PropTypes.number
	},

    getInitialState:function(){
    	var margin = {top: 20, right: 20, bottom: 30, left: 20},
    		width = this.props.width - margin.left - margin.right,
   	 		height = this.props.height - margin.top - margin.bottom;
    		
    	return { 
    		x:null ,
    		y:null, 
    		ctx:null, 
    		margin:margin, 
    		width:width, 
    		height:height,
    		xAxisWidth: null,
    		yAxisWidth: null,
    		yAxisPadding: 15,
    		tickFormat: null,
    		numberTicks: 3,
            yAxisName: "weight (kg)",
            xAxisName: "name",
            yAxisTitle: null
    	}
    },

    draw:function(){
        var thisObj = this,
            context = this.state.ctx,
            yAxisName = this.state.yAxisName,
            xAxisName = this.state.xAxisName;
        context.font = "normal 9pt Courier";

        /* x-tick labels */
        context.save();
        context.textAlign = "right";
        context.textBaseline = "top";
        this.state.x.domain().forEach(function(d) {
            context.save();
            context.translate(thisObj.state.x(d) + thisObj.state.yAxisWidth + (thisObj.state.x.rangeBand() / 3), (thisObj.state.height - thisObj.state.xAxisWidth + 6));
            context.rotate(-Math.PI / 4);
            context.fillText(d, 0 , 0);
            context.restore();
        });
        context.restore();

        /* y-ticks */
        context.beginPath();
        this.state.y.ticks(thisObj.state.numberTicks).forEach(function(d) {
            context.moveTo(thisObj.state.yAxisWidth, thisObj.state.y(d));
            context.lineTo((thisObj.state.yAxisWidth-6), thisObj.state.y(d));
        });
        context.strokeStyle = "black";
        context.stroke();

        /* y-tick labels */
        context.textAlign = "right";
        context.textBaseline = "middle";
        this.state.y.ticks(thisObj.state.numberTicks).forEach(function(d) {
            context.fillText(thisObj.state.tickFormat(d), (thisObj.state.yAxisWidth-9), (thisObj.state.y(d)));
        });

        /* y-axis */
        context.beginPath();
        context.lineTo((thisObj.state.yAxisWidth+0.5), 0);
        context.lineTo((thisObj.state.yAxisWidth+0.5), thisObj.state.drawHeight);
        context.strokeStyle = "black";
        context.stroke();

        
        /* y-axis title */
		context.font = "bold 9pt Courier";
        context.textAlign = "right";
		context.textBaseline = "top";
        for(key in thisObj.state.yAxisTitle){
		  context.fillText(thisObj.state.yAxisTitle[key], (thisObj.state.maxTitleLength * 10 - 15), (key * 10)-5 + (this.state.drawHeight/2));
        }

        /* x-axis title */
        for(key in thisObj.state.xAxisTitle){
          context.fillText(thisObj.state.xAxisTitle[key], (thisObj.state.maxTitleLength * 10 - 15), thisObj.state.height - (thisObj.state.xAxisWidth / 2 - 10));
        }

		/* bars */
		context.fillStyle = "black";
		data.forEach(function(d) {
			context.fillRect(thisObj.state.x(d[xAxisName]) + thisObj.state.yAxisWidth, thisObj.state.y(d[yAxisName]), thisObj.state.x.rangeBand(), thisObj.state.drawHeight - thisObj.state.y(d[yAxisName]));
		});
    },
    componentWillMount:function(){
    	var thisObj = this,
            yAxisName = this.state.yAxisName,
            xAxisName = this.state.xAxisName;;

        // Determine X axis space
        var xAxisWidth = d3.max(data, function(d){ return d[xAxisName].length; });
            xAxisWidth = Math.sqrt((xAxisWidth * xAxisWidth * xAxisWidth));
        
        // Determine Y axis draw area
        var drawHeight = this.state.height - xAxisWidth;
        var y = d3.scale.linear().rangeRound([drawHeight, 0]);
        var yAxisTitle = this.state.yAxisName.split(" ");
        var xAxisTitle = this.state.xAxisName.split(" ");
        var maxYTitleLength = d3.max(yAxisTitle, function(d){ return d.length; });
        var maxXTitleLength = d3.max(xAxisTitle, function(d){ return d.length; });

        var maxTitleLength = Math.max(maxYTitleLength, maxXTitleLength);

        // Calculate ticks
        var ticks = y.ticks(thisObj.state.numberTicks);
        var tickFormat = y.tickFormat(d3.format("s"));

        // Determine Y axis space
        var yAxisWidth = d3.max(ticks, function(d) { return tickFormat(d).length; }) + this.state.yAxisPadding + (maxYTitleLength * 10);
        var drawWidth = this.state.width - yAxisWidth;

        if((this.state.width / data.length) > 50){
            var x = d3.scale.ordinal().rangeRoundBands([0, data.length * 50], 0.02);
        } else {
            var x = d3.scale.ordinal().rangeRoundBands([0, this.state.width], 0.02);
        }
        
    	x.domain(data.map(function(d) { return d[xAxisName]; }));
  		y.domain([0, d3.max(data, function(d) { return d[yAxisName]; })]);

    	this.setState({
    		x: x,
    		y: y,
    		xAxisWidth: xAxisWidth,
    		yAxisWidth: yAxisWidth,
            yAxisTitle: yAxisTitle,
            xAxisTitle: xAxisTitle,
            maxYTitleLength:maxYTitleLength,
            maxXTitleLength: maxXTitleLength,
            maxTitleLength: maxTitleLength,
    		tickFormat: tickFormat,
    		drawHeight: drawHeight,
    		drawWidth: drawWidth
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