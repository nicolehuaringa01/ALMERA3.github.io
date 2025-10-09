// ALMERA_in_Data/2020/6.Quality_Management_and_Reporting/6.9Decay_Library.js

const csvDataPath9 = "/ALMERA3.github.io/data/2020_ALMERA_Capabilities_Survey.csv"; // User-provided path

// This function processes the raw data to count Decay_Librarys
function getDecay_LibraryCounts(data, Decay_LibraryColumn) {
    const counts = new Map();

    for (const row of data) {
        if (row[Decay_LibraryColumn]) {
            // Split by semicolon as per your Observable notebook's implicit logic
            const Decay_Librarys = row[Decay_LibraryColumn].split(";").map(d => d.trim());
            for (const aff of Decay_Librarys) {
                if (aff) { // Ensure Decay_Library string is not empty after trimming
                    counts.set(aff, (counts.get(aff) || 0) + 1);
                }
            }
        }
    }

    let result = [];
    let otherCount = 0;

    for (const [name, value] of counts.entries()) {
        if (value === 1) { // Decay_Librarys with only one occurrence go into "Other"
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

// This function selects the top N Decay_Librarys, including "Other" if present
function getTopDecay_Librarys(Decay_LibraryCounts, numTop = 12) {
    let top = Decay_LibraryCounts
        .slice() // Create a shallow copy to sort without modifying original
        .sort((a, b) => d3.descending(a.value, b.value)) // Sort by value descending
        .slice(0, numTop); // Take the top N

    // Ensure "Other" is included if it's one of the top N or if it exists and wasn't in top N
    const other = Decay_LibraryCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }

    return top;
}


async function initializeDecay_LibraryChart() {
    const container = document.getElementById("Decay_Library-chart-container");
    if (!container) {
        console.error("Decay_Library chart container element #Decay_Library-chart-container not found.");
        return;
    }

    // Set dimensions for the chart
    const width = 928;
    const height = Math.min(width, 500);

    let rawData;
    try {
        rawData = await d3.csv(csvDataPath9);
        console.log("Decay_Library CSV raw data loaded:", rawData.length, "records");
    } catch (error) {
        console.error("Error loading Decay_Library CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load Decay_Library data. Check console for details (e.g., CSV path).</p>";
        return;
    }

    // --- Data Processing using the new functions ---
    const Decay_LibraryColumn = "6.9 What decay data library is used?"; // User-provided column name
    if (!rawData[0] || !rawData[0][Decay_LibraryColumn]) {
        console.error(`Error: CSV data missing required column "${Decay_LibraryColumn}". Available columns:`, rawData.length > 0 ? Object.keys(rawData[0]) : "No data rows.");
        container.innerHTML = `<p style='color: red;'>Error: Missing "${Decay_LibraryColumn}" column in CSV data.</p>`;
        return;
    }

    const Decay_LibraryCounts = getDecay_LibraryCounts(rawData, Decay_LibraryColumn);
    const topDecay_Library = getTopDecay_Librarys(Decay_LibraryCounts, 6); // Get top 6 Decay_Librarys

    if (topDecay_Library.length === 0) {
        console.warn("No valid Decay_Library data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No Decay_Library data to display after filtering/processing.</p>";
        return;
    }

     // --- Calculate total and percentages for the tooltip ---
    const totalDecay_LibrarysCount = d3.sum(topDecay_Library, d => d.value);

    // Add percentage to each Decay_Library object in topDecay_Library
    topDecay_Library.forEach(d => {
        d.percent = (totalDecay_LibrarysCount > 0) ? (d.value / totalDecay_LibrarysCount) : 0;
    });

    console.log("Processed topDecay_Library data with percentages:", topDecay_Library);

    // --- Chart Rendering Logic ---

    // Create the color scale.
    const color = d3.scaleOrdinal()
        .domain(topDecay_Library.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topDecay_Library.length).reverse());

    // Create the pie layout and arc generator.
    const pie = d3.pie()
        .sort(null) // Do not sort, use the pre-sorted topDecay_Library
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topDecay_Library);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height]) // Center the view
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;"); // General styling

    // Add a Decay_Library path for each value.
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
    console.log("Decay_Library chart appended to DOM.");

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
document.addEventListener("DOMContentLoaded", initializeDecay_LibraryChart);
