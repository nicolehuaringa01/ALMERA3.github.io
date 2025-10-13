// ALMERA_in_Data/2025/5.Radionuclides_measured/5.2Operations_Analyses_to_Tritium_2025.js

const csvDataPath2 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

// This function processes the raw data to count Operations_Analyses_to_Tritiums
function getOperations_Analyses_to_TritiumCounts(data, Operations_Analyses_to_TritiumColumn) {
    const counts = new Map();

    for (const row of data) {
        if (row[Operations_Analyses_to_TritiumColumn]) {
            // FIX: Using a regular expression to split by semicolon (;) OR newline (\n) OR carriage return (\r).
            // This correctly separates Operations_Analyses_to_Tritiums entered across multiple lines within a single CSV cell.
            const Operations_Analyses_to_Tritiums = row[Operations_Analyses_to_TritiumColumn].split(/;|\n|\r/).map(d => d.trim());
            for (const aff of Operations_Analyses_to_Tritiums) {
                if (aff) { // Ensure Operations_Analyses_to_Tritium string is not empty after trimming
                    counts.set(aff, (counts.get(aff) || 0) + 1);
                }
            }
        }
    }

    let result = [];
    let otherCount = 0;

    for (const [name, value] of counts.entries()) {
        if (value === 1) { // Operations_Analyses_to_Tritiums with only one occurrence go into "Other"
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

// This function selects the top N Operations_Analyses_to_Tritiums, including "Other" if present
function getTopOperations_Analyses_to_Tritiums(Operations_Analyses_to_TritiumCounts, numTop = 6) {
    let top = Operations_Analyses_to_TritiumCounts
        .slice() // Create a shallow copy to sort without modifying original
        .sort((a, b) => d3.descending(a.value, b.value)) // Sort by value descending
        .slice(0, numTop); // Take the top N

    // Ensure "Other" is included if it's one of the top N or if it exists and wasn't in top N
    const other = Operations_Analyses_to_TritiumCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }

    return top;
}


async function initializeOperations_Analyses_to_TritiumChart() {
    const container = document.getElementById("Operations_Analyses_to_Tritium-chart-container");
    if (!container) {
        console.error("Operations_Analyses_to_Tritium chart container element #Operations_Analyses_to_Tritium-chart-container not found.");
        return;
    }

    // Set dimensions for the chart
    const width = 928;
    const height = Math.min(width, 500);

    let rawData;
    try {
        rawData = await d3.csv(csvDataPath3);
        console.log("Operations_Analyses_to_Tritium CSV raw data loaded:", rawData.length, "records");
    } catch (error) {
        console.error("Error loading Operations_Analyses_to_Tritium CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load Operations_Analyses_to_Tritium data. Check console for details (e.g., CSV path).</p>";
        return;
    }

    // --- Data Processing using the new functions ---
    const Operations_Analyses_to_TritiumColumn = "5.1.1 If your laboratory is measuring H-3, please select operations/analyses performed:"; // User-provided column name
    if (!rawData[0] || !rawData[0][Operations_Analyses_to_TritiumColumn]) {
        console.error(`Error: CSV data missing required column "${Operations_Analyses_to_TritiumColumn}". Available columns:`, rawData.length > 0 ? Object.keys(rawData[0]) : "No data rows.");
        container.innerHTML = `<p style='color: red;'>Error: Missing "${Operations_Analyses_to_TritiumColumn}" column in CSV data.</p>`;
        return;
    }

    const Operations_Analyses_to_TritiumCounts = getOperations_Analyses_to_TritiumCounts(rawData, Operations_Analyses_to_TritiumColumn);
    let topOperations_Analyses_to_Tritium = getTopOperations_Analyses_to_Tritiums(Operations_Analyses_to_TritiumCounts, 6); // Get top 6 Operations_Analyses_to_Tritiums

    if (topOperations_Analyses_to_Tritium.length === 0) {
        console.warn("No valid Operations_Analyses_to_Tritium data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No Operations_Analyses_to_Tritium data to display after filtering/processing.</p>";
        return;
    }

    // --- Calculate total and percentages for the tooltip ---
    const totalOperations_Analyses_to_TritiumsCount = d3.sum(topOperations_Analyses_to_Tritium, d => d.value);

    // Count only laboratories that actually responded (non-empty Operations_Analyses_to_Tritium column)
    const labsThatAnswered = rawData.filter(d => d[Operations_Analyses_to_TritiumColumn] && d[Operations_Analyses_to_TritiumColumn].trim() !== "").length;

    // Add percentage to each Operations_Analyses_to_Tritium object in topOperations_Analyses_to_Tritium
    topOperations_Analyses_to_Tritium.forEach(d => {
        d.percent = (totalOperations_Analyses_to_TritiumsCount > 0) ? (d.value / totalOperations_Analyses_to_TritiumsCount) : 0;
    });

    console.log("Processed topOperations_Analyses_to_Tritium data with percentages:", topOperations_Analyses_to_Tritium);

    // --- Chart Rendering Logic ---

    // Create the color scale.
    const color = d3.scaleOrdinal()
        .domain(topOperations_Analyses_to_Tritium.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topOperations_Analyses_to_Tritium.length).reverse());

    // Create the pie layout and arc generator.
    const pie = d3.pie()
        .sort(null) // Do not sort, use the pre-sorted topOperations_Analyses_to_Tritium
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topOperations_Analyses_to_Tritium);

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

    svg.append("text")
        .attr("x", -width / 2 + 10) 
        .attr("y", -height / 2 + 20)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(`Total responses: ${totalOperations_Analyses_to_TritiumsCount.toLocaleString("en-US")}`);

    svg.append("text")
        .attr("x", -width / 2 + 10)
        .attr("y", -height / 2 + 40)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .text(`Total laboratories that answered: ${labsThatAnswered.toLocaleString("en-US")}`);

    // Append the SVG to the designated container
    container.appendChild(svg.node());
    console.log("Operations_Analyses_to_Tritium chart appended to DOM.");

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
document.addEventListener("DOMContentLoaded", initializeOperations_Analyses_to_TritiumChart);
