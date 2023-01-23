


fetch('./elements.json')
    .then((response) => response.json())
    .then((json) => formatData(json))
    .then((formattedData) => visualizeData(formattedData));



function formatData(json_in){
	edx_data_out = [];
	// format EDX data into long repr with .Z, .E, .descr
	for(let zt = 0; zt < json_in.length; zt++){
		console.log(json_in[zt])
		for(const peak in json_in[zt].EDS){
			if(json_in[zt].EDS[peak]!== null){
				edx_data_out.push({
					'Z':json_in[zt].Z,
					'E':json_in[zt].EDS[peak],
					'line':peak,
					'descr':json_in[zt].Symbol +" " + peak
				});
			}
		}
		
	}
	return(edx_data_out);
}

// based off of https://d3-graph-gallery.com/graph/interactivity_zoom.html and https://d3-graph-gallery.com/graph/scatter_tooltip.html
// should look in to https://wrobstory.github.io/2013/11/D3-brush-and-tooltip.html
// for a better (?) approach...
function visualizeData(formattedData){
	//console.log(formattedData);
	var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 1000 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;


    var default_extent_x = 123000;
    var default_extent_y = 104;

      // Color scale: give me a specie name, I return a color
	var color = d3.scaleOrdinal()
	    .domain(["Ka1","Ka2","Kb1","La1","La2","Lb1","Lb2","Lg1","Ma1" ])
	    .range([
	    	"#c568b4", //Ka1
	    	"#8261cc", //Ka2
	    	"#688bcd", //Kb1
	    	"#4bb193", //La1
	    	"#74b74b", //La2
	    	"#70823a", //Lb1
	    	"#c79642", //Lb2
	    	"#c95c3f", //Lg1
	    	"#c65073", //Ma1
		]);
	    //.range([ "#3182bd", "#6baed6","#756bb1","#9e9ac8", "#7b4173","#a55194","#843c39","#31a354"])



    var svg = d3.select("#plotEDX")
  		.append("svg")
    	.attr("width", width + margin.left + margin.right)
    	.attr("height", height + margin.top + margin.bottom)
  		.append("g")
    		.attr("transform",
          		"translate(" + margin.left + "," + margin.top + ")");
    // Add X axis
    var x = d3.scaleLinear()
    	.domain([0, default_extent_x])
    	.range([ 0, width ]);
  	var xAxis = svg.append("g")
    	.attr("transform", "translate(0," + height + ")")
    	.call(d3.axisBottom(x));
	// Add Y axis
	var y = d3.scaleLinear()
	    .domain([0, default_extent_y])
	    .range([ height, 0]);
	svg.append("g")
	    .call(d3.axisLeft(y));
	// Add tooltip (div)
    var tooltipdiv = d3.select("#plotEDX").append("div")   
        .attr("class", "tooltip")  
        .style("position","absolute")             
        .style("opacity", 0)
        .style("background-color", "white")
	    .style("border", "solid")
	    .style("border-width", "1px")
	    .style("border-radius", "5px")
	    //.style("padding", "10px")


	// For zooming/brushing
	// Add a clipPath: everything out of this area won't be drawn.
  	var clip = svg.append("defs").append("svg:clipPath")
		.attr("id", "clip")
		.append("svg:rect")
		.attr("width", width )
		.attr("height", height )
		.attr("x", 0)
		.attr("y", 0);

	// Add brushing
	var brush = d3.brushX()    // Add the brush feature using the d3.brush function
		.extent( [ [0,0], [width,height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
		.on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

	var scatter = svg.append('g')
    	.attr("clip-path", "url(#clip)")

	// Add the brushing
    scatter
    	.append("g")
      		.attr("class", "brush")
      		.call(brush);


	// Add dots
	scatter
    .selectAll("dot")
    .data(formattedData)
    .enter()
    .append("circle")
      	.attr("cx", function (d) { return x(d.E); } )
      	.attr("cy", function (d) { return y(d.Z); } )
      	.attr("r", 4)
      	.style("fill", function (d) { return color(d.line) } ) //.style("fill", "gray")
      	.style("opacity", 1.)
      	.style("stroke","none")//.style("stroke", "white")
      	.on("mouseover", function(event,d) {      
           	tooltipdiv.transition()        
            .duration(200)      
            .style("opacity", 1.);      
            tooltipdiv .html(d.descr+ " " + d.E)  
                        .style("left", (event.pageX+50) + "px")     
                        .style("top", (event.pageY +10) + "px");
            d3.select(this).style("fill", "black");    //.attr("r", 10)
            })                  
	    .on("mouseout", function(event,d) {       
	        tooltipdiv.transition()        
	            .duration(500)      
	            .style("opacity", 0);  
	        d3.select(this).style("fill", function (d) { return color(d.line) } ) //.style("fill", "gray"); 
	    });

    // A function that set idleTimeOut to null
	var idleTimeout
	function idled() { idleTimeout = null; }

	// A function that update the chart for given boundaries
	function updateChart(event) {

	extent = event.selection

	// If no selection, back to initial coordinate. Otherwise, update X axis domain
	if(!extent){
	  if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
	  x.domain([ 0,default_extent_x])
	}else{
	  x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
	  scatter.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
	}

	// Update axis and circle position
	xAxis.transition().duration(1000).call(d3.axisBottom(x))
	scatter
	  .selectAll("circle")
	  .transition().duration(1000)
	  .attr("cx", function (d) { return x(d.E); } )
	  .attr("cy", function (d) { return y(d.Z); } )

	}

}
