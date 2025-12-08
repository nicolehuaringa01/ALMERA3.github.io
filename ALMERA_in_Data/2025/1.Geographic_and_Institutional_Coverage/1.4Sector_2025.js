// ALMERA_in_Data/2025/1.Geographic_and_Institutional_Coverage/1.4Sector_2025.js

const csvDataPath4 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

// --- Data Processing Functions (unchanged) ---
function getsectorCounts(data, sectorColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[sectorColumn]) {
            const sectors = row[sectorColumn]
                .split(/;|\r?\n/)   // split on ";" OR newlines
                .map(d => d.trim())
                .filter(d => d.length > 0);
            for (const aff of sectors) {
                if (aff) counts.set(aff, (counts.get(aff) || 0) + 1); // Ensure sector string is not empty after trimming
            }
        }
    }
    let result = [];
    let otherCount = 0;
    for (const [name, value] of counts.entries()) {
        if (value === 1) otherCount += 1; // sectors with only one occurrence go into "Other"
        else result.push({ name, value });
        }
    if (otherCount > 0) result.push({ name: "Other", value: otherCount });
    return result;
}

function getTopsectors(sectorCounts, numTop = 9) {
    let top = sectorCounts
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, numTop);
    const other = sectorCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }
    return top;
}
function renderBarChart(container, topsector, labsThatAnswered, color) {
    const width = 928, height = 500;

    // Adjust vertical space since we are removing the legend
    const topMargin = 50;
    const bottomMargin = 50;
    const leftMargin = 200; // Increased margin for long labels
    const rightMargin = 30;

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

    // X scale for bars
    const x = d3.scaleLinear()
        .domain([0, d3.max(topsector, d => d.value)])
        .nice()
        .range([leftMargin, width - rightMargin]);

    // Y scale for bars
    const y = d3.scaleBand()
        .domain(topsector.map(d => d.name))
        .range([topMargin, height - bottomMargin])
        .padding(0.2);

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topsector)
        .join("rect")
            .attr("x", leftMargin)
            .attr("y", d => y(d.name))
            .attr("width", d => x(d.value) - leftMargin)
            .attr("height", y.bandwidth())
            .attr("fill", d => color(d.name))
        .append("title")
            .text(d => {
                const pct = ((d.value / labsThatAnswered) * 100).toFixed(1);
                return `${d.name}: ${d.value} labs (${pct}%)`;
            });

    // Percent + counts labels at end of bars
    svg.append("g")
        .selectAll("text.value")
        .data(topsector)
        .join("text")
            .attr("class", "value")
            .attr("x", d => x(d.value) + 5)
            .attr("y", d => y(d.name) + y.bandwidth() / 2)
            .attr("dominant-baseline", "middle")
            .attr("fill", "black")
            .text(d => {
                const pct = ((d.value / labsThatAnswered) * 100).toFixed(1);
                return `${d.value} (${pct}%)`;
            });

    // X axis

    svg.append("g")
    .attr("transform", `translate(${leftMargin},0)`)
    .call(d3.axisLeft(y))
    .selectAll(".tick text") // Select the text elements for the tick marks
    .attr("fill", d => color(d)) // Apply the color scale to the text itself
    .attr("font-weight", "bold"); // Optional: make text bold for emphasis

    // Y axis (now with labels!)
    svg.append("g")
        .attr("transform", `translate(${leftMargin},0)`)
        .call(d3.axisLeft(y)); // Corrected: removed `.tickFormat('')` to show labels

    // Total labs (top band)
    svg.append("text")
        .attr("x", leftMargin)
        .attr("y", 20)
        .attr("text-anchor", "start")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(`Total laboratories that answered: ${labsThatAnswered.toLocaleString("en-US")}`);

    // The entire legend section has been completely removed from here.

    container.appendChild(svg.node());
}
// --- Main Init ---
async function initializesectorChart() {
    const container = document.getElementById("sector-chart-container");
    if (!container) return;

    let rawData;
    try { rawData = await d3.csv(csvDataPath4); }
    catch { return container.innerHTML = "<p style='color:red'>Failed to load CSV.</p>"; }

    const sectorColumn = "1.12 Type/Sector in which the laboratory falls";
    if (!rawData[0] || !rawData[0][sectorColumn]) {
        return container.innerHTML = `<p style='color:red'>Missing "${sectorColumn}" column.</p>`;
    }

    const sectorCounts = getsectorCounts(rawData, sectorColumn);
    let topsector = sectorCounts.sort((a, b) => d3.descending(a.value, b.value)); // Corrected: Added sorting here

    if (topsector.length === 0) {
        return container.innerHTML = "<p>No data to display.</p>";
    }

    const labsThatAnswered = rawData.filter(d => d[sectorColumn] && d[sectorColumn].trim() !== "").length;

    const color = d3.scaleOrdinal()
        .domain(topsector.map(d => d.name))
        .range(d3.schemeTableau10);

    renderBarChart(container, topsector, labsThatAnswered, color);
}
// Run
document.addEventListener("DOMContentLoaded", initializesectorChart);
