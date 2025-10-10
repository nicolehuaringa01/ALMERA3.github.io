// Declare variables specific to RadMethod visualization
let allRadMethodSurveyData; // Will hold the loaded CSV data (same as radionuclides, but processed here)
let radMethodCountsData;
let topRadMethodData;
let radMethodToLabsMapData;
let selectedRadMethod = null; // Emulates Observable's mutable state for this section

/**
 * Calculates the count of each radioanalytical method from the raw data.
 * @returns {Array<Object>} An array of objects, { name: string, value: number }.
 */
const calculateRadMethodCounts = () => {
    const counts = new Map();
    for (const row of allRadMethodSurveyData) {
        if (row["5.3 Radioanalytical methods used to analyse the samples collected for monitoring purposes"]) {
            const methods = row["5.3 Radioanalytical methods used to analyse the samples collected for monitoring purposes"].split(";").map(d => d.trim());
            for (const m of methods) {
                counts.set(m, (counts.get(m) || 0) + 1);
            }
        }
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
};

/**
 * Gets the top N most frequently used radioanalytical methods.
 * @param {number} n - The number of top methods to retrieve.
 * @returns {Array<Object>} Sorted array of top methods.
 */
const getTopRadMethod = (n = 10) => {
    return radMethodCountsData
        .slice() // Create a copy to avoid mutating the original array
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, n);
};

/**
 * Creates a map from radioanalytical method to a nested map of MemberState to LabName.
 * Note: Your original code had 'count' in the map for labs, but only used 'lab' in the return HTML.
 * For this visualization, I'll store unique lab names per method/state, aligning with 'selectedRadionuclideLabs'.
 * @returns {Map<string, Map<string, Set<string>>>} The mapping.
 */
const createRadMethodToLabsMap = () => {
    const map = new Map();
    for (const row of allRadMethodSurveyData) {
        const radMethodRaw = row["5.3 Radioanalytical methods used to analyse the samples collected for monitoring purposes"];
        const labName = row["1.1 Name of Laboratory"];
        const memberState = row["1.3 Member State"];

        if (!radMethodRaw || !labName || !memberState) continue;

        const radMethods = radMethodRaw.split(";").map(e => e.trim());

        for (const method of radMethods) {
            if (!map.has(method)) map.set(method, new Map()); // method → Map<MemberState, Set<LabName>>

            const stateMap = map.get(method);

            if (!stateMap.has(memberState)) stateMap.set(memberState, new Set()); // Use a Set to store unique lab names

            stateMap.get(memberState).add(labName); // Add lab name to the set
        }
    }
    return map;
};

/**
 * Creates the RadMethod Pie Chart.
 * @param {string} currentSelectedMethod - The currently selected method for highlighting.
 * @param {Function} onClickHandler - Callback function for pie slice clicks.
 * @returns {SVGElement} The D3 SVG node for the pie chart.
 */
const RadMethodPieChart = (currentSelectedMethod, onClickHandler) => {
    const width = 928;
    const height = Math.min(width, 500);

    const color = d3.scaleOrdinal()
        .domain(topRadMethodData.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topRadMethodData.length).reverse());

    const pie = d3.pie()
        .sort(null)
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topRadMethodData);

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
        .attr("fill", d => d.data.name === currentSelectedMethod ? "#FFD700" : color(d.data.name)) // Highlight selected
        .attr("stroke", d => d.data.name === currentSelectedMethod ? "black" : "white") // Add border to selected
        .attr("stroke-width", d => d.data.name === currentSelectedMethod ? 2 : 1)
        .attr("d", arc)
        .on("click", (event, d) => {
            onClickHandler(d.data.name); // Call the handler to update selectedRadMethod
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

    return svg.node();
};

/**
 * Updates the display of labs using the selected radioanalytical method.
 */
const updateSelectedRadMethodLabs = () => {
    const labInfoContainer = d3.select("#radmethod-lab-info-container"); // Use unique ID
    labInfoContainer.html(""); // Clear previous content

    if (!selectedRadMethod) {
        labInfoContainer.append("p").html("<em>Click on a pie slice to see related labs.</em>");
        return;
    }

    const stateMap = radMethodToLabsMapData.get(selectedRadMethod);

    if (!stateMap || stateMap.size === 0) {
        labInfoContainer.append("p").html(`No labs found for <strong>${selectedRadMethod}</strong>.`);
        return;
    }

    let totalLabs = 0;
    for (const labsSet of stateMap.values()) {
        totalLabs += labsSet.size;
    }

    const sortedStates = Array.from(stateMap.keys()).sort(d3.ascending);

    const div = labInfoContainer.append("div");
    div.append("h3").html(`Labs with <strong>${selectedRadMethod}</strong> (${totalLabs} total)`);

    sortedStates.forEach(state => {
        const labsSet = stateMap.get(state);
        const sortedLabs = Array.from(labsSet).sort(d3.ascending); // Sort lab names in the Set

        const stateDiv = div.append("div");
        stateDiv.append("h4").text(state);

        const ul = stateDiv.append("ul");
        sortedLabs.forEach(lab => {
            ul.append("li").text(lab);
        });
    });
};

/**
 * Main function to render the RadMethod chart based on selected checkboxes.
 */
const renderRadMethodCharts = () => {
    const chartDisplayContainer = d3.select("#radmethod-chart-display-container"); // Use unique ID
    chartDisplayContainer.html(""); // Clear previous charts

    const selectedCharts = Array.from(document.querySelectorAll('.radmethod-chart-selector:checked')).map(cb => cb.value);

    const chartClickHandler = (methodName) => {
        selectedRadMethod = methodName;
        // Re-render charts to apply highlight
        renderRadMethodCharts();
        // Update the lab info display
        updateSelectedRadMethodLabs();
    };

    if (selectedCharts.includes("Pie chart")) {
        const pieChartSvg = RadMethodPieChart(selectedRadMethod, chartClickHandler);
        chartDisplayContainer.node().appendChild(pieChartSvg);
    }

    // If no charts are selected, show a message
    if (selectedCharts.length === 0) {
        chartDisplayContainer.append("p").text("Please select a chart to display.");
    }
};

// --- Data Loading and Initialization for RadMethod ---
// It's crucial that this script loads AFTER the CSV data is available.
// If your previous script already loads it, you might pass it, or load it again here.
// For simplicity and independence, we'll load it again.
d3.csv("/ALMERA3.github.io/data/Observable2025Survey.csv").then(data => {
    allRadMethodSurveyData = data; // Store the loaded data

    // Process data once after loading
    radMethodCountsData = calculateRadMethodCounts();
    topRadMethodData = getTopRadMethod();
    radMethodToLabsMapData = createRadMethodToLabsMap();

    // Attach event listeners to checkboxes for dynamic chart display
    document.querySelectorAll('.radmethod-chart-selector').forEach(checkbox => {
        checkbox.addEventListener('change', renderRadMethodCharts);
    });

    // Initial render of charts and lab info
    renderRadMethodCharts();
    updateSelectedRadMethodLabs(); // Show initial message for labs
}).catch(error => {
    console.error("Error loading CSV data for RadMethod:", error);
    d3.select("#radmethod-chart-display-container").append("p").text("Failed to load data for RadMethod charts.");
    d3.select("#radmethod-lab-info-container").append("p").text("Data could not be loaded for RadMethod labs.");
});
