// IMPORTANT: Verify this path carefully!
// This path is relative to the HTML file that loads this JS.
// Assuming your CSV is in the root of your GitHub Pages project (e.g., /ALMERA3.github.io/observable2020Survey.csv)
const csvDataPath3 = "/ALMERA3.github.io/data/Observable2020Survey.csv";

async function initializeAffiliationChart() {
    const container = document.getElementById("affiliation-chart-container");
    if (!container) {
        console.error("Affiliation chart container element #affiliation-chart-container not found.");
        return;
    }

    // Set dimensions for the chart
    const width = 928; // As per your Observable code
    const height = Math.min(width, 500); // As per your Observable code

    let data;
    try {
        data = await d3.csv(csvDataPath3);
        console.log("Affiliation CSV data loaded:", data.length, "records");
    } catch (error) {
        console.error("Error loading affiliation CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load affiliation data. Check console for details (e.g., CSV path).</p>";
        return;
    }

    // --- Data Processing for topAffiliation ---
    const affiliationColumn = "1.11 Affiliation";
    if (!data[0] || !data[0][affiliationColumn]) {
        console.error(`Error: CSV data missing required column "${affiliationColumn}". Available columns:`, Object.keys(data[0] || {}));
        container.innerHTML = `<p style='color: red;'>Error: Missing "${affiliationColumn}" column in CSV data.</p>`;
        return;
    }

    const affiliations = new Map();
    data.forEach(d => {
        const rawAffiliation = d[affiliationColumn];
        if (rawAffiliation) {
            // Split by comma and trim each part, then count
            rawAffiliation.split(',').forEach(a => {
                const trimmedAffiliation = a.trim();
                if (trimmedAffiliation) {
                    affiliations.set(trimmedAffiliation, (affiliations.get(trimmedAffiliation) || 0) + 1);
                }
            });
        }
    });

    // Convert Map to array of objects for d3.pie
    // Sort by value (count) descending, and then by name alphabetically for consistent ordering
    const topAffiliation = Array.from(affiliations, ([name, value]) => ({ name, value }))
                                .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

    if (topAffiliation.length === 0) {
        console.warn("No affiliation data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No affiliation data to display.</p>";
        return;
    }

    // --- Chart Rendering Logic (from your Observable code) ---

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
        .selectAll("path") // Changed from selectAll() to selectAll("path")
        .data(arcs)
        .join("path")
            .attr("fill", d => color(d.data.name))
            .attr("d", arc)
        .append("title") // Tooltip on hover
            .text(d => `${d.data.name}: ${d.data.value.toLocaleString("en-US")}`);

    // Add a legend.
    const legend = svg.append("g")
        .attr("transform", `translate(${width / 2 - 200}, ${-height / 2 + 20})`) // Position adjusted for clarity
        .attr("font-family", "sans-serif") // Better to use a specific font stack or inherit
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
    console.log("Affiliation chart appended to DOM.");

    // Handle responsiveness: redraw on window resize
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = Math.min(newWidth, 500); // Maintain aspect ratio if desired or keep fixed height
        svg.attr("width", newWidth)
           .attr("height", newHeight)
           .attr("viewBox", [-newWidth / 2, -newHeight / 2, newWidth, newHeight]);

        arc.outerRadius(Math.min(newWidth, newHeight) / 2 - 1);
        svg.selectAll("path").attr("d", arc); // Update arc paths

        // Reposition legend (optional, could be static)
        legend.attr("transform", `translate(${newWidth / 2 - 200}, ${-newHeight / 2 + 20})`);
    });
}

// Initialize the chart when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeAffiliationChart);
