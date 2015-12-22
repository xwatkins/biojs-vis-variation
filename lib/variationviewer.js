/*
 * variation-viewer
 * https://github.com/xwatkins/biojs-vis-variation
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

var aaList = ['H', 'R', 'K', 'E', 'D', 'Q', 'N', 'Y', 'C', 'T', 'S', 'G', 'M', 'W', 'F', 'P', 'I', 'L', 'V', 'A', '*'];

var VariationViewer = function(opts) {
	var dataLoader = loadData(opts.id);
	dataLoader.done(function(data) {
		var convertedData = processData(data);
		drawChart(opts.el, convertedData);
	});
}

var variationPlot = function() {
	var xScale = d3.scale.ordinal(),
		yScale = d3.scale.linear();

	var frequency = d3.scale.linear()
		.domain([0, 1])
		.range([5, 10]);

	var seriousness = d3.scale.ordinal()
		.domain([0, 0.25, 0.75, 1.0])
		.range(['crimson', 'lightskyblue', 'lightgreen'])

	var drawMainSequence = function(bars) {
		var circle = bars.selectAll('circle')
			.data(function(d) {
				return [d];
			});

		circle
			.enter()
			.append('circle');

		circle.attr('cx', function(d, i) {
				return xScale(d.pos);
			})
			.attr('cy', function(d) {
				return yScale(d.normal);
			})
			.attr('r', 4)
			.attr('class', 'main-seq');

		circle.exit().remove();
	}

	var drawVariants = function(bars) {
		var variantGroup = bars.append('g')
			.attr('id', 'variant-group');

		variantGroup.selectAll('circle')
			.data(function(d) {
				return d.variants;
			})
			.enter()
			.append('circle')
			.attr('cx', function(d) {
				return xScale(d.begin);
			})
			.attr('cy', function(d) {
				return yScale(d.mutation);
			})
			.attr('r', function(d) {
				return frequency(d.frequency);
			})
			.attr('fill', function(d) {
				return (d.mutation === '*') ? 'teal' : seriousness(d.polyphenScore);
			});
	}

	var variationPlot = function(selection) {
		var series, bars;

		selection.each(function(data) {
			// Generate chart
			series = d3.select(this);

			bars = series.selectAll('.var-series')
				.data(data, function(d) {
					return d.pos;
				})

			bars.enter()
				.append('g')
				.classed('var-series', true);

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
	var margin = {
			top: 20,
			right: 20,
			bottom: 30,
			left: 35
		},
		width = 960 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;

	var maxPos = data.length;

	var xScale = d3.scale.linear()
		.domain([0, maxPos])
		.range([0, width]);

	var yScale = d3.scale.ordinal()
		.domain(aaList)
		.rangePoints([0, height]);

	var mainChart = d3.select(el)
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


	var chartArea = mainChart.append('g')
		.attr('clip-path', 'url(#plotAreaClip)');

	mainChart.append('clipPath')
		.attr('id', 'plotAreaClip')
		.append('rect')
		.attr({
			width: width,
			height: height + margin.top + margin.bottom
		})
		.attr('transform', 'translate(0, ' + -margin.top + ')');

	// Data series
	var series = variationPlot()
		.xScale(xScale)
		.yScale(yScale);

	var dataSeries = chartArea
		.datum(data)
		.call(series);

	var xAxis = d3.svg.axis()
		.scale(xScale);

	var yAxis = d3.svg.axis()
		.scale(yScale)
		.tickSize(-width)
		.orient('left');

	var yAxis2 = d3.svg.axis()
		.scale(yScale)
		.orient('right');

	mainChart.append('g')
		.attr('transform', 'translate(0 ,' + height + ')')
		.attr('class', 'x axis')
		.call(xAxis);

	mainChart.append('g')
		.attr('class', 'y axis')
		.call(yAxis);

	mainChart.append('g')
		.attr('transform', 'translate(' + width + ', 0)')
		.attr('class', 'y axis')
		.call(yAxis2);

	// Nav chart
	var navWidth = width,
		navHeight = 100 - margin.top - margin.bottom;

	var navChart = d3.select(el)
		.append('svg')
		.attr('class', 'overview')
		.attr('width', navWidth + margin.left + margin.right)
		.attr('height', navHeight + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

	var navXScale = d3.scale.linear()
		.domain([0, maxPos])
		.range([0, navWidth]);

	var variationCountArray = _.map(data, function(d) {
		return d.variants.length;
	});

	var navYScale = d3.scale.linear()
		.domain([0, d3.max(variationCountArray)])
		.range([navHeight, 0]);

	var line = d3.svg.line()
		.x(function(d, i) {
			return navXScale(i);
		})
		.y(function(d, i) {
			return navYScale(d);
		})
		.interpolate('linear');

	navChart.append("path")
		.attr("class", "block-area")
		.attr("d", line(variationCountArray));

	navChart.append("path")
		.attr("class", "line")
		.attr("d", line(variationCountArray));

	var navXAxis = d3.svg.axis()
		.scale(navXScale)
		.orient('bottom');

	navChart.append('g')
		.attr('transform', 'translate(0 ,' + navHeight + ')')
		.attr('class', 'x axis')
		.call(navXAxis);

	// Viewport
	var viewport = d3.svg.brush()
		.x(navXScale)
		.on("brush", function() {
			xScale.domain(viewport.empty() ? navXScale.domain() : viewport.extent());
			redrawChart();
		});

	navChart.append("g")
		.attr("class", "viewport")
		.call(viewport)
		.selectAll("rect")
		.attr("height", navHeight);

	// Zooming and panning

	var zoom = d3.behavior.zoom()
		.x(xScale)
		.on('zoom', function() {
			if (xScale.domain()[0] < 0) {
				zoom.translate([zoom.translate()[0] - xScale(0) + xScale.range()[0], 0]);
			} else if (xScale.domain()[1] > maxPos) {
				zoom.translate([zoom.translate()[0] - xScale(0) + xScale.range()[1], 0]);
			}
			redrawChart();
			updateViewpointFromChart();
		});

	var overlay = d3.svg.area()
		.x(function(d) {
			return xScale(d.pos);
		})
		.y0(0)
		.y1(height);

	mainChart.append('path')
		.attr('class', 'overlay')
		.attr('d', overlay(data))
		.call(zoom);

	// Setup
	var aaShown = 30;

	xScale.domain([
		0,
		aaShown - 1
	]);

	redrawChart();
	updateViewpointFromChart();
	updateZoomFromChart();

	function redrawChart() {
		dataSeries.call(series);
		mainChart.select('.x.axis').call(xAxis);
	}

	function updateViewpointFromChart() {
		if ((xScale.domain()[0] <= 0) && (xScale.domain()[1] >= maxPos)) {
			viewport.clear();
		} else {
			viewport.extent(xScale.domain());
		}
		navChart.select('.viewport').call(viewport);
	}

	function updateZoomFromChart() {
		var fullDomain = maxPos,
			currentDomain = xScale.domain()[1] - xScale.domain()[0];

		var minScale = currentDomain / fullDomain,
			maxScale = minScale * 20;

		zoom.x(xScale)
			.scaleExtent([minScale, maxScale]);
	}
}

// Helper methods
var loadData = function(id) {
	return $.ajax({
		url: 'https://www.ebi.ac.uk/uniprot/services/restful/features/' + id,
		dataType: 'json'
	});
}

var processData = function(d) {
	var mutationArray = [];
	if (d.variants.features.length > 0) {
		mutationArray.push({
			'type': {
				'name': 'VARIANT',
				'label': 'Sequence Variant'
			},
			'normal': '-',
			'pos': 0,
			'variants': []
		});
		var seq = d.sequence.split('');
		_.each(seq, function(d, i) {
			mutationArray.push({
				'type': {
					'name': 'VARIANT',
					'label': 'Sequence Variant'
				},
				'normal': seq[i],
				'pos': i + 1,
				'variants': []
			});
		});
		mutationArray.push({
			'type': {
				'name': 'VARIANT',
				'label': 'Sequence Variant'
			},
			'normal': '-',
			'pos': seq.length + 1,
			'variants': []
		});

		_.each(d.variants.features, function(d) {
			d.begin = +d.begin;
			d.wildType = d.wildType ? d.wildType : mutationArray[d.begin].normal;
			// if (Evidence.isLSS(d.evidences) || (d.sp === false)) {
			// 	d.lss = true;
			// }
			if ((1 <= d.begin) && (d.begin <= seq.length)) {
				mutationArray[d.begin].variants.push(d);
			} else if ((seq.length + 1) === d.begin) {
				mutationArray[d.begin - 1].variants.push(d);
			}
		});
	}
	return mutationArray;
}

module.exports = VariationViewer;