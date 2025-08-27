// ALMERA3.github.io/ALMERA_in_Data/1.Geographic_and_Institutional_Coverage/1.3Affiliation.js
const csvDataPath3 = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // User-provided path

// This function processes the raw data to count affiliations
function getAffiliationCounts(data, affiliationColumn) {
    const counts = new Map();

    for (const row of data) {
        if (row[affiliationColumn]) {
            // Split by semicolon OR newlines (to handle Jotform exports)
          const affiliations = row[affiliationColumn]
            .split(/;|\r?\n/)   // split on ";" OR "\n" (Windows uses "\r\n")
            .map(d => d.trim())
            .filter(d => d.length > 0); // remove empty entries
            for (const aff of affiliations) {
                if (aff) { // Ensure affiliation string is not empty after trimming
                    counts.set(aff, (counts.get(aff) || 0) + 1);
                }
            }
        }
    }

    let result = [];
    let otherCount = 0;

    for (const [name, value] of counts.entries()) {
        if (value === 1) { // Affiliations with only one occurrence go into "Other"
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

// This function selects the top N affiliations, including "Other" if present
function getTopAffiliations(affiliationCounts, numTop = 6) {
    let top = affiliationCounts
        .slice() // Create a shallow copy to sort without modifying original
        .sort((a, b) => d3.descending(a.value, b.value)) // Sort by value descending
        .slice(0, numTop); // Take the top N

    // Ensure "Other" is included if it's one of the top N or if it exists and wasn't in top N
    const other = affiliationCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }

    return top;
}


async function initializeAffiliationChart() {
    const container = document.getElementById("affiliation-chart-container");
    if (!container) {
        console.error("Affiliation chart container element #affiliation-chart-container not found.");
        return;
    }

    // Set dimensions for the chart
    const width = 928;
    const height = Math.min(width, 500);

    let rawData;
    try {
        rawData = await d3.csv(csvDataPath3);
        console.log("Affiliation CSV raw data loaded:", rawData.length, "records");
    } catch (error) {
        console.error("Error loading affiliation CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load affiliation data. Check console for details (e.g., CSV path).</p>";
        return;
    }

    // --- Data Processing using the new functions ---
    const affiliationColumn = "1.11 Affiliation"; // User-provided column name
    if (!rawData[0] || !rawData[0][affiliationColumn]) {
        console.error(`Error: CSV data missing required column "${affiliationColumn}". Available columns:`, rawData.length > 0 ? Object.keys(rawData[0]) : "No data rows.");
        container.innerHTML = `<p style='color: red;'>Error: Missing "${affiliationColumn}" column in CSV data.</p>`;
        return;
    }

    const affiliationCounts = getAffiliationCounts(rawData, affiliationColumn);
    let topAffiliation = getTopAffiliations(affiliationCounts, 6); // Get top 6 affiliations

    if (topAffiliation.length === 0) {
        console.warn("No valid affiliation data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No affiliation data to display after filtering/processing.</p>";
        return;
    }

    // --- Calculate total and percentages for the tooltip ---
    const totalAffiliationsCount = d3.sum(topAffiliation, d => d.value);

    // Count only laboratories that actually responded (non-empty affiliation column)
    const labsThatAnswered = rawData.filter(d => d[affiliationColumn] && d[affiliationColumn].trim() !== "").length;

    // Add percentage to each affiliation object in topAffiliation
    topAffiliation.forEach(d => {
        d.percent = (totalAffiliationsCount > 0) ? (d.value / totalAffiliationsCount) : 0;
    });

    console.log("Processed topAffiliation data with percentages:", topAffiliation);

    // --- Chart Rendering Logic ---

    // Create the color scale.
    const color = d3.scaleOrdinal()
        .domain(topAffiliation.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topAffiliation.length).reverse());

    // Create the pie layout and arc generator.
    const pie = d3.pie()
        .sort(null) // Do not sort, use the pre-sorted topAffiliation
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topAffiliation);

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
        .text(`Total responses: ${totalAffiliationsCount.toLocaleString("en-US")}`);

    svg.append("text")
        .attr("x", -width / 2 + 10)
        .attr("y", -height / 2 + 40)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .text(`Total laboratories that answered: ${labsThatAnswered.toLocaleString("en-US")}`);

    // Append the SVG to the designated container
    container.appendChild(svg.node());
    console.log("Affiliation chart appended to DOM.");

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
document.addEventListener("DOMContentLoaded", initializeAffiliationChart);
