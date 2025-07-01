// js/7.1Environmental_Monitoring_Capabilities.js

// IMPORTANT: Verify this path carefully!
// This path is relative to the HTML file that loads this JS.
// Assuming your CSV is in the 'data' subfolder within your GitHub Pages project's root
// (e.g., https://nicolehuaringa01.github.io/ALMERA3.github.io/data/Observable2020Survey.csv)
const csvDataPath1 = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // User-provided path

// Helper function to normalize strings for comparison (remove extra spaces, non-breaking spaces)
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').replace(/\u00A0/g, ' '); // Replace all whitespace with single space, remove non-breaking spaces
}

// This function processes the raw data to count Environmental_Monitoring_Capabilitiess
function getEnvironmental_Monitoring_CapabilitiesCounts(data, Environmental_Monitoring_CapabilitiesColumn) {
    const counts = new Map();

    for (const row of data) {
        if (row[Environmental_Monitoring_CapabilitiesColumn]) {
            // Split by semicolon as per your Observable notebook's implicit logic
            const Environmental_Monitoring_Capabilitiess = row[Environmental_Monitoring_CapabilitiesColumn].split(";").map(d => d.trim());
            for (const aff of Environmental_Monitoring_Capabilitiess) {
                if (aff) { // Ensure Environmental_Monitoring_Capabilities string is not empty after trimming
                    counts.set(aff, (counts.get(aff) || 0) + 1);
                }
            }
        }
    }

    let result = [];
    let syntheticOtherCount = 0;

    for (const [name, value] of counts.entries()) {
        if (value === 1 && name !== "Other") {
            syntheticOtherCount += 1;
        } else {
            result.push({ name, value });
        }
    }

    let existingOtherIndex = result.findIndex(d => d.name === "Other");

    if (existingOtherIndex !== -1) {
        result[existingOtherIndex].value += syntheticOtherCount;
    } else if (syntheticOtherCount > 0) {
        result.push({ name: "Other", value: syntheticOtherCount });
    }

    return result;
}

// This function selects the top N Environmental_Monitoring_Capabilitiess, including "Other" if present
function getTopEnvironmental_Monitoring_Capabilitiess(Environmental_Monitoring_CapabilitiesCounts, numTop = 12) {
    let top = Environmental_Monitoring_CapabilitiesCounts
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, numTop);

    const other = Environmental_Monitoring_CapabilitiesCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other);
        top.sort((a, b) => d3.descending(a.value, b.value));
    }

    return top;
}


async function initializeEnvironmental_Monitoring_CapabilitiesChart() {
    const container = document.getElementById("Environmental_Monitoring_Capabilities-chart-container");
    if (!container) {
        console.error("Environmental_Monitoring_Capabilities chart container element #Environmental_Monitoring_Capabilities-chart-container not found.");
        return;
    }

    const width = 928;
    const height = Math.min(width, 500);

    let rawData;
    try {
        rawData = await d3.csv(csvDataPath1);
        console.log("Environmental_Monitoring_Capabilities CSV raw data loaded:", rawData.length, "records");

        if (rawData.length === 0) {
            console.warn("CSV data is empty. No chart to display.");
            container.innerHTML = "<p style='text-align: center;'>CSV data is empty. No chart to display.</p>";
            return;
        }

        // *** CRUCIAL DEBUGGING STEP: Log all headers found by D3.js ***
        const parsedHeaders = Object.keys(rawData[0]);
        console.log("CSV data loaded. First row headers (as parsed by D3.js):", parsedHeaders);


    } catch (error) {
        console.error("Error loading Environmental_Monitoring_Capabilities CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load Environmental_Monitoring_Capabilities data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing using the new functions ---
    const targetColumnName = "7.1  What environmental radioactivity monitoring tasks is the laboratory/institution authorised or appointed to perform? Please select all that apply."; // User-provided column name

    // --- Robust Column Name Validation ---
    let foundColumn = null;
    const normalizedTarget = normalizeString(targetColumnName);

    for (const header of Object.keys(rawData[0])) {
        if (normalizeString(header) === normalizedTarget) {
            foundColumn = header;
            break;
        }
    }

    if (!foundColumn) {
        console.error(`Error: Could not find a matching column for "${targetColumnName}" in the CSV data.`);
        console.error("Available headers (normalized for comparison):", Object.keys(rawData[0]).map(normalizeString));
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: Column "${targetColumnName}" not found in CSV. Please check the exact header name in the console.</p>`;
        return;
    }

    console.log(`Successfully identified column: "${foundColumn}" for processing.`);
    const Environmental_Monitoring_CapabilitiesColumn = foundColumn; // Use the exactly matched header


    const Environmental_Monitoring_CapabilitiesCounts = getEnvironmental_Monitoring_CapabilitiesCounts(rawData, Environmental_Monitoring_CapabilitiesColumn);
    const topEnvironmental_Monitoring_Capabilities = getTopEnvironmental_Monitoring_Capabilitiess(Environmental_Monitoring_CapabilitiesCounts, 10); // Get top 10 Environmental_Monitoring_Capabilitiess

    if (topEnvironmental_Monitoring_Capabilities.length === 0) {
        console.warn("No valid Environmental_Monitoring_Capabilities data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No Environmental_Monitoring_Capabilities data to display after filtering/processing.</p>";
        return;
    }

     // --- Calculate total and percentages for the tooltip ---
    const totalEnvironmental_Monitoring_CapabilitiessCount = d3.sum(topEnvironmental_Monitoring_Capabilities, d => d.value);

    // Add percentage to each Environmental_Monitoring_Capabilities object in topEnvironmental_Monitoring_Capabilities
    topEnvironmental_Monitoring_Capabilities.forEach(d => {
        d.percent = (totalEnvironmental_Monitoring_CapabilitiessCount > 0) ? (d.value / totalEnvironmental_Monitoring_CapabilitiessCount) : 0;
    });

    console.log("Processed topEnvironmental_Monitoring_Capabilities data with percentages:", topEnvironmental_Monitoring_Capabilities);

    // --- Chart Rendering Logic ---

    // Create the color scale.
    const color = d3.scaleOrdinal()
        .domain(topEnvironmental_Monitoring_Capabilities.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topEnvironmental_Monitoring_Capabilities.length).reverse());

    // Create the pie layout and arc generator.
    const pie = d3.pie()
        .sort(null) // Do not sort, use the pre-sorted topEnvironmental_Monitoring_Capabilities
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topEnvironmental_Monitoring_Capabilities);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height]) // Center the view
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;"); // General styling

    // Add a Environmental_Monitoring_Capabilities path for each value.
    svg.append("g")
        .attr("stroke", "white")
        .selectAll("path")
        .data(arcs)
        .join("path")
            .attr("fill", d => color(d.data.name))
            .attr("d", arc)
        .append("title") // Tooltip on hover
            .text(d => `${d.data.name}: ${(d.data.percent * 100).toFixed(1)}% (${d.data.value.toLocaleString("en-US")} labs)`); // MODIFIED HERE

    // Add a legend.
    const legend = svg.append("g")
        .attr("transform", `translate(${width / 2 - 200}, ${-height / 2 + 20})`) // Position adjusted for clarity
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

    // Append the SVG to the designated container
    container.appendChild(svg.node());
    console.log("Environmental_Monitoring_Capabilities chart appended to DOM.");

    // Handle responsiveness: redraw on window resize
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = Math.min(newWidth, 500);
        svg.attr("width", newWidth)
           .attr("height", newHeight)
           .attr("viewBox", [-newWidth / 2, -newHeight / 2, newWidth, newHeight]);

        arc.outerRadius(Math.min(newWidth, newHeight) / 2 - 1);
        svg.selectAll("path").attr("d", arc);

        // Reposition legend (optional, could be static)
        legend.attr("transform", `translate(${newWidth / 2 - 200}, ${-newHeight / 2 + 20})`);
    });
}

// Initialize the chart when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeEnvironmental_Monitoring_CapabilitiesChart);
