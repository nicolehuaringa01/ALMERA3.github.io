// js/6.Quality_Management_and_Reporting/6.14Authority_Where_Data_Is_Reported_To.js

// IMPORTANT: Verify this path carefully!
// This path is relative to the HTML file that loads this JS.
// Assuming your CSV is in the 'data' subfolder within your GitHub Pages project's root
// (e.g., https://nicolehuaringa01.github.io/ALMERA3.github.io/data/Observable2020Survey.csv)
const csvDataPath145 = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // User-provided path

// This function processes the raw data to count Authority_Where_Data_Is_Reported_Tos
function getAuthority_Where_Data_Is_Reported_ToCounts(data, Authority_Where_Data_Is_Reported_ToColumn) {
    const counts = new Map();

    for (const row of data) {
        if (row[Authority_Where_Data_Is_Reported_ToColumn]) {
            // Split by semicolon as per your Observable notebook's implicit logic
            const Authority_Where_Data_Is_Reported_Tos = row[Authority_Where_Data_Is_Reported_ToColumn].split(";").map(d => d.trim());
            for (const aff of Authority_Where_Data_Is_Reported_Tos) {
                if (aff) { // Ensure Authority_Where_Data_Is_Reported_To string is not empty after trimming
                    counts.set(aff, (counts.get(aff) || 0) + 1);
                }
            }
        }
    }

    let result = [];
    let otherCount = 0;

    for (const [name, value] of counts.entries()) {
        if (value === 1) { // Authority_Where_Data_Is_Reported_Tos with only one occurrence go into "Other"
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

// This function selects the top N Authority_Where_Data_Is_Reported_Tos, including "Other" if present
function getTopAuthority_Where_Data_Is_Reported_Tos(Authority_Where_Data_Is_Reported_ToCounts, numTop = 12) {
    let top = Authority_Where_Data_Is_Reported_ToCounts
        .slice() // Create a shallow copy to sort without modifying original
        .sort((a, b) => d3.descending(a.value, b.value)) // Sort by value descending
        .slice(0, numTop); // Take the top N

    // Ensure "Other" is included if it's one of the top N or if it exists and wasn't in top N
    const other = Authority_Where_Data_Is_Reported_ToCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }

    return top;
}


async function initializeAuthority_Where_Data_Is_Reported_ToChart() {
    const container = document.getElementById("Authority_Where_Data_Is_Reported_To-chart-container");
    if (!container) {
        console.error("Authority_Where_Data_Is_Reported_To chart container element #Authority_Where_Data_Is_Reported_To-chart-container not found.");
        return;
    }

    // Set dimensions for the chart
    const width = 928;
    const height = Math.min(width, 500);

    let rawData;
    try {
        rawData = await d3.csv(csvDataPath145);
        console.log("Authority_Where_Data_Is_Reported_To CSV raw data loaded:", rawData.length, "records");
    } catch (error) {
        console.error("Error loading Authority_Where_Data_Is_Reported_To CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load Authority_Where_Data_Is_Reported_To data. Check console for details (e.g., CSV path).</p>";
        return;
    }

    // --- Data Processing using the new functions ---
    const Authority_Where_Data_Is_Reported_ToColumn = "6.12 What is the frequency with which results are reported to national authorities?"; // User-provided column name
    if (!rawData[0] || !rawData[0][Authority_Where_Data_Is_Reported_ToColumn]) {
        console.error(`Error: CSV data missing required column "${Authority_Where_Data_Is_Reported_ToColumn}". Available columns:`, rawData.length > 0 ? Object.keys(rawData[0]) : "No data rows.");
        container.innerHTML = `<p style='color: red;'>Error: Missing "${Authority_Where_Data_Is_Reported_ToColumn}" column in CSV data.</p>`;
        return;
    }

    const Authority_Where_Data_Is_Reported_ToCounts = getAuthority_Where_Data_Is_Reported_ToCounts(rawData, Authority_Where_Data_Is_Reported_ToColumn);
    const topAuthority_Where_Data_Is_Reported_To = getTopAuthority_Where_Data_Is_Reported_Tos(Authority_Where_Data_Is_Reported_ToCounts, 6); // Get top 6 Authority_Where_Data_Is_Reported_Tos

    if (topAuthority_Where_Data_Is_Reported_To.length === 0) {
        console.warn("No valid Authority_Where_Data_Is_Reported_To data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No Authority_Where_Data_Is_Reported_To data to display after filtering/processing.</p>";
        return;
    }

     // --- Calculate total and percentages for the tooltip ---
    const totalAuthority_Where_Data_Is_Reported_TosCount = d3.sum(topAuthority_Where_Data_Is_Reported_To, d => d.value);

    // Add percentage to each Authority_Where_Data_Is_Reported_To object in topAuthority_Where_Data_Is_Reported_To
    topAuthority_Where_Data_Is_Reported_To.forEach(d => {
        d.percent = (totalAuthority_Where_Data_Is_Reported_TosCount > 0) ? (d.value / totalAuthority_Where_Data_Is_Reported_TosCount) : 0;
    });

    console.log("Processed topAuthority_Where_Data_Is_Reported_To data with percentages:", topAuthority_Where_Data_Is_Reported_To);

    // --- Chart Rendering Logic ---

    // Create the color scale.
    const color = d3.scaleOrdinal()
        .domain(topAuthority_Where_Data_Is_Reported_To.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topAuthority_Where_Data_Is_Reported_To.length).reverse());

    // Create the pie layout and arc generator.
    const pie = d3.pie()
        .sort(null) // Do not sort, use the pre-sorted topAuthority_Where_Data_Is_Reported_To
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topAuthority_Where_Data_Is_Reported_To);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height]) // Center the view
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;"); // General styling

    // Add a Authority_Where_Data_Is_Reported_To path for each value.
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
    console.log("Authority_Where_Data_Is_Reported_To chart appended to DOM.");

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
document.addEventListener("DOMContentLoaded", initializeAuthority_Where_Data_Is_Reported_ToChart);
