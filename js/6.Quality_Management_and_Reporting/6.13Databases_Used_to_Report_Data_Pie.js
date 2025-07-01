// js/6.Quality_Management_and_Reporting/6.13Databases_Used_to_Report_Data_Pie.js

// IMPORTANT: Verify this path carefully!
// This path is relative to the HTML file that loads this JS.
// Assuming your CSV is in the 'data' subfolder within your GitHub Pages project's root
// (e.g., https://nicolehuaringa01.github.io/ALMERA3.github.io/data/Observable2020Survey.csv)
const csvDataPath135 = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // User-provided path

// This function processes the raw data to count Databases_Used_to_Report_Data_Pies
function getDatabases_Used_to_Report_Data_PieCounts(data, Databases_Used_to_Report_Data_PieColumn) {
    const counts = new Map();

    for (const row of data) {
        if (row[Databases_Used_to_Report_Data_PieColumn]) {
            // Split by semicolon as per your Observable notebook's implicit logic
            const Databases_Used_to_Report_Data_Pies = row[Databases_Used_to_Report_Data_PieColumn].split(";").map(d => d.trim());
            for (const aff of Databases_Used_to_Report_Data_Pies) {
                if (aff) { // Ensure Databases_Used_to_Report_Data_Pie string is not empty after trimming
                    counts.set(aff, (counts.get(aff) || 0) + 1);
                }
            }
        }
    }

    let result = [];
    let otherCount = 0;

    for (const [name, value] of counts.entries()) {
        if (value === 1) { // Databases_Used_to_Report_Data_Pies with only one occurrence go into "Other"
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

// This function selects the top N Databases_Used_to_Report_Data_Pies, including "Other" if present
function getTopDatabases_Used_to_Report_Data_Pies(Databases_Used_to_Report_Data_PieCounts, numTop = 12) {
    let top = Databases_Used_to_Report_Data_PieCounts
        .slice() // Create a shallow copy to sort without modifying original
        .sort((a, b) => d3.descending(a.value, b.value)) // Sort by value descending
        .slice(0, numTop); // Take the top N

    // Ensure "Other" is included if it's one of the top N or if it exists and wasn't in top N
    const other = Databases_Used_to_Report_Data_PieCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }

    return top;
}


async function initializeDatabases_Used_to_Report_Data_PieChart() {
    const container = document.getElementById("Databases_Used_to_Report_Data_Pie-chart-container");
    if (!container) {
        console.error("Databases_Used_to_Report_Data_Pie chart container element #Databases_Used_to_Report_Data_Pie-chart-container not found.");
        return;
    }

    // Set dimensions for the chart
    const width = 928;
    const height = Math.min(width, 500);

    let rawData;
    try {
        rawData = await d3.csv(csvDataPath135);
        console.log("Databases_Used_to_Report_Data_Pie CSV raw data loaded:", rawData.length, "records");
    } catch (error) {
        console.error("Error loading Databases_Used_to_Report_Data_Pie CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load Databases_Used_to_Report_Data_Pie data. Check console for details (e.g., CSV path).</p>";
        return;
    }

    // --- Data Processing using the new functions ---
    const Databases_Used_to_Report_Data_PieColumn = "If 'yes' above, which database(s) is the routine monitoring data reported to? (Select all that apply) "; // User-provided column name
    if (!rawData[0] || !rawData[0][Databases_Used_to_Report_Data_PieColumn]) {
        console.error(`Error: CSV data missing required column "${Databases_Used_to_Report_Data_PieColumn}". Available columns:`, rawData.length > 0 ? Object.keys(rawData[0]) : "No data rows.");
        container.innerHTML = `<p style='color: red;'>Error: Missing "${Databases_Used_to_Report_Data_PieColumn}" column in CSV data.</p>`;
        return;
    }

    const Databases_Used_to_Report_Data_PieCounts = getDatabases_Used_to_Report_Data_PieCounts(rawData, Databases_Used_to_Report_Data_PieColumn);
    const topDatabases_Used_to_Report_Data_Pie = getTopDatabases_Used_to_Report_Data_Pies(Databases_Used_to_Report_Data_PieCounts, 6); // Get top 6 Databases_Used_to_Report_Data_Pies

    if (topDatabases_Used_to_Report_Data_Pie.length === 0) {
        console.warn("No valid Databases_Used_to_Report_Data_Pie data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No Databases_Used_to_Report_Data_Pie data to display after filtering/processing.</p>";
        return;
    }

     // --- Calculate total and percentages for the tooltip ---
    const totalDatabases_Used_to_Report_Data_PiesCount = d3.sum(topDatabases_Used_to_Report_Data_Pie, d => d.value);

    // Add percentage to each Databases_Used_to_Report_Data_Pie object in topDatabases_Used_to_Report_Data_Pie
    topDatabases_Used_to_Report_Data_Pie.forEach(d => {
        d.percent = (totalDatabases_Used_to_Report_Data_PiesCount > 0) ? (d.value / totalDatabases_Used_to_Report_Data_PiesCount) : 0;
    });

    console.log("Processed topDatabases_Used_to_Report_Data_Pie data with percentages:", topDatabases_Used_to_Report_Data_Pie);

    // --- Chart Rendering Logic ---

    // Create the color scale.
    const color = d3.scaleOrdinal()
        .domain(topDatabases_Used_to_Report_Data_Pie.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topDatabases_Used_to_Report_Data_Pie.length).reverse());

    // Create the pie layout and arc generator.
    const pie = d3.pie()
        .sort(null) // Do not sort, use the pre-sorted topDatabases_Used_to_Report_Data_Pie
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topDatabases_Used_to_Report_Data_Pie);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height]) // Center the view
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;"); // General styling

    // Add a Databases_Used_to_Report_Data_Pie path for each value.
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
    console.log("Databases_Used_to_Report_Data_Pie chart appended to DOM.");

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
document.addEventListener("DOMContentLoaded", initializeDatabases_Used_to_Report_Data_PieChart);
