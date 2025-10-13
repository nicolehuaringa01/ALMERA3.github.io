// ALMERA_in_Data/2025/6.Quality_Management_and_Reporting/6.16Other_Networks_that_ALMERA_Labs_Belong_To.js

const csvDataPath165 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv"; // User-provided path

// Helper function to normalize strings for comparison (remove extra spaces, non-breaking spaces)
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').replace(/\u00A0/g, ' '); // Replace all whitespace with single space, remove non-breaking spaces
}

// This function processes the raw data to count Other_Networks_that_ALMERA_Labs_Belong_Tos
function getOther_Networks_that_ALMERA_Labs_Belong_ToCounts(data, Other_Networks_that_ALMERA_Labs_Belong_ToColumn) {
    const counts = new Map();

    for (const row of data) {
        if (row[Other_Networks_that_ALMERA_Labs_Belong_ToColumn]) {
            // Split by semicolon as per your Observable notebook's implicit logic
            const Other_Networks_that_ALMERA_Labs_Belong_Tos = row[Other_Networks_that_ALMERA_Labs_Belong_ToColumn].split(/;|\n|\r/).map(d => d.trim());
            for (const aff of Other_Networks_that_ALMERA_Labs_Belong_Tos) {
                if (aff) { // Ensure Other_Networks_that_ALMERA_Labs_Belong_To string is not empty after trimming
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

// This function selects the top N Other_Networks_that_ALMERA_Labs_Belong_Tos, including "Other" if present
function getTopOther_Networks_that_ALMERA_Labs_Belong_Tos(Other_Networks_that_ALMERA_Labs_Belong_ToCounts, numTop = 12) {
    let top = Other_Networks_that_ALMERA_Labs_Belong_ToCounts
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, numTop);

    const other = Other_Networks_that_ALMERA_Labs_Belong_ToCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other);
        top.sort((a, b) => d3.descending(a.value, b.value));
    }

    return top;
}


async function initializeOther_Networks_that_ALMERA_Labs_Belong_ToChart() {
    const container = document.getElementById("Other_Networks_that_ALMERA_Labs_Belong_To-chart-container");
    if (!container) {
        console.error("Other_Networks_that_ALMERA_Labs_Belong_To chart container element #Other_Networks_that_ALMERA_Labs_Belong_To-chart-container not found.");
        return;
    }

    const width = 928;
    const height = Math.min(width, 500);

    let rawData;
    try {
        rawData = await d3.csv(csvDataPath165);
        console.log("Other_Networks_that_ALMERA_Labs_Belong_To CSV raw data loaded:", rawData.length, "records");

        if (rawData.length === 0) {
            console.warn("CSV data is empty. No chart to display.");
            container.innerHTML = "<p style='text-align: center;'>CSV data is empty. No chart to display.</p>";
            return;
        }

        // *** CRUCIAL DEBUGGING STEP: Log all headers found by D3.js ***
        const parsedHeaders = Object.keys(rawData[0]);
        console.log("CSV data loaded. First row headers (as parsed by D3.js):", parsedHeaders);


    } catch (error) {
        console.error("Error loading Other_Networks_that_ALMERA_Labs_Belong_To CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load Other_Networks_that_ALMERA_Labs_Belong_To data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing using the new functions ---
    const targetColumnName = "6.13 Select other networks in addition to ALMERA that the laboratory is member of.";

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
    const Other_Networks_that_ALMERA_Labs_Belong_ToColumn = foundColumn; // Use the exactly matched header


    const Other_Networks_that_ALMERA_Labs_Belong_ToCounts = getOther_Networks_that_ALMERA_Labs_Belong_ToCounts(rawData, Other_Networks_that_ALMERA_Labs_Belong_ToColumn);
    const topOther_Networks_that_ALMERA_Labs_Belong_To = getTopOther_Networks_that_ALMERA_Labs_Belong_Tos(Other_Networks_that_ALMERA_Labs_Belong_ToCounts, 10); // Get top 10 Other_Networks_that_ALMERA_Labs_Belong_Tos

    if (topOther_Networks_that_ALMERA_Labs_Belong_To.length === 0) {
        console.warn("No valid Other_Networks_that_ALMERA_Labs_Belong_To data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No Other_Networks_that_ALMERA_Labs_Belong_To data to display after filtering/processing.</p>";
        return;
    }

     // --- Calculate total and percentages for the tooltip ---
    const totalOther_Networks_that_ALMERA_Labs_Belong_TosCount = d3.sum(topOther_Networks_that_ALMERA_Labs_Belong_To, d => d.value);

    // Add percentage to each Other_Networks_that_ALMERA_Labs_Belong_To object in topOther_Networks_that_ALMERA_Labs_Belong_To
    topOther_Networks_that_ALMERA_Labs_Belong_To.forEach(d => {
        d.percent = (totalOther_Networks_that_ALMERA_Labs_Belong_TosCount > 0) ? (d.value / totalOther_Networks_that_ALMERA_Labs_Belong_TosCount) : 0;
    });

    console.log("Processed topOther_Networks_that_ALMERA_Labs_Belong_To data with percentages:", topOther_Networks_that_ALMERA_Labs_Belong_To);

    // --- Chart Rendering Logic ---

    // Create the color scale.
    const color = d3.scaleOrdinal()
        .domain(topOther_Networks_that_ALMERA_Labs_Belong_To.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topOther_Networks_that_ALMERA_Labs_Belong_To.length).reverse());

    // Create the pie layout and arc generator.
    const pie = d3.pie()
        .sort(null) // Do not sort, use the pre-sorted topOther_Networks_that_ALMERA_Labs_Belong_To
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topOther_Networks_that_ALMERA_Labs_Belong_To);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height]) // Center the view
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;"); // General styling

    // Add a Other_Networks_that_ALMERA_Labs_Belong_To path for each value.
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
    console.log("Other_Networks_that_ALMERA_Labs_Belong_To chart appended to DOM.");

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
document.addEventListener("DOMContentLoaded", initializeOther_Networks_that_ALMERA_Labs_Belong_ToChart);
