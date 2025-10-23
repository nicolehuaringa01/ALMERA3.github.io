// ALMERA_in_Data/2025/6.Quality_Management_and_Reporting/6.13Databases_Used_to_Report_Data_Bar.js

const csvDataPath_6_13_1 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

// --- Data Processing Functions (unchanged) ---
function getDatabases_Used_to_Report_Data_BarCounts(data, Databases_Used_to_Report_Data_BarColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[Databases_Used_to_Report_Data_BarColumn]) {
            const Databases_Used_to_Report_Data_Bars = row[Databases_Used_to_Report_Data_BarColumn]
                .split(/;|\r?\n/)   // split on ";" OR newlines
                .map(d => d.trim())
                .filter(d => d.length > 0);
            for (const aff of Databases_Used_to_Report_Data_Bars) {
                if (aff) counts.set(aff, (counts.get(aff) || 0) + 1); // Ensure Databases_Used_to_Report_Data_Bar string is not empty after trimming
            }
        }
    }
    let result = [];
    let otherCount = 0;
    for (const [name, value] of counts.entries()) {
        if (value === 1) otherCount += 1; // Databases_Used_to_Report_Data_Bars with only one occurrence go into "Other"
        else result.push({ name, value });
        }
    if (otherCount > 0) result.push({ name: "Other", value: otherCount });
    return result;
}

function getTopDatabases_Used_to_Report_Data_Bars(Databases_Used_to_Report_Data_BarCounts, numTop = 9) {
    let top = Databases_Used_to_Report_Data_BarCounts
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, numTop);
    const other = Databases_Used_to_Report_Data_BarCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }
    return top;
}
function renderBarChart(container, topDatabases_Used_to_Report_Data_Bar, labsThatAnswered, color) {
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
        .domain([0, d3.max(topDatabases_Used_to_Report_Data_Bar, d => d.value)])
        .nice()
        .range([leftMargin, width - rightMargin]);

    // Y scale for bars
    const y = d3.scaleBand()
        .domain(topDatabases_Used_to_Report_Data_Bar.map(d => d.name))
        .range([topMargin, height - bottomMargin])
        .padding(0.2);

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topDatabases_Used_to_Report_Data_Bar)
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
        .data(topDatabases_Used_to_Report_Data_Bar)
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
        .attr("transform", `translate(0,${height - bottomMargin})`)
        .call(d3.axisBottom(x));

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
async function initializeDatabases_Used_to_Report_Data_BarChart() {
    const container = document.getElementById("Databases_Used_to_Report_Data_Bar-chart-container");
    if (!container) return;

    let rawData;
    try { rawData = await d3.csv(csvDataPath_6_13_1); }
    catch { return container.innerHTML = "<p style='color:red'>Failed to load CSV.</p>"; }

    const headers = Object.keys(rawData[0]).map(h => h.trim());
const Databases_Used_to_Report_Data_BarColumn = headers.find(h =>
    h.includes("6.10") && h.includes("Which database(s) is the routine monitoring data reported to?")
);

if (!Databases_Used_to_Report_Data_BarColumn) {
    console.error("Available headers:", headers);
    return container.innerHTML = `<p style='color:red'>Missing 6.5 What is the name of the PT scheme/s? column.</p>`;
}


    const Databases_Used_to_Report_Data_BarCounts = getDatabases_Used_to_Report_Data_BarCounts(rawData, Databases_Used_to_Report_Data_BarColumn);
    let topDatabases_Used_to_Report_Data_Bar = Databases_Used_to_Report_Data_BarCounts.sort((a, b) => d3.descending(a.value, b.value)); // Corrected: Added sorting here

    if (topDatabases_Used_to_Report_Data_Bar.length === 0) {
        return container.innerHTML = "<p>No data to display.</p>";
    }

    const labsThatAnswered = rawData.filter(d => d[Databases_Used_to_Report_Data_BarColumn] && d[Databases_Used_to_Report_Data_BarColumn].trim() !== "").length;

    const color = d3.scaleOrdinal()
        .domain(topDatabases_Used_to_Report_Data_Bar.map(d => d.name))
        .range(d3.schemeTableau10);

    renderBarChart(container, topDatabases_Used_to_Report_Data_Bar, labsThatAnswered, color);
}
// Run
document.addEventListener("DOMContentLoaded", initializeDatabases_Used_to_Report_Data_BarChart);
