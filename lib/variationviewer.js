/*
 * variation-viewer
 * https://github.com/xwatkins/variation-viewer
 *
 * Copyright (c) 2014 Xavier Watkins
 * Licensed under the Apache 2 license.
 */

/**
@class variationviewer
*/
var d3 = require("d3");
var $ = require("jquery");
var _ = require("underscore");

var aaList = ['H','R','K','E','D','Q','N','Y','C','T','S','G','M','W','F','P','I','L','V','A','*'];

var VariationViewer = function(opts) {
	var dataLoader = loadData(opts.id);
	dataLoader.done(function(data) {
		var convertedData = convertData(data);
		drawChart(opts.el, convertedData);
	});

}

var variationPlot = function(){
	var xScale = d3.scale.ordinal(),
		yScale = d3.scale.linear();

	var frequency = d3.scale.linear()
		.domain([0,1])
		.range([5,10]);

	var seriousness = d3.scale.ordinal()
		.domain([0, 0.25, 0.75, 1.0])
		.range(['crimson','lightskyblue','lightgreen'])

	var drawMainSequence = function(bars) {
		var seqGroup = bars.append('g')
			.attr('id','main-seq');

		var circle = seqGroup.selectAll('circle')
			.data(function(d){
				return [d];
			});
		
		circle
			.enter()
			.append('circle')
			.attr('cx', function(d,i){return xScale(d.pos);})
			.attr('cy', function(d) {return yScale(d.normal);})
			.attr('r', 4);
		
	}

	var drawVariants = function(bars) {
		var variantGroup = bars.append('g')
			.attr('id','variant-group');

		variantGroup.selectAll('circle')
			.data(function(d){
				return d.variants;
			})
			.enter()
			.append('circle')
			.attr('cx', function(d){return xScale(d.pos);})
			.attr('cy', function(d) {return yScale(d.mutation);})
			.attr('r', function(d){
				return frequency(d.frequency);
			})
			.attr('fill',function(d) {
				return (d.mutation === '*') ? 'teal' :seriousness(d.polyphenScore);
			});
	}

	var variationPlot = function(selection) {
		selection.each(function(data){
			// Generate chart
			series = d3.select(this).selectAll('.var-series').data([data]);
	        series.enter().append('g').classed('var-series', true);			
			bars = series.selectAll('.main-seq')
			    .data(data, function (d) {
			        return d.pos;
			    });

			bars.enter()
			    .append('g')
			    .classed('bar', true);

			drawMainSequence(bars);
			drawVariants(bars);

			bars.exit().remove();	        
		});
	}

	variationPlot.xScale = function(value) {
        if (!arguments.length) {
            return xScale;
        }
        xScale = value;
        return variationPlot;
	}

	variationPlot.yScale = function(value) {
        if (!arguments.length) {
            return yScale;
        }
        yScale = value;
        return variationPlot;
	}

	return variationPlot;
}

var drawChart = function(el, data) {
	var margin = {top:20,right:20,bottom:30,left:35},
		width = 960 - margin.left - margin.right, 
		height = 400 - margin.top - margin.bottom;

	var x = d3.scale.linear()
		.domain([0, data.length])
		.range([0, width]);

	var y = d3.scale.ordinal()
		.domain(aaList)
		.rangePoints([0, height]);

	// Draw the main chart
	var series = variationPlot()
						.xScale(x)
						.yScale(y);

	var mainChart = d3.select(el)
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform','translate(' + margin.left + ',' + margin.top + ')');

	// Bind data to a selection and call the series.
	mainChart
    	.datum(data)
    	.call(series);

	var xAxis = d3.svg.axis()
		.scale(x);

	var yAxis = d3.svg.axis()
		.scale(y)
		.tickSize(-width)
		.orient('left');

	mainChart.append('g')
		.attr('transform','translate(0 ,' + height+ ')')
		.attr('class','x axis')
		.call(xAxis);

	mainChart.append('g')
		.attr('class','y axis')
		.call(yAxis);

}

// var OverView = function(opts) {


// 	var svg = d3.select(this.el)
// 				.append('svg')
// 				.attr('class','overview')
// 				.attr('width',width)
// 				.attr('height',height).call(drag);

// 	this.drawOverview = function(mutationCount, sequenceLength) {
// 		var x = d3.scale.linear()
// 					.domain([0,sequenceLength])
// 					.range([0,width]);

// 		var y = d3.scale.linear()
// 					.domain([0,d3.max(_.pluck(mutationCount,'count'))])
// 					.range([height, 0]);

// 		var line = d3.svg.line()
// 					.x(function(d,i) {
// 						return x(d.pos);
// 					})
// 					.y(function(d,i) {
// 						return y(d.count);
// 					})
// 					.interpolate('linear');

// 		svg.append("path")
// 				.attr("d",line(mutationCount))
// 				.attr('stroke', 'blue')
// 				.attr('stroke-width', 1)
// 				.attr('fill', 'none');

// 		var highlightWindow = svg.append("rect")
// 				.attr('x',1)
// 				.attr('y',1)
// 				.attr('width',x(20))
// 				.attr('height',height-2)
// 				.attr('stroke','red')
// 				.attr('stroke-width',2)
// 				.attr('fill','none');
// 	}
// }

var convertData = function(data) {
	var mutationArray = [];
	for(var i=0;i<data.sequence.length;i++){
		mutationArray.push({
			'normal':data.sequence[i],
			'pos':i,
			'count':0,
			'variants':[]
		});
	}
	$.each(data.variants, function(i,d){
		mutationArray[parseInt(d.position)].variants.push({
			'pos':d.position,
			'mutation': d.mutation,
			'frequency': d.frequency,
			'siftPrediction': d.siftPrediction
		});
	});
	return mutationArray;
}

var loadData = function(id) {
	return $.ajax({
		url:'scripts/' + id + '.json',
		dataType: 'json'
	})
}

module.exports = VariationViewer;

