// js/9.Future_Activities/9.1Requested_Radionuclides_for_Future_PTs_and_RMs.js

// IMPORTANT: Verify this path carefully!
// This path is relative to the HTML file that loads this JS.
// Assuming your CSV is in the 'data' subfolder within your GitHub Pages project's root
const csvDataPath = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // Consistent CSV path

// Declare variables that will hold our processed data and state
let allSurveyData; // Will hold the loaded CSV data
let Requested_Radionuclides_for_Future_PTs_and_RMsCountsData;
let topRequested_Radionuclides_for_Future_PTs_and_RMssData;
let Requested_Radionuclides_for_Future_PTs_and_RMsToLabsMapData;
let selectedRequested_Radionuclides_for_Future_PTs_and_RMs = null; // Emulates Observable's mutable state

// --- Helper Functions ---

// Helper function to normalize strings for comparison (remove extra spaces, non-breaking spaces)
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').replace(/\u00A0/g, ' '); // Replace all whitespace with single space, remove non-breaking spaces
}

/**
 * Calculates the count of each Requested_Radionuclides_for_Future_PTs_and_RMs from the raw data.
 * @param {string} radionuclideColumn - The exact column name for radionuclides.
 * @returns {Array<Object>} An array of objects, { name: string, value: number }.
 */
const calculateRequested_Radionuclides_for_Future_PTs_and_RMsCounts = (radionuclideColumn) => {
    const counts = new Map();
    for (const row of allSurveyData) {
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
 * Gets the top N most frequently measured Requested_Radionuclides_for_Future_PTs_and_RMss.
 * @param {number} n - The number of top Requested_Radionuclides_for_Future_PTs_and_RMss to retrieve.
 * @returns {Array<Object>} Sorted array of top Requested_Radionuclides_for_Future_PTs_and_RMss.
 */
const getTopRequested_Radionuclides_for_Future_PTs_and_RMss = (n = 20) => {
    return Requested_Radionuclides_for_Future_PTs_and_RMsCountsData
        .slice() // Create a copy to avoid mutating the original array
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, n);
};

/**
 * Creates a map from Requested_Radionuclides_for_Future_PTs_and_RMs to a nested map of MemberState to Set of LabNames.
 * @param {string} radionuclideColumn - The exact column name for radionuclides.
 * @returns {Map<string, Map<string, Set<string>>>} The mapping.
 */
const createRequested_Radionuclides_for_Future_PTs_and_RMsToLabsMap = (radionuclideColumn) => {
    // Map: RadionuclideName -> Map<MemberState, Set<LabName>>
    const map = new Map();

    for (const row of allSurveyData) {
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
 * Creates the Requested_Radionuclides_for_Future_PTs_and_RMss Bar Chart.
 * @param {string} currentSelectedRequested_Radionuclides_for_Future_PTs_and_RMs - The currently selected Requested_Radionuclides_for_Future_PTs_and_RMs for highlighting.
 * @param {Function} onClickHandler - Callback function for bar clicks.
 * @returns {SVGElement} The D3 SVG node for the bar chart.
 */
const Requested_Radionuclides_for_Future_PTs_and_RMssBarChart = (currentSelectedRequested_Radionuclides_for_Future_PTs_and_RMs, onClickHandler) => {
    const width = 928;
    const height = 500;
    const margin = { top: 40, right: 20, bottom: 120, left: 60 }; // Increased bottom margin for labels

    const x = d3.scaleBand()
        .domain(topRequested_Radionuclides_for_Future_PTs_and_RMssData.map(d => d.name))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(topRequested_Radionuclides_for_Future_PTs_and_RMssData, d => d.value)]).nice()
        .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
        .domain(topRequested_Radionuclides_for_Future_PTs_and_RMssData.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topRequested_Radionuclides_for_Future_PTs_and_RMssData.length).reverse());

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`) // Set viewBox for responsiveness
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; cursor: pointer; display: block; margin: auto;");

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topRequested_Radionuclides_for_Future_PTs_and_RMssData)
        .join("rect")
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.value))
        .attr("height", d => y(0) - y(d.value))
        .attr("width", x.bandwidth())
        .attr("fill", d => d.name === currentSelectedRequested_Radionuclides_for_Future_PTs_and_RMs ? "#FFD700" : color(d.name)) // Highlight selected
        .attr("stroke", d => d.name === currentSelectedRequested_Radionuclides_for_Future_PTs_and_RMs ? "black" : "none") // Add border to selected
        .attr("stroke-width", d => d.name === currentSelectedRequested_Radionuclides_for_Future_PTs_and_RMs ? 2 : 0)
        .on("click", (event, d) => {
            onClickHandler(d.name); // Call the handler to update selectedRequested_Radionuclides_for_Future_PTs_and_RMs
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
 * Creates the Requested_Radionuclides_for_Future_PTs_and_RMss Treemap.
 * @param {string} currentSelectedRequested_Radionuclides_for_Future_PTs_and_RMs - The currently selected Requested_Radionuclides_for_Future_PTs_and_RMs for highlighting.
 * @param {Function} onClickHandler - Callback function for tile clicks.
 * @returns {SVGElement} The D3 SVG node for the treemap.
 */
const Requested_Radionuclides_for_Future_PTs_and_RMssTreemap = (currentSelectedRequested_Radionuclides_for_Future_PTs_and_RMs, onClickHandler) => {
    const width = 928;
    const height = 500;

    const data = {
        name: "Requested_Radionuclides_for_Future_PTs_and_RMss",
        children: topRequested_Radionuclides_for_Future_PTs_and_RMssData.map(d => ({ name: d.name, value: d.value }))
    };

    const color = d3.scaleOrdinal()
        .domain(topRequested_Radionuclides_for_Future_PTs_and_RMssData.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateBlues(t * 0.7 + 0.3), topRequested_Radionuclides_for_Future_PTs_and_RMssData.length).reverse());

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
        .attr("fill", d => d.data.name === currentSelectedRequested_Radionuclides_for_Future_PTs_and_RMs ? "#FFD700" : color(d.data.name)) // Highlight selected
        .attr("stroke", d => d.data.name === currentSelectedRequested_Radionuclides_for_Future_PTs_and_RMs ? "black" : "none") // Add border to selected
        .attr("stroke-width", d => d.data.name === currentSelectedRequested_Radionuclides_for_Future_PTs_and_RMs ? 2 : 0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .on("click", (event, d) => {
            onClickHandler(d.data.name); // Call the handler to update selectedRequested_Radionuclides_for_Future_PTs_and_RMs
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
 * Updates the display of labs measuring the selected Requested_Radionuclides_for_Future_PTs_and_RMs.
 */
const updateSelectedRequested_Radionuclides_for_Future_PTs_and_RMsLabs = () => {
    // Target the main chart display container
    const chartDisplayContainer = d3.select("#Requested_Radionuclides_for_Future_PTs_and_RMs-chart-display-container");

    // Remove any previously appended lab info div
    chartDisplayContainer.select(".lab-info-content").remove();

    // Create a new div specifically for the lab info within the chart container
    const labInfoDiv = chartDisplayContainer.append("div")
        .attr("class", "lab-info-content") // Add a class for styling and easy removal
        .style("margin-top", "20px") // Add some space below the charts
        .style("padding", "15px")
        .style("border", "1px solid #eee")
        .style("border-radius", "8px")
        .style("background", "#fff")
        .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)");


    if (!selectedRequested_Radionuclides_for_Future_PTs_and_RMs) {
        labInfoDiv.append("p").html("<em>Click on a chart element (bar or treemap tile) to see related labs.</em>");
        return;
    }

    const stateMap = Requested_Radionuclides_for_Future_PTs_and_RMsToLabsMapData.get(selectedRequested_Radionuclides_for_Future_PTs_and_RMs);

    if (!stateMap || stateMap.size === 0) {
        labInfoDiv.append("p").html(`No labs found for <strong>${selectedRequested_Radionuclides_for_Future_PTs_and_RMs}</strong>.`);
        return;
    }

    let totalLabs = 0;
    for (const labsSet of stateMap.values()) {
        totalLabs += labsSet.size;
    }

    const sortedStates = Array.from(stateMap.keys()).sort(d3.ascending);

    labInfoDiv.append("h4").html(`Labs that measure <strong>${selectedRequested_Radionuclides_for_Future_PTs_and_RMs}</strong> (${totalLabs} total)`);

    sortedStates.forEach(state => {
        const labsSet = stateMap.get(state);
        const sortedLabs = Array.from(labsSet).sort(d3.ascending);

        const stateDiv = labInfoDiv.append("div");
        stateDiv.append("h5").text(state).style("margin-top", "10px").style("margin-bottom", "5px"); // Smaller heading for states

        const ul = stateDiv.append("ul").style("list-style-type", "disc").style("margin-left", "20px");
        sortedLabs.forEach(lab => {
            ul.append("li").text(lab);
        });
    });
};

/**
 * Main function to render the charts based on selected checkboxes.
 * It clears the container and appends the selected charts.
 */
const renderCharts_Requested_Radionuclides_for_Future_PTs_and_RMs = () => {
    const chartDisplayContainer = d3.select("#Requested_Radionuclides_for_Future_PTs_and_RMs-chart-display-container");
    chartDisplayContainer.html(""); // Clear previous charts (including old lab info)

    const selectedCharts = Array.from(document.querySelectorAll('#Requested_Radionuclides_for_Future_PTs_and_RMs-chart-selection-container .chart-selector-Requested_Radionuclides_for_Future_PTs_and_RMs')).filter(cb => cb.checked).map(cb => cb.value);

    // Define a common click handler for both charts
    const chartClickHandler = (Requested_Radionuclides_for_Future_PTs_and_RMsName) => {
        selectedRequested_Radionuclides_for_Future_PTs_and_RMs = Requested_Radionuclides_for_Future_PTs_and_RMsName;
        // Re-render charts to apply highlight AND update lab info
        renderCharts_Requested_Radionuclides_for_Future_PTs_and_RMs();
    };

    if (selectedCharts.includes("Bar chart")) {
        const barChartSvg = Requested_Radionuclides_for_Future_PTs_and_RMssBarChart(selectedRequested_Radionuclides_for_Future_PTs_and_RMs, chartClickHandler);
        chartDisplayContainer.node().appendChild(barChartSvg);
    }

    if (selectedCharts.includes("Tree Map")) {
        const treemapSvg = Requested_Radionuclides_for_Future_PTs_and_RMssTreemap(selectedRequested_Radionuclides_for_Future_PTs_and_RMs, chartClickHandler);
        chartDisplayContainer.node().appendChild(treemapSvg);
    }

    // If no charts are selected, show a message
    if (selectedCharts.length === 0) {
        chartDisplayContainer.append("p").text("Please select at least one chart to display.");
    }

    // Always update lab info after charts are rendered (or message is displayed)
    updateSelectedRequested_Radionuclides_for_Future_PTs_and_RMsLabs();
};

// --- Data Loading and Initialization ---
d3.csv(csvDataPath).then(data => { // Use the globally defined csvDataPath
    allSurveyData = data; // Store the loaded data

    // Define the target column name for radionuclides
    const targetRadionuclideColumnName = "9.1 Requested radionuclides and matrices for future PTs and RMs ";

    // Robustly find the exact column name for radionuclides
    let foundRadionuclideColumn = null;
    const normalizedTargetRadionuclide = normalizeString(targetRadionuclideColumnName);

    for (const header of Object.keys(allSurveyData[0])) {
        if (normalizeString(header) === normalizedTargetRadionuclide) {
            foundRadionuclideColumn = header;
            break;
        }
    }

    if (!foundRadionuclideColumn) {
        console.error(`Initialization Error: Could not find a matching column for "${targetRadionuclideColumnName}" in the CSV data.`);
        console.error("Available headers (normalized for comparison):", Object.keys(allSurveyData[0]).map(normalizeString));
        d3.select("#Requested_Radionuclides_for_Future_PTs_and_RMs-chart-display-container").html("<p style='color: red;'>Failed to initialize charts: Radionuclide column not found. Check console for details.</p>");
        return;
    }
    console.log(`Successfully identified radionuclide column: "${foundRadionuclideColumn}" for processing.`);


    // Process data once after loading, passing the found column name
    Requested_Radionuclides_for_Future_PTs_and_RMsCountsData = calculateRequested_Radionuclides_for_Future_PTs_and_RMsCounts(foundRadionuclideColumn);
    topRequested_Radionuclides_for_Future_PTs_and_RMssData = getTopRequested_Radionuclides_for_Future_PTs_and_RMss(20); // Get top 20 for initial display
    Requested_Radionuclides_for_Future_PTs_and_RMsToLabsMapData = createRequested_Radionuclides_for_Future_PTs_and_RMsToLabsMap(foundRadionuclideColumn);

    // Attach event listeners to checkboxes for dynamic chart display
    document.querySelectorAll('.chart-selector-Requested_Radionuclides_for_Future_PTs_and_RMs').forEach(checkbox => {
        checkbox.addEventListener('change', renderCharts);
    });

    // Initial render of charts and lab info
    renderCharts(); // This will now also call updateSelectedRequested_Radionuclides_for_Future_PTs_and_RMsLabs
}).catch(error => {
    console.error("Error loading CSV data:", error);
    d3.select("#Requested_Radionuclides_for_Future_PTs_and_RMs-chart-display-container").html("<p style='color: red;'>Failed to load data. Please check the CSV file path and content.</p>");
});

document.addEventListener("DOMContentLoaded", () => {
    // This DOMContentLoaded listener is now primarily for ensuring the page is ready
    // before the d3.csv().then() block runs. The d3.csv itself is asynchronous.
    // The main initialization logic is within the d3.csv().then() block.
});
