// ALMERA_in_Data/2025/5.Radionuclides_measured/5.2International_PT_Horizontal_Bar_2025

const csvDataPath51 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

// --- Data Processing Functions (unchanged) ---
function getInternational_PT_Horizontal_BarCounts(data, International_PT_Horizontal_BarColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[International_PT_Horizontal_BarColumn]) {
            const International_PT_Horizontal_Bars = row[International_PT_Horizontal_BarColumn]
                .split(/;|\r?\n/)   // split on ";" OR newlines
                .map(d => d.trim())
                .filter(d => d.length > 0);
            for (const aff of International_PT_Horizontal_Bars) {
                if (aff) counts.set(aff, (counts.get(aff) || 0) + 1); // Ensure International_PT_Horizontal_Bar string is not empty after trimming
            }
        }
    }
    let result = [];
    let otherCount = 0;
    for (const [name, value] of counts.entries()) {
        if (value === 1) otherCount += 1; // International_PT_Horizontal_Bars with only one occurrence go into "Other"
        else result.push({ name, value });
        }
    if (otherCount > 0) result.push({ name: "Other", value: otherCount });
    return result;
}

function getTopInternational_PT_Horizontal_Bars(International_PT_Horizontal_BarCounts, numTop = 9) {
    let top = International_PT_Horizontal_BarCounts
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, numTop);
    const other = International_PT_Horizontal_BarCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }
    return top;
}
function renderBarChart(container, topInternational_PT_Horizontal_Bar, labsThatAnswered, color) {
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
        .domain([0, d3.max(topInternational_PT_Horizontal_Bar, d => d.value)])
        .nice()
        .range([leftMargin, width - rightMargin]);

    // Y scale for bars
    const y = d3.scaleBand()
        .domain(topInternational_PT_Horizontal_Bar.map(d => d.name))
        .range([topMargin, height - bottomMargin])
        .padding(0.2);

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topInternational_PT_Horizontal_Bar)
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
        .data(topInternational_PT_Horizontal_Bar)
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
async function initializeInternational_PT_Horizontal_BarChart() {
    const container = document.getElementById("International_PT_Horizontal_Bar-chart-container");
    if (!container) return;

    let rawData;
    try { rawData = await d3.csv(csvDataPath51); }
    catch { return container.innerHTML = "<p style='color:red'>Failed to load CSV.</p>"; }

    const headers = Object.keys(rawData[0]).map(h => h.trim());
const International_PT_Horizontal_BarColumn = headers.find(h =>
    h.includes("6.5") && h.includes("What is the name of the PT scheme/s?")
);

if (!International_PT_Horizontal_BarColumn) {
    console.error("Available headers:", headers);
    return container.innerHTML = `<p style='color:red'>Missing 6.5 What is the name of the PT scheme/s? column.</p>`;
}


    const International_PT_Horizontal_BarCounts = getInternational_PT_Horizontal_BarCounts(rawData, International_PT_Horizontal_BarColumn);
    let topInternational_PT_Horizontal_Bar = International_PT_Horizontal_BarCounts.sort((a, b) => d3.descending(a.value, b.value)); // Corrected: Added sorting here

    if (topInternational_PT_Horizontal_Bar.length === 0) {
        return container.innerHTML = "<p>No data to display.</p>";
    }

    const labsThatAnswered = rawData.filter(d => d[International_PT_Horizontal_BarColumn] && d[International_PT_Horizontal_BarColumn].trim() !== "").length;

    const color = d3.scaleOrdinal()
        .domain(topInternational_PT_Horizontal_Bar.map(d => d.name))
        .range(d3.schemeTableau10);

    renderBarChart(container, topInternational_PT_Horizontal_Bar, labsThatAnswered, color);
}
// Run
document.addEventListener("DOMContentLoaded", initializeInternational_PT_Horizontal_BarChart);
