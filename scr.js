fetch('./elements.json')
    .then((response) => response.json())
    .then((json) => formatData(json))
	.then( () => tabulateData() )
	.then( () => update() ) // currently works off global...

window.onresize = function(event) {
	update()
};

function update() {
	filterData( )
}

function toggleEDSEELS() {
	if (document.getElementById("toggle_eels").checked) {
		console.log( 'Switch to EELS' )
		mode = "EELS"
		unit = "eV"
		spectrum_data = eels_data
		spectrum_list = eels_list
		document.getElementById("title").innerHTML = "<h2>EELS Energies</h2>"
		document.getElementById("th_E_label").innerHTML = "E (eV)"
		document.getElementById("Emin").value = 0
		document.getElementById("Emax").value = 4966
		document.getElementById("filter_EDS").setAttribute("class", "hide");
		document.getElementById("filter_EELS").removeAttribute("class","hide");
		document.getElementById("tableEDS_body").innerHTML = ""
		tabulateData()
	} else {
		console.log( 'Switch to EDS' )
		mode = "EDS"
		unit = "keV"
		spectrum_data = eds_data
		spectrum_list = eds_list
		document.getElementById("title").innerHTML = "<h2>EDS Energies</h2>"
		document.getElementById("th_E_label").innerHTML = "E (keV)"
		document.getElementById("Emin").value = 0
		document.getElementById("Emax").value = 98.439
		document.getElementById("filter_EDS").removeAttribute("class","hide");
		document.getElementById("filter_EELS").setAttribute("class", "hide");
		document.getElementById("tableEDS_body").innerHTML = ""
		tabulateData()
	}

	update()
	
}

function formatData(json_in){
	json_out = json_in // global

	eds_data = []; // global
	eels_data = []; // global

	eds_list = ["Ka1", "Ka2", "Kb1", "La1", "La2", "Lb1", "Lb2", "Lg1", "Ma1"]; //global
	eels_list = ["K", "L1", "L2", "L3", "M1", "M2", "M3", "M4", "M5", "N1", "N4","N5", "N6", "N7", "N23", "O1", "O23", "O45"]; //global

	// format eds data into long repr with .Z, .E, .descr
	for(let zt = 0; zt < json_in.length; zt++){

		for(const peak in json_in[zt].EDS){
			if(json_in[zt].EDS[peak]!== null){
				let peak_label = peak[0]
				if (peak[1] == "a") {
					peak_label += "α"
				}
				else if (peak[1] == "b") {
					peak_label += "β"
				}
				else if (peak[1] == "g") {
					peak_label += "γ"
				}
				peak_label += "<sub>"+peak[2]+"</sub>"
				eds_data.push({
					'Z':json_in[zt].Z,
					'E':(json_in[zt].EDS[peak]/1000).toFixed(3),
					'scattering':peak,
					'scattering_label': peak_label,
					'symbol':json_in[zt].Symbol,
					'descr':json_in[zt].Symbol +"-" + peak_label
				});
			}
		}

		for(const peak in json_in[zt].EELS){
			if(json_in[zt].EELS[peak]!== null){
				let peak_label
				if (peak.length == 1) {
					peak_label = peak
				} else if (peak.length == 2) {
					peak_label = peak[0] + "<sub>"+peak[1]+"</sub>"
				} else if (peak.length == 3) {
					peak_label = peak[0] + "<sub>"+peak[1]+","+peak[2]+"</sub>"
				}
				eels_data.push({
					'Z':json_in[zt].Z,
					'E':json_in[zt].EELS[peak],
					'scattering':peak,
					'scattering_label': peak_label,
					'symbol':json_in[zt].Symbol,
					'descr':json_in[zt].Symbol +"-" + peak_label
				});
			}
		}
		
	}


	mode = "EDS"
	spectrum_data = eds_data
	spectrum_list = eds_list
	document.getElementById("title").innerHTML = "<h2>EDS Energies</h2>"
	document.getElementById("filter_EDS").removeAttribute("class","hide");
	document.getElementById("filter_EELS").setAttribute("class", "hide");
	unit = "keV"
}

function getCheckedEdges(){
	// get list of edge checkboxes
	if (mode == "EDS") {
		var chkbox = document.querySelectorAll("#filter_EDS input[type='checkbox']");
	}
	else if (mode == "EELS") {
		var chkbox = document.querySelectorAll("#filter_EELS input[type='checkbox']");
	}
	var checked_edge = [];
	for (let it=0; it < chkbox.length; it ++){
		if (chkbox[it].checked){
			checked_edge.push( chkbox[it].name);
		}
	}
	return checked_edge;
}

function filterData( ){
	let checked_edge = getCheckedEdges();
	var filtered_data = [];
	for (let it=0; it < spectrum_data.length; it++){
		if (checked_edge.includes(spectrum_data[it].scattering)){
			filtered_data.push( spectrum_data[it] );
		}
	}
	visualizeData( filtered_data );
	tableFilterChange(checked_edge);
	//return filtered_data
}


function tabulateData(){
	let table_element = document.getElementById('tableEDS');
	let table_body = document.getElementById('tableEDS_body');
	//table_body.innerHTML = ""
	for(let it =0; it < spectrum_data.length; it++){
		//console.log(spectrum_data[it]);
		let row = table_body.insertRow();//document.createElement("tr");
		row.classList.add("filterablerow")
		// Element
		let td = row.insertCell();
		td.appendChild(document.createTextNode(spectrum_data[it].symbol));
		// Z
		td = row.insertCell();
		td.appendChild(document.createTextNode(spectrum_data[it].Z));
		//td.classList.add("Zentry");
		// Edge
		td = row.insertCell();
		//td.appendChild(document.createTextNode(eds_data[it].scattering_label));
		td.innerHTML = (spectrum_data[it].scattering_label)
		// E
		td = row.insertCell();
		td.appendChild(document.createTextNode(spectrum_data[it].E));
		td = row.insertCell();
		td.appendChild(document.createTextNode(spectrum_data[it].scattering));
		td.setAttribute("class","hide")
		//td.classList.add("Eentry");
		//table_element.appendChild(row);

	}

	//https://mottie.github.io/tablesorter/docs/
	$("#tableeds").tablesorter();

}


// based off of https://d3-graph-gallery.com/graph/interactivity_zoom.html and https://d3-graph-gallery.com/graph/scatter_tooltip.html
// should look in to https://wrobstory.github.io/2013/11/D3-brush-and-tooltip.html
// for a better (?) approach...
function visualizeData(formattedData){

	document.getElementById("plotEDS").innerHTML = "";

	var margin = {left: window.innerWidth*0.05, 
				  right: window.innerWidth*0.0,
				  top: window.innerWidth*0.0, 
				  bottom: window.innerHeight*0.05}

	if (window.innerWidth>=1000) {
		var width = window.innerWidth*0.6 - margin.left - margin.right
		var height = window.innerHeight*0.5;
	} else {
		var width = window.innerWidth*0.9 - margin.left - margin.right;
		var height = window.innerHeight*0.4;
	}


	var max_E = 0;
	for (let it = 0; it < formattedData.length; it++){

		if (formattedData[it].E > max_E){
			max_E = formattedData[it].E

		}
	}

    var default_extent_x = max_E;;
    var default_extent_y = 104;
	
	var color = d3.scaleOrdinal()
	    .domain( spectrum_list )
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


    svg = d3.select("#plotEDS")
  		.append("svg")
    	.attr("width", width + margin.left + margin.right)
    	.attr("height", height + margin.top + margin.bottom)
		.attr("id", "d3svg")
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
    var tooltipdiv = d3.select("#plotEDS").append("div")   
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
      	.style("fill", function (d) { return color(d.scattering) } ) //.style("fill", "gray")
      	.style("opacity", 1.)
      	.style("stroke","none")//.style("stroke", "white")
      	.on("mouseover", function(event,d) {      
           	tooltipdiv.transition()        
            .duration(200)      
            .style("opacity", 1.);      
            tooltipdiv .html(d.descr+ ": " + d.E + " eV")  
                        .style("left", (event.pageX+50) + "px")     
                        .style("top", (event.pageY +10) + "px")
                        .style("border-color",color(d.scattering));
            d3.select(this).style("fill", "white");    //.attr("r", 10)
            })                  
	    .on("mouseout", function(event,d) {       
	        tooltipdiv.transition()        
	            .duration(500)      
	            .style("opacity", 0);  
	        d3.select(this).style("fill", function (d) { return color(d.scattering) } ) //.style("fill", "gray"); 
	    });


	// Add X axis label:
	svg.append("text")
	    .attr("text-anchor", "middle")
	    .attr("x", width/2)
	    .attr("y", height + margin.top + 30)
	    .text("Energy ("+unit+")");

	// Y axis label:
	svg.append("text")
	    .attr("text-anchor", "middle")
	    .attr("transform", "rotate(-90)")
	    .attr("y", -margin.left+10)
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

		let Erange = x.domain()		
		document.getElementById("Emin").value = Erange[0]
		document.getElementById("Emax").value = Erange[1]
		console.log(x.domain())

		// Update axis and circle position
		xAxis.transition().duration(1000).call(d3.axisBottom(x))
		scatter
		  .selectAll("circle")
		  .transition().duration(1000)
		  .attr("cx", function (d) { return x(d.E); } )
		  .attr("cy", function (d) { return y(d.Z); } )


		tableFilterChange();

	}

}

//Note: if table columns are changed indices in setTrStyleDisplay will have to be changed!
// currently, column 1 : Z, column 4 : E
//todo
function tableFilterChange(checked_edge){
	if(checked_edge === undefined)
	{
		checked_edge = getCheckedEdges();
	}


	let Zmin = Number(document.getElementById("Zmin").value);
	let Zmax = Number(document.getElementById("Zmax").value);
	let Emin = Number(document.getElementById("Emin").value);
	let Emax = Number(document.getElementById("Emax").value);


	const trs = document.querySelectorAll('.filterablerow');
	tempglobal = trs;
	//console.log(trs)

	const setTrStyleDisplay = ({ style, children }) => {
		let thisEdge = children[4].childNodes[0].data;
		let thisZ = Number(children[1].childNodes[0].data);
		let thisE = Number(children[3].childNodes[0].data);

		let included_Z = (thisZ <= Zmax) && (thisZ >= Zmin);
		let included_E = (thisE <= Emax) && (thisE >= Emin);
		let included = included_E && included_Z;
		if(included_E && included_Z &&checked_edge.includes(thisEdge)){
			style.display = '';
		}
		else{
			style.display='none';
		}
	/*style.display = isFound([
	  ...children // <-- All columns
	]) ? '' : 'none' */
	}
	trs.forEach(setTrStyleDisplay)


}
