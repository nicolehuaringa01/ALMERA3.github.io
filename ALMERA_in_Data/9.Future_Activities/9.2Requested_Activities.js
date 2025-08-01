// ALMERA_in_Data/9.Future_Activities/9.2Requested_Activities

const csvDataPath2 = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // Consistent CSV path
const topojsonPath2 = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json";

// Declare variables that will hold our processed data and state
let allSurveyData_Requested_Activities; // Will hold the loaded CSV data
let Requested_ActivitiesCountsData;
let topRequested_ActivitiessData;
let Requested_ActivitiesToLabsMapData;
let selectedRequested_Activities = null; // Emulates Observable's mutable state

// --- Helper Functions ---

// Helper function to normalize strings for comparison (remove extra spaces, non-breaking spaces)
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').replace(/\u00A0/g, ' '); // Replace all whitespace with single space, remove non-breaking spaces
}

/**
 * Calculates the count of each Requested_Activities from the raw data.
 * @param {string} radionuclideColumn - The exact column name for radionuclides.
 * @returns {Array<Object>} An array of objects, { name: string, value: number }.
 */
const calculateRequested_ActivitiesCounts = (radionuclideColumn) => {
    const counts = new Map();
    for (const row of allSurveyData_Requested_Activities) {
        if (row[radionuclideColumn]) { // Use the passed column name
            const radionuclides = row[radionuclideColumn].split(";").map(d => d.trim()).filter(d => d); // Filter out empty strings
            for (const r of radionuclides) {
                counts.set(r, (counts.get(r) || 0) + 1);
            }
        }
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
};

/**
 * Gets the top N most frequently measured Requested_Activitiess.
 * @param {number} n - The number of top Requested_Activitiess to retrieve.
 * @returns {Array<Object>} Sorted array of top Requested_Activitiess.
 */
const getTopRequested_Activitiess = (n = 5) => {
    return Requested_ActivitiesCountsData
        .slice() // Create a copy to avoid mutating the original array
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, n);
};

/**
 * Creates a map from Requested_Activities to a nested map of MemberState to Set of LabNames.
 * @param {string} radionuclideColumn - The exact column name for radionuclides.
 * @returns {Map<string, Map<string, Set<string>>>} The mapping.
 */
const createRequested_ActivitiesToLabsMap = (radionuclideColumn) => {
    // Map: RadionuclideName -> Map<MemberState, Set<LabName>>
    const map = new Map();

    for (const row of allSurveyData_Requested_Activities) {
        const radionuclidesRaw = row[radionuclideColumn]; // Use the dynamically found column name
        const labName = row["1.1 Name of Laboratory"];
        const memberState = row["1.3 Member State"];

        if (!radionuclidesRaw || !labName || !memberState) continue; // Skip if essential data is missing

        const radionuclides = radionuclidesRaw.split(";").map(e => e.trim()).filter(e => e); // Split, trim, and filter out empty strings

        for (const radionuclide of radionuclides) {
            if (!map.has(radionuclide)) {
                map.set(radionuclide, new Map()); // Initialize Map for this radionuclide
            }

            const stateMap = map.get(radionuclide);

            if (!stateMap.has(memberState)) {
                stateMap.set(memberState, new Set()); // Initialize Set for labs in this state
            }

            stateMap.get(memberState).add(labName); // Add lab to the Set for its state
        }
    }
    return map;
};

/**
 * Creates the Requested_Activitiess Bar Chart.
 * @param {string} currentSelectedRequested_Activities - The currently selected Requested_Activities for highlighting.
 * @param {Function} onClickHandler - Callback function for bar clicks.
 * @returns {SVGElement} The D3 SVG node for the bar chart.
 */
const Requested_ActivitiessBarChart = (currentSelectedRequested_Activities, onClickHandler) => {
    const width = 928;
    const height = 500;
    const margin = { top: 40, right: 20, bottom: 120, left: 60 }; // Increased bottom margin for labels

    const x = d3.scaleBand()
        .domain(topRequested_ActivitiessData.map(d => d.name))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(topRequested_ActivitiessData, d => d.value)]).nice()
        .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
        .domain(topRequested_ActivitiessData.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topRequested_ActivitiessData.length).reverse());

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`) // Set viewBox for responsiveness
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; cursor: pointer; display: block; margin: auto;");

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topRequested_ActivitiessData)
        .join("rect")
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.value))
        .attr("height", d => y(0) - y(d.value))
        .attr("width", x.bandwidth())
        .attr("fill", d => d.name === currentSelectedRequested_Activities ? "#FFD700" : color(d.name)) // Highlight selected
        .attr("stroke", d => d.name === currentSelectedRequested_Activities ? "black" : "none") // Add border to selected
        .attr("stroke-width", d => d.name === currentSelectedRequested_Activities ? 2 : 0)
        .on("click", (event, d) => {
            onClickHandler(d.name); // Call the handler to update selectedRequested_Activities
        })
        .append("title")
        .text(d => `${d.name}: ${d.value.toLocaleString("en-US")}`);

    // X Axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px"); // Ensure label readability

    // Y Axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove());

    // Y Axis Label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${margin.left / 2}, ${height / 2}) rotate(-90)`)
        .text("Count")
        .attr("font-size", "12px"); // Adjust label font size

    return svg.node();
};

/**
 * Creates the Requested_Activitiess Treemap.
 * @param {string} currentSelectedRequested_Activities - The currently selected Requested_Activities for highlighting.
 * @param {Function} onClickHandler - Callback function for tile clicks.
 * @returns {SVGElement} The D3 SVG node for the treemap.
 */
const Requested_ActivitiessTreemap = (currentSelectedRequested_Activities, onClickHandler) => {
    const width = 928;
    const height = 500;

    const data = {
        name: "Requested_Activitiess",
        children: topRequested_ActivitiessData.map(d => ({ name: d.name, value: d.value }))
    };

    const color = d3.scaleOrdinal()
        .domain(topRequested_ActivitiessData.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateBlues(t * 0.7 + 0.3), topRequested_ActivitiessData.length).reverse());

    const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    d3.treemap()
        .size([width, height])
        .padding(2)(root);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`) // Set viewBox for responsiveness
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; display: block; margin: auto;");

    const node = svg.selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    node.append("rect")
        .attr("id", d => d.data.name.replace(/\s/g, '-')) // Use a valid ID for HTML
        .attr("fill", d => d.data.name === currentSelectedRequested_Activities ? "#FFD700" : color(d.data.name)) // Highlight selected
        .attr("stroke", d => d.data.name === currentSelectedRequested_Activities ? "black" : "none") // Add border to selected
        .attr("stroke-width", d => d.data.name === currentSelectedRequested_Activities ? 2 : 0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .on("click", (event, d) => {
            onClickHandler(d.data.name); // Call the handler to update selectedRequested_Activities
        })
        .append("title")
        .text(d => `${d.data.name}: ${d.data.value.toLocaleString("en-US")}`);

    node.append("text")
        .attr("x", 4)
        .attr("y", 14)
        .text(d => {
            const rectWidth = d.x1 - d.x0;
            // Only display text if there's enough space to avoid overlap
            if (rectWidth > 30) { // Arbitrary threshold
                return d.data.name;
            }
            return "";
        })
        .attr("fill", "white")
        .attr("font-size", "10px")
        .attr("pointer-events", "none"); // Allow click to pass through text to rect

    return svg.node();
};

/**
 * Updates the display of labs measuring the selected Requested_Activities.
 * This function now renders a map of labs instead of a list.
 */
const updateSelectedRequested_ActivitiesLabs = async () => {
    const chartDisplayContainer = d3.select("#Requested_Activities-chart-display-container");

    // Remove any previously appended map or info div
    chartDisplayContainer.select(".lab-map-content").remove();

    // Create a new div specifically for the map/info within the chart container
    const mapInfoDiv = chartDisplayContainer.append("div")
        .attr("class", "lab-map-content") // Add a class for styling and easy removal
        .style("margin-top", "20px")
        .style("padding", "15px")
        .style("border", "1px solid #eee")
        .style("border-radius", "8px")
        .style("background", "#fff")
        .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)");


    if (!selectedRequested_Activities) {
        mapInfoDiv.append("p").html("<em>Click on a chart element (bar or treemap tile) to see related labs on the map.</em>");
        return;
    }

    const stateMap = Requested_ActivitiesToLabsMapData.get(selectedRequested_Activities);

    if (!stateMap || stateMap.size === 0) {
        mapInfoDiv.append("p").html(`No labs found for <strong>${selectedRequested_Activities}</strong>.`);
        return;
    }

    // Prepare labs data for the map
    const labsForMap = [];
    const nameColumn = "1.1 Name of Laboratory";
    const stateColumn = "1.3 Member State";
    const longColumn = "Long"; // Assuming these are the column names in your CSV
    const latColumn = "Lat";

    // Robustly find the exact column names for Long and Lat
    let foundLongColumn = null;
    let foundLatColumn = null;
    let foundNameColumn = null;
    let foundStateColumn = null;

    if (allSurveyData_Requested_Activities.length > 0) {
        const headers = Object.keys(allSurveyData_Requested_Activities[0]);
        const normalizedHeaders = headers.map(normalizeString);

        const targetLong = normalizeString(longColumn);
        const targetLat = normalizeString(latColumn);
        const targetName = normalizeString(nameColumn);
        const targetState = normalizeString(stateColumn);

        for (let i = 0; i < headers.length; i++) {
            if (normalizedHeaders[i] === targetLong) foundLongColumn = headers[i];
            if (normalizedHeaders[i] === targetLat) foundLatColumn = headers[i];
            if (normalizedHeaders[i] === targetName) foundNameColumn = headers[i];
            if (normalizedHeaders[i] === targetState) foundStateColumn = headers[i];
        }
    }

    if (!foundLongColumn || !foundLatColumn || !foundNameColumn || !foundStateColumn) {
        console.error("Map Error: Missing 'Long', 'Lat', '1.1 Name of Laboratory', or '1.3 Member State' columns in CSV.");
        mapInfoDiv.append("p").html("<span style='color:red;'>Error: Geographic data (Longitude/Latitude, Lab Name, or Member State) missing in CSV. Cannot display map.</span></span>");
        return;
    }


    for (const [memberState, labsSet] of stateMap.entries()) {
        for (const labName of labsSet) {
            // Find the original row in allSurveyData to get Long/Lat
            const row = allSurveyData_Requested_Activities.find(r =>
                normalizeString(r[foundNameColumn]) === normalizeString(labName) &&
                normalizeString(r[foundStateColumn]) === normalizeString(memberState) &&
                r[foundLongColumn] !== undefined && r[foundLatColumn] !== undefined // Ensure Long/Lat exist
            );

            if (row) {
                const longitude = +row[foundLongColumn];
                const latitude = +row[foundLatColumn];

                if (!isNaN(longitude) && !isNaN(latitude)) {
                    labsForMap.push({
                        name: labName,
                        country: memberState,
                        longitude: longitude,
                        latitude: latitude
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
        mapInfoDiv.append("p").html(`No labs with valid geographic data found for <strong>${selectedRequested_Activities}</strong>.`);
        return;
    }

    // --- Map Rendering Logic ---
    const width = 900;
    const height = 500;

    let world;
    try {
        world = await d3.json(topojsonPath2); // This is where the .json file is loaded from CDN
    } catch (error) {
        console.error("Error loading TopoJSON data:", error);
        mapInfoDiv.append("p").html("<span style='color:red;'>Error: Failed to load world map data from CDN. Check network connection or CDN availability.</span>");
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

    // Draw lab dots
    g.selectAll("circle")
        .data(labsForMap)
        .enter()
        .append("circle")
        .attr("cx", d => projection([d.longitude, d.latitude]) ? projection([d.longitude, d.latitude])[0] : -1000) // Handle null projection gracefully
        .attr("cy", d => projection([d.longitude, d.latitude]) ? projection([d.longitude, d.latitude])[1] : -1000) // Handle null projection gracefully
        .attr("r", 4)
        .attr("fill", "#0b5394") // Dark blue for dots
        .attr("stroke", "#0b5394")
        .append("title")
        .text(d => `${d.name} (${d.country})`);

    // Zoom behavior
    svg.call(d3.zoom()
        .scaleExtent([1, 8]) // Allow zooming from 1x to 8x
        .on("zoom", (event) => {
            g.attr("transform", event.transform); // Apply zoom transform to the group
            // Adjust radius based on zoom scale
            g.selectAll("circle")
                .attr("r", 4 / event.transform.k);
        })
    );

    mapInfoDiv.node().appendChild(svg.node());
};

/**
 * Main function to render the charts based on selected checkboxes.
 * It clears the container and appends the selected charts.
 */
const renderCharts_Requested_Activities = () => {
    const chartDisplayContainer = d3.select("#Requested_Activities-chart-display-container");
    chartDisplayContainer.html(""); // Clear previous charts (and old map/info)

    // Target checkboxes specific to section 9.2
    const selectedCharts = Array.from(document.querySelectorAll('#Requested_Activities-chart-selection-container .chart-selector-Requested_Activities')).filter(cb => cb.checked).map(cb => cb.value);

    // Define a common click handler for both charts
    const chartClickHandler = (Requested_ActivitiesName) => {
        selectedRequested_Activities = Requested_ActivitiesName;
        // Re-render charts to apply highlight AND update lab map
        renderCharts_Requested_Activities();
    };

    if (selectedCharts.includes("Bar chart")) {
        const barChartSvg = Requested_ActivitiessBarChart(selectedRequested_Activities, chartClickHandler);
        chartDisplayContainer.node().appendChild(barChartSvg);
    }

    if (selectedCharts.includes("Tree Map")) {
        const treemapSvg = Requested_ActivitiessTreemap(selectedRequested_Activities, chartClickHandler);
        chartDisplayContainer.node().appendChild(treemapSvg);
    }

    // If no charts are selected, show a message
    if (selectedCharts.length === 0) {
        chartDisplayContainer.append("p").text("Please select at least one chart to display.");
    }

    // Always update lab map after charts are rendered (or message is displayed)
    updateSelectedRequested_ActivitiesLabs();
};

// --- Data Loading and Initialization ---
d3.csv(csvDataPath2).then(data => {
    allSurveyData_Requested_Activities = data;

    // Define the target column name for radionuclides for 9.2
    const targetRadionuclideColumnName = "9.2 Requested activities to be organised by the ALMERA network"; // **VERIFY THIS COLUMN NAME**

    let foundRadionuclideColumn = null;
    const normalizedTargetRadionuclide = normalizeString(targetRadionuclideColumnName);

    for (const header of Object.keys(allSurveyData_Requested_Activities[0])) {
        if (normalizeString(header) === normalizedTargetRadionuclide) {
            foundRadionuclideColumn = header;
            break;
        }
    }

    if (!foundRadionuclideColumn) {
        console.error(`Initialization Error (9.2): Could not find a matching column for "${targetRadionuclideColumnName}" in the CSV data.`);
        console.error("Available headers (normalized for comparison):", Object.keys(allSurveyData_Requested_Activities[0]).map(normalizeString));
        d3.select("#Requested_Activities-chart-display-container").html("<p style='color: red;'>Failed to initialize charts: Radionuclide column not found. Check console for details.</p>");
        return;
    }
    console.log(`Successfully identified radionuclide column (9.2): "${foundRadionuclideColumn}" for processing.`);


    Requested_ActivitiesCountsData = calculateRequested_ActivitiesCounts(foundRadionuclideColumn);
    topRequested_ActivitiessData = getTopRequested_Activitiess(5); // Get top 5 for initial display
    Requested_ActivitiesToLabsMapData = createRequested_ActivitiesToLabsMap(foundRadionuclideColumn);

    // Attach event listeners to checkboxes specific to section 9.2
    document.querySelectorAll('#Requested_Activities-chart-selection-container .chart-selector-Requested_Activities').forEach(checkbox => {
        checkbox.addEventListener('change', renderCharts_Requested_Activities);
    });

    // Initial render for 9.2
    renderCharts_Requested_Activities();
}).catch(error => {
    console.error("Error loading CSV data for 9.2:", error);
    d3.select("#Requested_Activities-chart-display-container").html("<p style='color: red;'>Failed to load data for 9.2. Please check the CSV file path and content.</p>");
});
