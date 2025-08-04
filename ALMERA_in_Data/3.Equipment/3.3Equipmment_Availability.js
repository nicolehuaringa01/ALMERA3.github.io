// ALMERA_in_Data/3.Equipment/equipment-visualization.js

// Global variables to store processed data and selected state
let allSurveyData; // Will hold the loaded CSV data
let equipmentCountsData;
let topEquipmentData;
let equipmentToLabsMapData;
let selectedEquipment = null; // Emulates Observable's mutable state for selected equipment
let currentView = 'map'; // 'map' or 'list' - default view

// Helper function to normalize strings for comparison (remove extra spaces, non-breaking spaces)
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').replace(/\u00A0/g, ' ');
}

/**
 * Calculates the count of each equipment from the raw data.
 * @returns {Array<Object>} An array of objects, { name: string, value: number }.
 */
const calculateEquipmentCounts = () => {
    const counts = new Map();
    for (const row of allSurveyData) {
        if (row["Equipment total"]) {
            const equipments = row["Equipment total"].split(";").map(d => d.trim()).filter(d => d);
            for (const r of equipments) {
                counts.set(r, (counts.get(r) || 0) + 1);
            }
        }
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
};

/**
 * Gets the top N most frequently measured equipments.
 * @param {number} n - The number of top equipments to retrieve.
 * @returns {Array<Object>} Sorted array of top equipments.
 */
const getTopEquipments = (n = 7) => { // Default to 7 for pie chart, can be adjusted
    return equipmentCountsData
        .slice() // Create a copy to avoid mutating the original array
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, n);
};

/**
 * Creates a map from Equipment to a nested map of MemberState to LabName to Count.
 * @returns {Map<string, Map<string, Map<string, number>>>} The mapping.
 */
const createEquipmentToLabsMap = () => {
    // Map: EquipmentName -> Map<MemberState, Map<LabName, count>>
    const map = new Map();

    for (const row of allSurveyData) {
        const equipmentRaw = row["Equipment total"];
        const labName = row["1.1 Name of Laboratory"];
        const memberState = row["1.3 Member State"];

        if (!equipmentRaw || !labName || !memberState) continue;

        const equipments = equipmentRaw.split(";").map(e => e.trim()).filter(e => e);

        // Count equipment occurrences within this specific lab's row
        const counts = {};
        for (const equipment of equipments) {
            if (!counts[equipment]) counts[equipment] = 0;
            counts[equipment]++;
        }

        for (const [equipment, count] of Object.entries(counts)) {
            if (!map.has(equipment)) {
                map.set(equipment, new Map());
            }

            const stateMap = map.get(equipment);

            if (!stateMap.has(memberState)) {
                stateMap.set(memberState, new Map());
            }

            stateMap.get(memberState).set(labName, count); // Store the count
        }
    }
    return map;
};

/**
 * Creates the Equipments Pie Chart.
 * @param {Function} onClickHandler - Callback function for slice clicks.
 * @returns {SVGElement} The D3 SVG node for the pie chart.
 */
const createPieChart = (onClickHandler) => {
    const width = 928;
    const height = Math.min(width, 500);

    const totalEquipmentsCount = d3.sum(topEquipmentData, d => d.value);

    topEquipmentData.forEach(d => {
        d.percent = (totalEquipmentsCount > 0) ? (d.value / totalEquipmentsCount) : 0;
    });

    const color = d3.scaleOrdinal()
        .domain(topEquipmentData.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topEquipmentData.length).reverse());

    const pie = d3.pie()
        .sort(null)
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topEquipmentData);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; cursor: pointer; display: block; margin: auto;");

    svg.append("g")
        .attr("stroke", "white")
        .selectAll()
        .data(arcs)
        .join("path")
        .attr("fill", d => color(d.data.name))
        .attr("d", arc)
        .on("click", (event, d) => {
            onClickHandler(d.data.name); // Call the handler to update selectedEquipment
        })
        .append("title")
        .text(d => `${d.data.name}: ${(d.data.percent * 100).toFixed(1)}% (${d.data.value.toLocaleString("en-US")} systems)`);

    const legend = svg.append("g")
        .attr("transform", `translate(${width / 2 - 200}, ${-height / 2 + 20})`)
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .selectAll("g")
        .data(color.domain())
        .join("g")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .text(d => d);

    return svg.node();
};

/**
 * Renders the list view for selected equipment.
 */
const renderListView = () => {
    const container = d3.select("#lab-info-display-container");
    container.html(""); // Clear previous content

    if (!selectedEquipment) {
        container.append("p").html("<em>Click on a pie chart slice to see related labs in a list.</em>");
        return;
    }

    const stateMap = equipmentToLabsMapData.get(selectedEquipment);

    if (!stateMap || stateMap.size === 0) {
        container.append("p").html(`No labs found for <strong>${selectedEquipment}</strong>.`);
        return;
    }

    const ul = container.append("ul").style("list-style", "none").style("padding-left", "0");

    // Prepare a flat list of labs for sorting and display
    const labsForList = [];
    for (const [memberState, labsMap] of stateMap.entries()) {
        for (const [labName, count] of labsMap.entries()) {
             // Find the full row data to get other details like City
            const row = allSurveyData.find(r =>
                normalizeString(r["1.1 Name of Laboratory"]) === normalizeString(labName) &&
                normalizeString(r["1.3 Member State"]) === normalizeString(memberState)
            );
            if (row) {
                labsForList.push({
                    name: labName,
                    country: memberState,
                    city: row["City"], // Assuming 'City' column exists
                    equipmentCount: count
                });
            } else {
                labsForList.push({
                    name: labName,
                    country: memberState,
                    city: 'N/A',
                    equipmentCount: count
                });
            }
        }
    }

    // Sort labs alphabetically by country (Member State)
    labsForList.sort((a, b) => a.country.localeCompare(b.country));

    ul.selectAll("li")
        .data(labsForList)
        .join("li")
        .html(d => `<strong>${d.name}</strong> (${d.city ? d.city + ', ' : ''}${d.country}) - ${selectedEquipment}: <strong>${d.equipmentCount}</strong> systems`);
};


/**
 * Updates the map display of labs based on the selected equipment.
 */
async function renderMapView() {
    const container = d3.select("#lab-info-display-container");
    container.html(""); // Clear previous content

    if (!selectedEquipment) {
        container.append("p").html("<em>Click on a pie chart slice to see related labs on the map.</em>");
        return;
    }

    const stateMap = equipmentToLabsMapData.get(selectedEquipment);

    if (!stateMap || stateMap.size === 0) {
        container.append("p").html(`No labs found for <strong>${selectedEquipment}</strong>.`);
        return;
    }

    // Robustly find column names for geographic data and lab details
    let foundLongColumn = null;
    let foundLatColumn = null;
    let foundNameColumn = null;
    let foundStateColumn = null;
    let foundCityColumn = null;

    if (allSurveyData.length > 0) {
        const headers = Object.keys(allSurveyData[0]);
        const normalizedHeaders = headers.map(normalizeString);

        const targetLong = normalizeString("Long");
        const targetLat = normalizeString("Lat");
        const targetName = normalizeString("1.1 Name of Laboratory");
        const targetState = normalizeString("1.3 Member State");
        const targetCity = normalizeString("City");

        for (let i = 0; i < headers.length; i++) {
            if (normalizedHeaders[i] === targetLong) foundLongColumn = headers[i];
            if (normalizedHeaders[i] === targetLat) foundLatColumn = headers[i];
            if (normalizedHeaders[i] === targetName) foundNameColumn = headers[i];
            if (normalizedHeaders[i] === targetState) foundStateColumn = headers[i];
            if (normalizedHeaders[i] === targetCity) foundCityColumn = headers[i];
        }
    }

    if (!foundLongColumn || !foundLatColumn || !foundNameColumn || !foundStateColumn || !foundCityColumn) {
        console.error("Map Error: Missing required columns (Long, Lat, 1.1 Name of Laboratory, 1.3 Member State, City) in CSV.");
        container.append("p").html("<span style='color:red;'>Error: Geographic data or lab details missing in CSV. Cannot display map.</span>");
        return;
    }

    const labsForMap = [];
    for (const [memberState, labsMap] of stateMap.entries()) {
        for (const [labName, count] of labsMap.entries()) {
            const row = allSurveyData.find(r =>
                normalizeString(r[foundNameColumn]) === normalizeString(labName) &&
                normalizeString(r[foundStateColumn]) === normalizeString(memberState)
            );

            if (row) {
                const longitude = +row[foundLongColumn];
                const latitude = +row[foundLatColumn];
                const city = row[foundCityColumn];

                if (!isNaN(longitude) && !isNaN(latitude)) {
                    labsForMap.push({
                        name: labName,
                        country: memberState,
                        city: city, // Include city for tooltip
                        longitude: longitude,
                        latitude: latitude,
                        equipmentCount: count // Include equipment count
                    });
                } else {
                    console.warn(`Skipping lab ${labName} (${memberState}) due to invalid Long/Lat: ${row[foundLongColumn]}, ${row[foundLatColumn]}`);
                }
            } else {
                console.warn(`Could not find full data row for lab: ${labName} in ${memberState}`);
            }
        }
    }

    if (labsForMap.length === 0) {
        container.append("p").html(`No labs with valid geographic data found for <strong>${selectedEquipment}</strong>.`);
        return;
    }

    // --- Map Rendering Logic ---
    const width = container.node().clientWidth; // Make map responsive to its container width
    const height = 500;
    const topojsonPath = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json"; // Path to world TopoJSON

    let world;
    try {
        world = await d3.json(topojsonPath);
    } catch (error) {
        console.error("Error loading TopoJSON data:", error);
        container.append("p").html("<span style='color:red;'>Error: Failed to load world map data from CDN. Check network connection or CDN availability.</span>");
        return;
    }

    const land = topojson.feature(world, world.objects.land);

    const projection = d3.geoEquirectangular().fitSize([width, height], land);
    const path = d3.geoPath().projection(projection);

    const svg = d3.create("svg")
        .attr("width", "100%") // Make SVG responsive to its container width
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`) // Maintain aspect ratio
        .style("background", "white")
        .style("display", "block"); // Ensure it behaves like a block element

    const g = svg.append("g"); // Group for zoomable content

    // Draw continents
    g.append("path")
        .datum(land)
        .attr("fill", "#9fc5e8") // Light blue for land
        .attr("stroke", "#9fc5e8") // Border color
        .attr("d", path);

    // Scale for dot radius based on equipment count
    const maxEquipmentCount = d3.max(labsForMap, d => d.equipmentCount);
    const radiusScale = d3.scaleSqrt()
                            .domain([1, maxEquipmentCount || 1]) // Handle case where max is 0 or undefined
                            .range([4, 20]); // Min and Max radius for dots

    // Draw lab dots
    g.selectAll("circle")
        .data(labsForMap)
        .enter()
        .append("circle")
        .attr("cx", d => {
            const projected = projection([d.longitude, d.latitude]);
            return projected ? projected[0] : -1000; // Handle null projection gracefully
        })
        .attr("cy", d => {
            const projected = projection([d.longitude, d.latitude]);
            return projected ? projected[1] : -1000; // Handle null projection gracefully
        })
        .attr("r", d => radiusScale(d.equipmentCount)) // Use scaled radius
        .attr("fill", "#0b5394") // Dark blue for dots
        .attr("stroke", "#0b5394")
        .append("title")
        .text(d => `${d.name} (${d.city ? d.city + ', ' : ''}${d.country}) - ${selectedEquipment}: ${d.equipmentCount} systems`); // Tooltip with bolded count. Note: Native tooltips do not support HTML bolding.

    // Add a legend for the dot size
    const legendData = [1, Math.ceil(maxEquipmentCount / 2), maxEquipmentCount].filter(d => d > 0);
    const legendX = 20; // X position for the legend
    const legendY = height - 120; // Y position for the legend

    const legendGroup = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${legendX}, ${legendY})`);

    legendGroup.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text("Equipment Count");

    legendGroup.selectAll(".legend-circle")
        .data(legendData)
        .enter().append("circle")
        .attr("class", "legend-circle")
        .attr("cx", d => 0)
        .attr("cy", d => -radiusScale(d) - 10) // Position based on radius
        .attr("r", d => radiusScale(d))
        .attr("fill", "#0b5394")
        .attr("stroke", "#0b5394");

    legendGroup.selectAll(".legend-text")
        .data(legendData)
        .enter().append("text")
        .attr("class", "legend-text")
        .attr("x", 25)
        .attr("y", d => -radiusScale(d) - 10)
        .attr("dy", "0.35em")
        .attr("font-size", "10px")
        .text(d => d);

    // Zoom behavior
    svg.call(d3.zoom()
        .scaleExtent([1, 8]) // Allow zooming from 1x to 8x
        .on("zoom", (event) => {
            g.attr("transform", event.transform); // Apply zoom transform to the group
            // Adjust radius based on zoom scale to keep visual size relatively consistent
            g.selectAll("circle")
                .attr("r", d => radiusScale(d.equipmentCount) / event.transform.k);
        })
    );

    container.node().appendChild(svg.node());
}

/**
 * Updates the display based on the current view selection.
 */
const updateLabInfoDisplay = () => {
    if (currentView === 'map') {
        renderMapView();
    } else {
        renderListView();
    }
};

// --- Data Loading and Initialization ---
d3.csv("/ALMERA3.github.io/data/Observable2020Survey.csv").then(data => {
    allSurveyData = data; // Assign loaded data to the global variable

    // Process data using the helper functions
    equipmentCountsData = calculateEquipmentCounts();
    topEquipmentData = getTopEquipments(7); // Get top 7 for the pie chart
    equipmentToLabsMapData = createEquipmentToLabsMap();

    // Define a common click handler for the pie chart
    const pieChartClickHandler = (equipmentName) => {
        selectedEquipment = equipmentName;
        updateLabInfoDisplay(); // Update the display based on current view
    };

    // Render the pie chart
    const pieChartSvg = createPieChart(pieChartClickHandler);
    d3.select("#chart-container").node().appendChild(pieChartSvg);

    // Attach event listener to the view toggle checkbox
    d3.select("#view-toggle").on("change", function() {
        currentView = this.checked ? 'list' : 'map';
        updateLabInfoDisplay(); // Re-render based on new view
    });

    // Initial call to update the lab info display, showing instructions initially
    updateLabInfoDisplay();

}).catch(error => {
    console.error("Error loading CSV data:", error);
    d3.select("#chart-container").html("<p style='color: red;'>Failed to load data. Please check the CSV file path and content.</p>");
    d3.select("#lab-info-display-container").html("<p style='color: red;'>Failed to load map/list data.</p>");
});
