//console.log('hello world');

fetch('./elements.json')
    .then((response) => response.json())
    .then((json) => formatData(json))
    .then((formattedData) => visualizeData(formattedData));



function formatData(json_in){
	edx_data_out = [];
	// format EDX data into long repr with .Z, .E, .descr
	for(let zt = 0; zt < json_in.length; zt++){
		//console.log(json_in[zt])
		for(const peak in json_in[zt].EDS){
			if(json_in[zt].EDS[peak]!== null){
				edx_data_out.push({
					'Z':json_in[zt].Z,
					'E':json_in[zt].EDS[peak],
					'descr':json_in[zt].Symbol +" " + peak
				});
			}
		}
		
	}
	return(edx_data_out);
}

function visualizeData(formattedData){
	//console.log(formattedData);
	var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 1000 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;


    var svg = d3.select("#plotEDX")
  		.append("svg")
    	.attr("width", width + margin.left + margin.right)
    	.attr("height", height + margin.top + margin.bottom)
  		.append("g")
    		.attr("transform",
          		"translate(" + margin.left + "," + margin.top + ")");
    // Add X axis
    var x = d3.scaleLinear()
    	.domain([0, 123000])
    	.range([ 0, width ]);
  	svg.append("g")
    	.attr("transform", "translate(0," + height + ")")
    	.call(d3.axisBottom(x));
	// Add Y axis
	var y = d3.scaleLinear()
	    .domain([0, 104])
	    .range([ height, 0]);
	svg.append("g")
	    .call(d3.axisLeft(y));

	//add tooltip
	/*var tooltip = d3.select("#plotEDX")
	    .append("div")
	    .style("opacity", 0)
	    .attr("class", "tooltip")
	    .style("background-color", "white")
	    .style("border", "solid")
	    .style("border-width", "1px")
	    .style("border-radius", "5px")
	    .style("padding", "10px")
    	.style("position", "absolute")*/
    var tooltipdiv = d3.select("#plotEDX").append("div")   
        .attr("class", "tooltip")  
        .style("position","absolute")             
        .style("opacity", 0)
        .style("background-color", "white")
	    .style("border", "solid")
	    .style("border-width", "1px")
	    .style("border-radius", "5px")
	    //.style("padding", "10px")


	// Add dots
	svg.append('g')
    .selectAll("dot")
    .data(formattedData)
    .enter()
    .append("circle")
      	.attr("cx", function (d) { return x(d.E); } )
      	.attr("cy", function (d) { return y(d.Z); } )
      	.attr("r", 4)
      	.style("fill", "gray")
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
	        d3.select(this).style("fill", "gray"); 
	    });

}
