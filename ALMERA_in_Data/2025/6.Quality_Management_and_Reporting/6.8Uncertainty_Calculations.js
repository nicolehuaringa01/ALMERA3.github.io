// ALMERA_in_Data/2025/6.Quality_Management_and_Reporting/6.8Uncertainty_Calculations.js

const csvDataPath8 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

// --- Data Processing Functions (unchanged) ---
function getUncertainty_CalculationsCounts(data, Uncertainty_CalculationsColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[Uncertainty_CalculationsColumn]) {
            const Uncertainty_Calculationss = row[Uncertainty_CalculationsColumn]
                .split(/;|\r?\n/)   // split on ";" OR newlines
                .map(d => d.trim())
                .filter(d => d.length > 0);
            for (const aff of Uncertainty_Calculationss) {
                if (aff) counts.set(aff, (counts.get(aff) || 0) + 1); // Ensure Uncertainty_Calculations string is not empty after trimming
            }
        }
    }
    let result = [];
    let otherCount = 0;
    for (const [name, value] of counts.entries()) {
        if (value === 1) otherCount += 1; // Uncertainty_Calculationss with only one occurrence go into "Other"
        else result.push({ name, value });
        }
    if (otherCount > 0) result.push({ name: "Other", value: otherCount });
    return result;
}

function getTopUncertainty_Calculationss(Uncertainty_CalculationsCounts, numTop = 9) {
    let top = Uncertainty_CalculationsCounts
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, numTop);
    const other = Uncertainty_CalculationsCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }
    return top;
}
function renderBarChart(container, topUncertainty_Calculations, labsThatAnswered, color) {
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
        .domain([0, d3.max(topUncertainty_Calculations, d => d.value)])
        .nice()
        .range([leftMargin, width - rightMargin]);

    // Y scale for bars
    const y = d3.scaleBand()
        .domain(topUncertainty_Calculations.map(d => d.name))
        .range([topMargin, height - bottomMargin])
        .padding(0.2);

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topUncertainty_Calculations)
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
        .data(topUncertainty_Calculations)
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
async function initializeUncertainty_CalculationsChart() {
    const container = document.getElementById("Uncertainty_Calculations-chart-container");
    if (!container) return;

    let rawData;
    try { rawData = await d3.csv(csvDataPath8); }
    catch { return container.innerHTML = "<p style='color:red'>Failed to load CSV.</p>"; }

    const headers = Object.keys(rawData[0]).map(h => h.trim());
const Uncertainty_CalculationsColumn = headers.find(h =>
    h.includes("6.8") && h.includes("What uncertainty and characteristic limit calculations are used by the lab?")
);

if (!Uncertainty_CalculationsColumn) {
    console.error("Available headers:", headers);
    return container.innerHTML = `<p style='color:red'>Missing 6.5 What is the name of the PT scheme/s? column.</p>`;
}


    const Uncertainty_CalculationsCounts = getUncertainty_CalculationsCounts(rawData, Uncertainty_CalculationsColumn);
    let topUncertainty_Calculations = Uncertainty_CalculationsCounts.sort((a, b) => d3.descending(a.value, b.value)); // Corrected: Added sorting here

    if (topUncertainty_Calculations.length === 0) {
        return container.innerHTML = "<p>No data to display.</p>";
    }

    const labsThatAnswered = rawData.filter(d => d[Uncertainty_CalculationsColumn] && d[Uncertainty_CalculationsColumn].trim() !== "").length;

    const color = d3.scaleOrdinal()
        .domain(topUncertainty_Calculations.map(d => d.name))
        .range(d3.schemeTableau10);

    renderBarChart(container, topUncertainty_Calculations, labsThatAnswered, color);
}
// Run
document.addEventListener("DOMContentLoaded", initializeUncertainty_CalculationsChart);
