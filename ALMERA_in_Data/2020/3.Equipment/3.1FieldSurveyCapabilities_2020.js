// ALMERA_in_Data/2020/3.Equipment/3.1FieldSurveyCapabilities_2020.js

const csvDataPath1 = "/ALMERA3.github.io/data/2020_ALMERA_Capabilities_Survey.csv";

// This function processes the raw data to count FieldSurveyCapabilities
function getFieldSurveyCapabilitiesCounts(data, capabilitiesColumn) {
    const counts = new Map();

    for (const row of data) {
        if (row[capabilitiesColumn]) {
            // Split by semicolon as per your Observable notebook's implicit logic
            const capabilities = row[capabilitiesColumn].split(";").map(d => d.trim());
            for (const cap of capabilities) {
                if (cap) { // Ensure capability string is not empty after trimming
                    counts.set(cap, (counts.get(cap) || 0) + 1);
                }
            }
        }
    }

    let result = [];
    let otherCount = 0;

    for (const [name, value] of counts.entries()) {
        if (value === 1) { // Capabilities with only one occurrence go into "Other"
            otherCount += 1;
        } else {
            result.push({ name, value });
        }
    }

    if (otherCount > 0) {
        result.push({ name: "Other", value: otherCount });
    }

    return result;
}

// This function selects the top N capabilities, including "Other" if present
function getTopFieldSurveyCapabilities(capabilityCounts, numTop = 6) {
    let top = capabilityCounts
        .slice() // Create a shallow copy to sort without modifying original
        .sort((a, b) => d3.descending(a.value, b.value)) // Sort by value descending
        .slice(0, numTop); // Take the top N

    // Ensure "Other" is included if it's one of the top N or if it exists and wasn't in top N
    const other = capabilityCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        top.sort((a, b) => d3.descending(a.value, b.value));
    }

    return top;
}


async function initializeFieldSurveyCapabilitiesChart() {
    const container = document.getElementById("FieldSurveyCapabilities-chart-container");
    if (!container) {
        console.error("FieldSurveyCapabilities chart container element #FieldSurveyCapabilities-chart-container not found.");
        return;
    }

    // Set dimensions for the chart
    const width = 928;
    const height = Math.min(width, 500);

    let rawData;
    try {
        rawData = await d3.csv(csvDataPath1);
        console.log("FieldSurveyCapabilities CSV raw data loaded:", rawData.length, "records");
    } catch (error) {
        console.error("Error loading FieldSurveyCapabilities CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load FieldSurveyCapabilities data. Check console for details (e.g., CSV path).</p>";
        return;
    }

    // --- Data Processing using the new functions ---
    const capabilitiesColumn = "3.1 Which of the following field survey capabilities are available at your facility? (Select all that apply)"; // User-provided column name
    if (!rawData[0] || !rawData[0][capabilitiesColumn]) {
        console.error(`Error: CSV data missing required column "${capabilitiesColumn}". Available columns:`, rawData.length > 0 ? Object.keys(rawData[0]) : "No data rows.");
        container.innerHTML = `<p style='color: red;'>Error: Missing "${capabilitiesColumn}" column in CSV data.</p>`;
        return;
    }

    const FieldSurveyCapabilitiesCounts = getFieldSurveyCapabilitiesCounts(rawData, capabilitiesColumn);
    const topFieldSurveyCapabilities = getTopFieldSurveyCapabilities(FieldSurveyCapabilitiesCounts, 6); // Get top 6 capabilities

    if (topFieldSurveyCapabilities.length === 0) {
        console.warn("No valid FieldSurveyCapabilities data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No FieldSurveyCapabilities data to display after filtering/processing.</p>";
        return;
    }

    // --- Calculate total and percentages for the tooltip ---
    const totalFieldSurveyCapabilitiesCount = d3.sum(topFieldSurveyCapabilities, d => d.value);
    
    // --- THIS IS THE FIX ---
    const totalCount = d3.sum(FieldSurveyCapabilitiesCounts, d => d.value);

    const labsThatAnswered = rawData.filter(d => d[capabilitiesColumn] && d[capabilitiesColumn].trim() !== "").length;

    // Add percentage to each capability object in topFieldSurveyCapabilities
    topFieldSurveyCapabilities.forEach(d => {
        d.percent = (totalFieldSurveyCapabilitiesCount > 0) ? (d.value / totalFieldSurveyCapabilitiesCount) : 0;
    });

    console.log("Processed topFieldSurveyCapabilities data with percentages:", topFieldSurveyCapabilities);

    // --- Chart Rendering Logic ---

    // Create the color scale.
    const color = d3.scaleOrdinal()
        .domain(topFieldSurveyCapabilities.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topFieldSurveyCapabilities.length).reverse());

    // Create the pie layout and arc generator.
    const pie = d3.pie()
        .sort(null) // Do not sort, use the pre-sorted topFieldSurveyCapabilities
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topFieldSurveyCapabilities);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height]) // Center the view
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;"); // General styling

    // Add a sector path for each value.
    svg.append("g")
        .attr("stroke", "white")
        .selectAll("path")
        .data(arcs)
        .join("path")
            .attr("fill", d => color(d.data.name))
            .attr("d", arc)
        .append("title") // Tooltip on hover
            .text(d => `${d.data.name}: ${(d.data.percent * 100).toFixed(1)}% (${d.data.value.toLocaleString("en-US")} labs)`);
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

    // --- THIS IS THE FIX ---
    svg.append("text")
        .attr("x", -width / 2 + 10)
        .attr("y", -height / 2 + 20)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(`Total responses: ${totalCount.toLocaleString("en-US")}`);

    svg.append("text")
        .attr("x", -width / 2 + 10)
        .attr("y", -height / 2 + 40)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .text(`Total laboratories that answered: ${labsThatAnswered.toLocaleString("en-US")}`);

    // Append the SVG to the designated container
    container.appendChild(svg.node());
    console.log("FieldSurveyCapabilities chart appended to DOM.");

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
document.addEventListener("DOMContentLoaded", initializeFieldSurveyCapabilitiesChart);
