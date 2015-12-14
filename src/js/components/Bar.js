/** @jsx React.DOM */
var React = require('react');
var d3 = require('d3');
var renderQueue = require('../util/renderqueue.js');
var $ = require('jquery');

var Bar = React.createClass({
	
	propTypes:{
		width: React.PropTypes.number.isRequired,
		height: React.PropTypes.number.isRequired,
        type:React.PropTypes.string.isRequired, // id for the canvas element
        title: React.PropTypes.string.isRequired,
        yAxisName: React.PropTypes.string.isRequired,
        xAxisName: React.PropTypes.string.isRequired,
        data: React.PropTypes.array.isRequired
	},

    getInitialState:function(){
    	var margin = {top: 20, right: 20, bottom: 20, left: 20},
    		width = this.props.width - margin.left - margin.right,
   	 		height = this.props.height - margin.top - margin.bottom;
    		
    	return { 
            // Display properties
    		yAxisPadding: 15,
    		numberTicks: 3,
            fontScale: 10, // Use scale to convert number of letters to actual pixels in 9pt courier font
            margin:margin, 
            width:width, 
            height:height,
            
            x:null,
            y:null, 
            ctx:null, 
            xAxisWidth: null,
            yAxisWidth: null,
            tickFormat: null,
            yAxisTitle: null,
            xAxisTitle: null,
            maxTitleLength: null,
            drawHeight: null,
            drawWidth: null
    	}
    },

    draw:function(){
        var thisObj = this,
            context = this.state.ctx,
            yAxisName = this.props.yAxisName,
            xAxisName = this.props.xAxisName;
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
        // context.beginPath();
        // context.lineTo((thisObj.state.yAxisWidth+0.5), 0);
        // context.lineTo((thisObj.state.yAxisWidth+0.5), thisObj.state.drawHeight);
        // context.strokeStyle = "black";
        // context.stroke();

        
        /* y-axis title */
		context.font = "bold 9pt Courier";
        context.textAlign = "right";
		context.textBaseline = "top";
        for(key in thisObj.state.yAxisTitle){
		  context.fillText(thisObj.state.yAxisTitle[key], (thisObj.state.maxTitleLength * thisObj.state.fontScale - thisObj.state.yAxisPadding), (key * thisObj.state.fontScale)-5 + (this.state.drawHeight/2));
        }

        /* x-axis title */
        for(key in thisObj.state.xAxisTitle){
          context.fillText(thisObj.state.xAxisTitle[key], (thisObj.state.maxTitleLength * thisObj.state.fontScale - thisObj.state.yAxisPadding), thisObj.state.height - (thisObj.state.xAxisWidth / 2));
        }

		/* bars */
		context.fillStyle = "black";
		this.props.data.forEach(function(d) {
			context.fillRect(thisObj.state.x(d[xAxisName]) + thisObj.state.yAxisWidth, thisObj.state.y(d[yAxisName]), thisObj.state.x.rangeBand(), thisObj.state.drawHeight - thisObj.state.y(d[yAxisName]));
		});
    },
    componentWillMount:function(){
    	var thisObj = this,
            yAxisName = this.props.yAxisName,
            xAxisName = this.props.xAxisName;

        // Determine X axis space
        var xAxisWidth = d3.max(this.props.data, function(d){ return d[xAxisName].length; }) * (thisObj.state.fontScale/2);
            xAxisWidth = Math.sqrt((xAxisWidth * xAxisWidth * 2));
        
        // Determine Y axis draw area
        var drawHeight = this.state.height - xAxisWidth,
            y = d3.scale.linear().rangeRound([drawHeight, 0]),
            yAxisTitle = yAxisName.split(" "),
            xAxisTitle = xAxisName.split(" "),
            maxYTitleLength = d3.max(yAxisTitle, function(d){ return d.length; }),
            maxXTitleLength = d3.max(xAxisTitle, function(d){ return d.length; }),
            maxTitleLength = Math.max(maxYTitleLength, maxXTitleLength),

        // Calculate ticks
            ticks = y.ticks(thisObj.state.numberTicks),
            tickFormat = y.tickFormat(d3.format("s")),

        // Determine Y axis space
            yAxisWidth = d3.max(ticks, function(d) { return tickFormat(d).length; }) + this.state.yAxisPadding + (maxYTitleLength * thisObj.state.fontScale),
            drawWidth = this.state.width - yAxisWidth;

        // Don't let bars be wider than 50px because it's ugly
        if((this.state.width / thisObj.props.data.length) > 50){
            var x = d3.scale.ordinal().rangeRoundBands([0, thisObj.props.data.length * 50], 0.02);
        } else {
            var x = d3.scale.ordinal().rangeRoundBands([0, this.state.width], 0.02);
        }
        
    	x.domain(thisObj.props.data.map(function(d) { return d[xAxisName]; }));
  		y.domain([0, d3.max(thisObj.props.data, function(d) { return d[yAxisName]; })]);

    	this.setState({
    		x: x,
    		y: y,
    		xAxisWidth: xAxisWidth,
    		yAxisWidth: yAxisWidth,
            yAxisTitle: yAxisTitle,
            xAxisTitle: xAxisTitle,
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
    	if(this.state.ctx && this.props.data) this.draw();
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