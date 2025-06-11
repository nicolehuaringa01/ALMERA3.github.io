// js/radionuclides-visualization.js

// This global variable will store the data after it's loaded.
// It needs to be accessible to all functions that process or use the data.
let rawSurveyData = [];

// This will hold the currently selected radionuclide from the pie chart.
let selectedRadionuclide = null;

// This will hold the currently selected chart types from the checkboxes.
let selectedCharts = ["Bar chart"]; // Default selection

// ----------------------------------------------------------------------
// Data Processing Functions (Adapted from Observable cells)
// ----------------------------------------------------------------------

// Function to count occurrences of each radionuclide from the raw data
const getRadionuclideCounts = () => {
    const counts = new Map();
    for (const row of rawSurveyData) {
        if (row["EasyRadionuclides"]) {
            const radionuclides = row["EasyRadionuclides"].split(";").map(d => d.trim());
            for (const r of radionuclides) {
                counts.set(r, (counts.get(r) || 0) + 1);
            }
        }
    }
    // Convert Map to an array of objects for D3
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
};

// Function to get the top N radionuclides
const getTopRadionuclides = () => {
    // Call getRadionuclideCounts to get the full list, then sort and slice
    return getRadionuclideCounts()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, 7); // Assuming you want top 7, adjust as needed
};

// Function to create a map of radionuclides to labs and their counts by state
const getRadionuclideToLabsMap = () => {
    const map = new Map();

    for (const row of rawSurveyData) {
        const radionuclideRaw = row["EasyRadionuclides"]; // Corrected variable name
        const labName = row["1.1 Name of Laboratory"];
        const memberState = row["1.3 Member State"];

        // Ensure all necessary data points exist for the current row
        if (!radionuclideRaw || !labName || !memberState) continue;

        const radionuclides = radionuclideRaw.split(";").map(e => e.trim()); // Corrected variable name

        // Count radionuclide occurrences within this row
        const counts = {};
        for (const r of radionuclides) { // Corrected loop variable name
            if (!counts[r]) counts[r] = 0;
            counts[r]++;
        }

        for (const [radionuclide, count] of Object.entries(counts)) { // Corrected variable name
            // If the radionuclide is not yet in the map, add it with a new Map for states
            if (!map.has(radionuclide)) map.set(radionuclide, new Map());

            const stateMap = map.get(radionuclide);

            // If the member state is not yet in its map, add it with a new Map for labs
            if (!stateMap.has(memberState)) stateMap.set(memberState, new Map());

            // Add/update lab name and count for this state
            stateMap.get(memberState).set(labName, count);
        }
    }
    return map;
};


// ----------------------------------------------------------------------
// Chart Rendering Functions
// ----------------------------------------------------------------------

// Function to create and render the Radionuclides Pie Chart
const createRadionuclidesPieChart = () => {
    const topRadionuclidesData = getTopRadionuclides(); // Get data for the chart

    const width = 928;
    const height = Math.min(width, 500);

    const color = d3.scaleOrdinal()
        .domain(topRadionuclidesData.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topRadionuclidesData.length).reverse());

    const pie = d3.pie()
        .sort(null)
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topRadionuclidesData);

    // Clear previous chart before rendering a new one
    d3.select("#radionuclides-chart-container").html("");

    const svg = d3.select("#radionuclides-chart-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; cursor: pointer;");

    svg.append("g")
        .attr("stroke", "white")
        .selectAll()
        .data(arcs)
        .join("path")
        .attr("fill", d => color(d.data.name))
        .attr("d", arc)
        .on("click", (event, d) => {
            selectedRadionuclide = d.data.name; // Update the global selected radionuclide
            updateRadionuclideLabInfo(); // Update the lab info section
            updateChartDisplay(); // Re-render dynamic charts based on new selection
        })
        .append("title")
        .text(d => `${d.data.name}: ${d.data.value.toLocaleString("en-US")}`);

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

    // No need to return svg.node() as we directly appended it to the DOM
};

// Function to update the Lab Info section based on selectedRadionuclide
const updateRadionuclideLabInfo = () => {
    const selected = selectedRadionuclide;
    const container = d3.select("#lab-info-container");
    const radionuclideLabsMap = getRadionuclideToLabsMap(); // Get the map

    container.html(""); // Clear previous content

    if (!selected) {
        container.append("p").html("<em>Click on a pie slice to see associated labs.</em>");
        return;
    }

    const stateMap = radionuclideLabsMap.get(selected);

    if (!stateMap || stateMap.size === 0) {
        container.append("p").html(`No labs found for <strong>${selected}</strong>.`);
        return;
    }

    let totalLabs = 0;
    for (const labsMap of stateMap.values()) {
        totalLabs += labsMap.size;
    }

    const sortedStates = Array.from(stateMap.keys()).sort(d3.ascending);

    const div = container.append("div");

    div.append("h3").html(`Labs with <strong>${selected}</strong> (${totalLabs} total)`);

    sortedStates.forEach(state => {
        const labsMap = stateMap.get(state);
        // Sort labs by name for consistent display
        const sortedLabs = Array.from(labsMap.entries()).sort((a, b) => d3.ascending(a[0], b[0]));

        const stateDiv = div.append("div");
        stateDiv.append("h4").text(state);

        const ul = stateDiv.append("ul");
        sortedLabs.forEach(([lab, count]) => {
            ul.append("li").text(`${lab} (${count})`);
        });
    });
};

// ----------------------------------------------------------------------
// Placeholder Chart Functions (for Bar Chart and Treemap)
// These need to be filled with your actual D3 code for those charts.
// They should accept data and selectedRadionuclide as arguments if they
// depend on it. For now, they return simple SVG elements.
// ----------------------------------------------------------------------

const createRadionuclidesBarChart = (data, selectedRadionuclide) => {
    const width = 450;
    const height = 300;
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("font-family", "sans-serif")
        .attr("font-size", 10);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text(`Bar Chart for: ${selectedRadionuclide || 'All Radionuclides'} (Placeholder)`);

    // Add actual D3 bar chart rendering logic here, using 'data' if needed
    // You'd typically filter 'data' based on 'selectedRadionuclide'

    return svg.node();
};

const createRadionuclidesTreemap = (data, selectedRadionuclide) => {
    const width = 450;
    const height = 300;
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("font-family", "sans-serif")
        .attr("font-size", 10);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text(`Treemap for: ${selectedRadionuclide || 'All Radionuclides'} (Placeholder)`);

    // Add actual D3 treemap rendering logic here, using 'data' if needed
    // You'd typically filter 'data' based on 'selectedRadionuclide'

    return svg.node();
};


// ----------------------------------------------------------------------
// Dynamic Chart Display Logic
// ----------------------------------------------------------------------

const updateChartDisplay = () => {
    const container = d3.select("#chart-display-container");
    container.html(""); // Clear previous content

    const topRadionuclidesData = getTopRadionuclides(); // Data for these charts

    if (selectedCharts.includes("Bar chart")) {
        const barChart = createRadionuclidesBarChart(topRadionuclidesData, selectedRadionuclide);
        container.node().appendChild(barChart);
    }

    if (selectedCharts.includes("Tree Map")) {
        const treeMap = createRadionuclidesTreemap(topRadionuclidesData, selectedRadionuclide);
        container.node().appendChild(treeMap);
    }

    // If no charts are selected, you might want to display a message
    if (selectedCharts.length === 0) {
        container.append("p").html("<em>Select at least one chart type to display.</em>");
    }
};

// ----------------------------------------------------------------------
// Initialization: Load Data and Set Up Event Listeners
// ----------------------------------------------------------------------

// Load the CSV data when the script runs
d3.csv("observable2020SurveyUpdatedData2025.csv").then(data => {
    rawSurveyData = data; // Store the loaded data globally

    // Initial render of the pie chart
    createRadionuclidesPieChart();

    // Initial render of the lab info (will show "Nothing to show yet" initially)
    updateRadionuclideLabInfo();

    // Initial render of the dynamic charts
    updateChartDisplay();

    // Set up event listener for the chart selection checkboxes
    d3.selectAll(".chart-selector").on("change", function() {
        selectedCharts = Array.from(d3.selectAll(".chart-selector:checked").nodes()).map(cb => cb.value);
        updateChartDisplay(); // Re-render the dynamic charts
    });

}).catch(error => {
    // Basic error handling for CSV loading
    console.error("Error loading CSV data:", error);
    d3.select("body").append("p").attr("style", "color: red;").text("Failed to load data. Please check the CSV file path and content.");
});
