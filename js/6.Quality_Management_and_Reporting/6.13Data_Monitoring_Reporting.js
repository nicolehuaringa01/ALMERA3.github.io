// js/6.Quality_Management_and_Reporting/6.13Data_Monitoring_Reporting.js
// IMPORTANT: Verify this path carefully!
// This path is relative to the HTML file that loads this JS.
// Assuming your CSV is in the 'data' subfolder within your GitHub Pages project's root
// (e.g., https://nicolehuaringa01.github.io/ALMERA3.github.io/data/Observable2020Survey.csv)
const csvDataPath135 = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // User-provided path

// This function processes the raw data to count Data_Monitoring_Reportings
function getData_Monitoring_ReportingCounts(data, Data_Monitoring_ReportingColumn) {
    const counts = new Map();

    for (const row of data) {
        if (row[Data_Monitoring_ReportingColumn]) {
            // Split by semicolon as per your Observable notebook's implicit logic
            const Data_Monitoring_Reportings = row[Data_Monitoring_ReportingColumn].split(";").map(d => d.trim());
            for (const aff of Data_Monitoring_Reportings) {
                if (aff) { // Ensure Data_Monitoring_Reporting string is not empty after trimming
                    counts.set(aff, (counts.get(aff) || 0) + 1);
                }
            }
        }
    }

    let result = [];
    let otherCount = 0;

    for (const [name, value] of counts.entries()) {
        if (value === 1) { // Data_Monitoring_Reportings with only one occurrence go into "Other"
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

// This function selects the top N Data_Monitoring_Reportings, including "Other" if present
function getTopData_Monitoring_Reportings(Data_Monitoring_ReportingCounts, numTop = 12) {
    let top = Data_Monitoring_ReportingCounts
        .slice() // Create a shallow copy to sort without modifying original
        .sort((a, b) => d3.descending(a.value, b.value)) // Sort by value descending
        .slice(0, numTop); // Take the top N

    // Ensure "Other" is included if it's one of the top N or if it exists and wasn't in top N
    const other = Data_Monitoring_ReportingCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }

    return top;
}


async function initializeData_Monitoring_ReportingChart() {
    const container = document.getElementById("Data_Monitoring_Reporting-chart-container");
    if (!container) {
        console.error("Data_Monitoring_Reporting chart container element #Data_Monitoring_Reporting-chart-container not found.");
        return;
    }

    // Set dimensions for the chart
    const width = 928;
    const height = Math.min(width, 500);

    let rawData;
    try {
        rawData = await d3.csv(csvDataPath135);
        console.log("Data_Monitoring_Reporting CSV raw data loaded:", rawData.length, "records");
    } catch (error) {
        console.error("Error loading Data_Monitoring_Reporting CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load Data_Monitoring_Reporting data. Check console for details (e.g., CSV path).</p>";
        return;
    }

    // --- Data Processing using the new functions ---
    const Data_Monitoring_ReportingColumn = "6.13 Which database(s) is the routine monitoring data reported to? (Select all that apply)"; // User-provided column name
    if (!rawData[0] || !rawData[0][Data_Monitoring_ReportingColumn]) {
        console.error(`Error: CSV data missing required column "${Data_Monitoring_ReportingColumn}". Available columns:`, rawData.length > 0 ? Object.keys(rawData[0]) : "No data rows.");
        container.innerHTML = `<p style='color: red;'>Error: Missing "${Data_Monitoring_ReportingColumn}" column in CSV data.</p>`;
        return;
    }

    const Data_Monitoring_ReportingCounts = getData_Monitoring_ReportingCounts(rawData, Data_Monitoring_ReportingColumn);
    const topData_Monitoring_Reporting = getTopData_Monitoring_Reportings(Data_Monitoring_ReportingCounts, 6); // Get top 6 Data_Monitoring_Reportings

    if (topData_Monitoring_Reporting.length === 0) {
        console.warn("No valid Data_Monitoring_Reporting data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No Data_Monitoring_Reporting data to display after filtering/processing.</p>";
        return;
    }

     // --- Calculate total and percentages for the tooltip ---
    const totalData_Monitoring_ReportingsCount = d3.sum(topData_Monitoring_Reporting, d => d.value);

    // Add percentage to each Data_Monitoring_Reporting object in topData_Monitoring_Reporting
    topData_Monitoring_Reporting.forEach(d => {
        d.percent = (totalData_Monitoring_ReportingsCount > 0) ? (d.value / totalData_Monitoring_ReportingsCount) : 0;
    });

    console.log("Processed topData_Monitoring_Reporting data with percentages:", topData_Monitoring_Reporting);

    // --- Chart Rendering Logic ---

    // Create the color scale.
    const color = d3.scaleOrdinal()
        .domain(topData_Monitoring_Reporting.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topData_Monitoring_Reporting.length).reverse());

    // Create the pie layout and arc generator.
    const pie = d3.pie()
        .sort(null) // Do not sort, use the pre-sorted topData_Monitoring_Reporting
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topData_Monitoring_Reporting);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height]) // Center the view
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;"); // General styling

    // Add a Data_Monitoring_Reporting path for each value.
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
    console.log("Data_Monitoring_Reporting chart appended to DOM.");

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
document.addEventListener("DOMContentLoaded", initializeData_Monitoring_ReportingChart);
