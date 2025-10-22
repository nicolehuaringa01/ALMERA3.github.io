// ALMERA_in_Data/2025/6.Quality_Management_and_Reporting/6.12Frequency_of_Reporting_to_National_Authorities.js

const csvDataPath12 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv"; // User-provided path

// This function processes the raw data to count Frequency_of_Reporting_to_National_Authoritiess
function getFrequency_of_Reporting_to_National_AuthoritiesCounts(data, Frequency_of_Reporting_to_National_AuthoritiesColumn) {
    const counts = new Map();

    for (const row of data) {
        if (row[Frequency_of_Reporting_to_National_AuthoritiesColumn]) {
            // Split by semicolon as per your Observable notebook's implicit logic
            const Frequency_of_Reporting_to_National_Authoritiess = row[Frequency_of_Reporting_to_National_AuthoritiesColumn].split(/;|\n|\r/).map(d => d.trim());
            for (const aff of Frequency_of_Reporting_to_National_Authoritiess) {
                if (aff) { // Ensure Frequency_of_Reporting_to_National_Authorities string is not empty after trimming
                    counts.set(aff, (counts.get(aff) || 0) + 1);
                }
            }
        }
    }

    let result = [];
    let otherCount = 0;

    for (const [name, value] of counts.entries()) {
        if (value === 1) { // Frequency_of_Reporting_to_National_Authoritiess with only one occurrence go into "Other"
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

// This function selects the top N Frequency_of_Reporting_to_National_Authoritiess, including "Other" if present
function getTopFrequency_of_Reporting_to_National_Authoritiess(Frequency_of_Reporting_to_National_AuthoritiesCounts, numTop = 12) {
    let top = Frequency_of_Reporting_to_National_AuthoritiesCounts
        .slice() // Create a shallow copy to sort without modifying original
        .sort((a, b) => d3.descending(a.value, b.value)) // Sort by value descending
        .slice(0, numTop); // Take the top N

    // Ensure "Other" is included if it's one of the top N or if it exists and wasn't in top N
    const other = Frequency_of_Reporting_to_National_AuthoritiesCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }

    return top;
}


async function initializeFrequency_of_Reporting_to_National_AuthoritiesChart() {
    const container = document.getElementById("Frequency_of_Reporting_to_National_Authorities-chart-container");
    if (!container) {
        console.error("Frequency_of_Reporting_to_National_Authorities chart container element #Frequency_of_Reporting_to_National_Authorities-chart-container not found.");
        return;
    }

    // Set dimensions for the chart
    const width = 928;
    const height = Math.min(width, 500);

    let rawData;
    try {
        rawData = await d3.csv(csvDataPath12);
        console.log("Frequency_of_Reporting_to_National_Authorities CSV raw data loaded:", rawData.length, "records");
    } catch (error) {
        console.error("Error loading Frequency_of_Reporting_to_National_Authorities CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load Frequency_of_Reporting_to_National_Authorities data. Check console for details (e.g., CSV path).</p>";
        return;
    }

    // --- Data Processing using the new functions ---
     const headers = Object.keys(rawData[0]).map(h => h.trim());
const Frequency_of_Reporting_to_National_AuthoritiesColumn = headers.find(h =>
    h.includes("6.9") && h.includes("What is the frequency with which results are reported to national authorities?")
);

if (!Frequency_of_Reporting_to_National_AuthoritiesColumn) {
    console.error("Available headers:", headers);
    return container.innerHTML = `<p style='color:red'>Missing 6.9 What is the frequency with which results are reported to national authorities?.</p>`;
}

    const Frequency_of_Reporting_to_National_AuthoritiesCounts = getFrequency_of_Reporting_to_National_AuthoritiesCounts(rawData, Frequency_of_Reporting_to_National_AuthoritiesColumn);
    const topFrequency_of_Reporting_to_National_Authorities = getTopFrequency_of_Reporting_to_National_Authoritiess(Frequency_of_Reporting_to_National_AuthoritiesCounts, 6); // Get top 6 Frequency_of_Reporting_to_National_Authoritiess

    if (topFrequency_of_Reporting_to_National_Authorities.length === 0) {
        console.warn("No valid Frequency_of_Reporting_to_National_Authorities data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No Frequency_of_Reporting_to_National_Authorities data to display after filtering/processing.</p>";
        return;
    }

     // --- Calculate total and percentages for the tooltip ---
    const totalFrequency_of_Reporting_to_National_AuthoritiessCount = d3.sum(topFrequency_of_Reporting_to_National_Authorities, d => d.value);

    // Add percentage to each Frequency_of_Reporting_to_National_Authorities object in topFrequency_of_Reporting_to_National_Authorities
    topFrequency_of_Reporting_to_National_Authorities.forEach(d => {
        d.percent = (totalFrequency_of_Reporting_to_National_AuthoritiessCount > 0) ? (d.value / totalFrequency_of_Reporting_to_National_AuthoritiessCount) : 0;
    });

    console.log("Processed topFrequency_of_Reporting_to_National_Authorities data with percentages:", topFrequency_of_Reporting_to_National_Authorities);

    // --- Chart Rendering Logic ---

    // Create the color scale.
    const color = d3.scaleOrdinal()
        .domain(topFrequency_of_Reporting_to_National_Authorities.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topFrequency_of_Reporting_to_National_Authorities.length).reverse());

    // Create the pie layout and arc generator.
    const pie = d3.pie()
        .sort(null) // Do not sort, use the pre-sorted topFrequency_of_Reporting_to_National_Authorities
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topFrequency_of_Reporting_to_National_Authorities);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height]) // Center the view
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;"); // General styling

    // Add a Frequency_of_Reporting_to_National_Authorities path for each value.
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
    console.log("Frequency_of_Reporting_to_National_Authorities chart appended to DOM.");

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
document.addEventListener("DOMContentLoaded", initializeFrequency_of_Reporting_to_National_AuthoritiesChart);
