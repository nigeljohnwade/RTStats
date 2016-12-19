const d3ChartUtilities = {
    /*
     * Column Chart that can plot multi series data
     * @param data is an array of arrays - each of these is a series
     * @param labels is an array of arrays
     * @param target is a string representing the class that will be added to the created SVG element
     * @param container is a dom element that the SVG element will be created in
     * @param props is an object for various miscellaneous
     */
    drawColumnChart: function (data, seriesLabels, tickLabels, target, container, props) {
        var colors = [
            '#1f78b4', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a', '#b15928',
            '#62a3d0', '#72bf5b', '#ef5a5a', '#fe9f37', '#9a77b8', '#d8ac60',
            '#a6cee3', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6', '#ffff99'
        ];
        var width = container.clientWidth,
            height = container.clientHeight,
            legendWidth = 0,
            chartTitleHeight = 0,
            captionTextHeight = 0,
            topPadding = 20,
            bottomPadding = 20,
            leftPadding = 0,
            rightPadding = 20,
            xAxisHeight = 0,
            yAxisWidth = 0,
            gap = 0;

        //For multi series data:
        //Collate the values from multiple series into one array to find a global maximum
        //Collate the lengths from multiple series to find the longest series
        var _dataCollate = {max: [], length: []};
        data.forEach(function (element, index, array) {
            _dataCollate.max = _dataCollate.max.concat(element);
            _dataCollate.length.push(element.length)
        });

        //If the legend is specified then draw it
        if (props.displayLegend) {
            legend.drawLegend(data, seriesLabels, colors, container, layout);
            legendWidth = $('.legend', container).width();
        }

        //Create a d3 selection for the constainer of the chart
        var containerSelection = d3.select(container);
        //Create an SVG element for the chart
        var chart = containerSelection.append("svg")
            .attr("width", width - legendWidth)
            .attr("height", height)
            .html("")
            .attr("class", target);

        //If there is a chart title specified draw it    
        if (props.chartTitle && props.chartTitle.length > 0) {
            var chartTitle = chart.append("text")
                .classed("chart-title", true)
                .text(function (d, i) {
                    return props.chartTitle
                })
                .attr("y", function (d, i) {
                    return this.offsetHeight;
                });
            chartTitleHeight = chartTitle[0][0].offsetHeight;
        }
        //If there is a caption specified draw it
        if (props.captionText && props.captionText.length > 0) {
            var captionText = chart.append("text")
                .classed("caption-text", true)
                .text(function (d, i) {
                    return props.captionText;
                })
                .attr("y", function (d, i) {
                    return this.offsetHeight + chartTitleHeight;
                });
            captionTextHeight = captionText[0][0].offsetHeight;
        }
        //First pass at creating x axis
        var x = d3.scaleBand()
            .rangeRound([0, width - legendWidth - leftPadding - rightPadding])
            .domain(tickLabels[0]);
        var axis_x = containerSelection.select("svg")
            .append("g")
            .attr("class", "x axis")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "center")
            .attr("transform", function (d) {
                return "rotate(-" + props.xAxisTickLabelRotation + ")"
            });
        
        xAxisHeight = containerSelection.select('g.x.axis')['_groups'][0][0].getBBox().height;

        var plotHeight = height - chartTitleHeight - captionTextHeight - topPadding - bottomPadding - xAxisHeight;

        var y = d3.scaleLinear()
            .range([plotHeight, 0]);
        y.domain([0, d3.max(_dataCollate.max)]);
        var axis_y = containerSelection.select("svg")
            .append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y));
        yAxisWidth = axis_y['_groups'][0][0].getBBox().width;
        containerSelection.select('g.x.axis').remove();

        //Second pass at x axis now we know how wide the y axis is.
        x = d3.scaleBand()
            .rangeRound([0, width - legendWidth - yAxisWidth - leftPadding - rightPadding], 0, 0)
            .domain(tickLabels[0]);
        axis_x = containerSelection.select("svg")
            .append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + yAxisWidth + leftPadding + "," + (height - bottomPadding - xAxisHeight) + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function (d) {
                return "rotate(-" + props.xAxisTickLabelRotation + ")"
            });

        axis_y.attr("transform", "translate(" + yAxisWidth + leftPadding + ", " + (chartTitleHeight + captionTextHeight + topPadding) + ")");

        //Work out various values
        var plotWidth = width - yAxisWidth - leftPadding - rightPadding;

        var barWidth = x.bandwidth() / data.length;
        var seriesWidth = x.bandwidth();
        var gap = props.multiSeriesGap * 0.01 * barWidth;

        //Iterate over series and draw them
        for (var i = 0; i < data.length; i++) {

            var bar = [];
            //Create groups for each data point
            bar[i] = chart.selectAll(".series")
                .data(data[i])
                .enter()
                .append("g")
                .attr("transform", function (d, idx) {
                    return "translate(" + ((yAxisWidth + leftPadding) + (x(tickLabels[i][idx]) + ((barWidth - gap) * i)) + gap) + ",0)";
                });

            //Add rect to group to represent data point
            bar[i].append("rect")
                .classed("column", true)
                .attr("data-name", function (d, idx) {
                    return seriesLabels[i];
                })
                .attr("data-value", function (d) {
                    return d;
                })
                .attr("y", function (d) {
                    return y(d) + chartTitleHeight + captionTextHeight + topPadding;
                })
                .attr("height", function (d) {
                    return plotHeight - y(d);
                })
                .attr("width", barWidth - gap)
                .attr("fill", function (d, idx) {
                    return colors[i];
                });

            bar[i].append("title")
                .text(function (d, idx) {
                    return [d, ' ', tickLabels[i][idx]].join('');
                });

        }
        if (props.displayLegend && props.legendPosition === 'w') {
            chart.style("transform", "translateX(" + legendWidth + "px)");
        }
    }
}