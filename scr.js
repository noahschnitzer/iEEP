fetch('./elements.json')
    .then((response) => response.json())
    .then((json) => formatData(json))
	.then((formattedData) => filterData());
	//.then((formattedData) => visualizeData(formattedData));




function formatData(json_in){
	edx_data_out = []; // global
	edx_energies = []; // global
	json_out = json_in // global
	// format EDX data into long repr with .Z, .E, .descr
	for(let zt = 0; zt < json_in.length; zt++){
		for(const peak in json_in[zt].EDS){
			if(json_in[zt].EDS[peak]!== null){
				edx_data_out.push({
					'Z':json_in[zt].Z,
					'E':(json_in[zt].EDS[peak]/1000).toFixed(3),
					'line':peak,
					'symbol':json_in[zt].Symbol,
					// 'descr':json_in[zt].Symbol +"-" + peak
					'descr':json_in[zt].Symbol +"-" + peak.slice(0, peak.length-1)+"<sub>"+peak.slice(peak.length-1)+"</sub>"
				});
				edx_energies.push(json_in[zt].EDS[peak] )
			}
		}
		
	}
	return(edx_data_out);
}

function filterData( ){
	// get list of edge checkboxes
	var chkbox = document.querySelectorAll("#filter_edge input[type='checkbox']");
	var checked_edge = [];
	for (let it=0; it < chkbox.length; it ++){
		if (chkbox[it].checked){
			checked_edge.push( chkbox[it].name);
		}
	}
	var filtered_data = [];
	for (let it=0; it < edx_data_out.length; it++){
		if (checked_edge.includes(edx_data_out[it].line)){
			filtered_data.push( edx_data_out[it] );
		}
	}

	visualizeData( filtered_data );
	tabulateData ( );
	//return filtered_data
}


function tabulateData(){
	let table_element = document.getElementById('tableEDX');
	let table_body = document.getElementById('tableEDX_body');
	for(let it =0; it < edx_data_out.length; it++){
		console.log(edx_data_out[it]);
		let row = table_body.insertRow();//document.createElement("tr");
		// Element
		let td = row.insertCell();
		td.appendChild(document.createTextNode(edx_data_out[it].symbol));
		//row.appendChild(document.createElement("td").appendChild());
		// Z
		td = row.insertCell();
		td.appendChild(document.createTextNode(edx_data_out[it].Z));
		// Edge
		td = row.insertCell();
		td.appendChild(document.createTextNode(edx_data_out[it].line));
		// E
		td = row.insertCell();
		td.appendChild(document.createTextNode(edx_data_out[it].E));

		//table_element.appendChild(row);

	}

	//https://mottie.github.io/tablesorter/docs/
	$("#tableEDX").tablesorter();

}


// based off of https://d3-graph-gallery.com/graph/interactivity_zoom.html and https://d3-graph-gallery.com/graph/scatter_tooltip.html
// should look in to https://wrobstory.github.io/2013/11/D3-brush-and-tooltip.html
// for a better (?) approach...
function visualizeData(formattedData){

	document.getElementById("plotEDX").innerHTML = "";

	var margin = {top: 10, right: 30, bottom: 50, left: 60}

	if (window.innerWidth>1200) {
		width = 1000 - margin.left - margin.right;
	} else {
		width = window.innerWidth*0.9 - margin.left - margin.right;
	}


    height = 450 - margin.top - margin.bottom;

	var max_E = 0;
	for (let it = 0; it < formattedData.length; it++){
		if (formattedData[it].E > max_E){
			max_E = formattedData[it].E
		}
	}


    var default_extent_x = max_E+100;
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



    svg = d3.select("#plotEDX")
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
        .style("background-color", "#666666")
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
            tooltipdiv .html(d.descr+ ": " + d.E + " eV")  
                        .style("left", (event.pageX+50) + "px")     
                        .style("top", (event.pageY +10) + "px")
                        .style("border-color",color(d.line));
            d3.select(this).style("fill", "white");    //.attr("r", 10)
            })                  
	    .on("mouseout", function(event,d) {       
	        tooltipdiv.transition()        
	            .duration(500)      
	            .style("opacity", 0);  
	        d3.select(this).style("fill", function (d) { return color(d.line) } ) //.style("fill", "gray"); 
	    });


	// Add X axis label:
	svg.append("text")
	    .attr("text-anchor", "middle")
	    .attr("x", width/2)
	    .attr("y", height + margin.top + 30)
	    .text("Energy (keV)");

	// Y axis label:
	svg.append("text")
	    .attr("text-anchor", "middle")
	    .attr("transform", "rotate(-90)")
	    .attr("y", -margin.left+20)
	    .attr("x", 0 - (height / 2)) //-margin.top
	    .text("Atomic Number")


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


function textfieldChange() {
	curE = Number(document.getElementById("E_search").value)
	curdE = Number(document.getElementById("dE_search").value)
	matches = findCloseMatches( curE, curdE )

	textResult = ""

	for (let it=0; it<matches.length; it++ ){
		matchE = (matches[it].E);
		descr = matches[it].descr
		// descr = descr.slice(0, descr.length-1)+"<sub>"+descr.slice(descr.length-1)+"</sub>"
		textResult += descr + ": " + matchE +" keV<br>"
	}
	document.getElementById("E_Results").innerHTML = textResult


}

function findCloseMatches( curE, dE ) {
	
	inds = [];
	matches = [];
	for( let it=0; it<edx_data_out.length; it++ ) {
		if (Math.abs(edx_data_out[it].E-curE)< dE) {
			inds.push(it);
			matches.push(edx_data_out[it])
		}
	}

	return(matches)
}