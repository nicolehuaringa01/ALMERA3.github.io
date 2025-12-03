// ALMERA_in_Data/2025/8.RegulatoryFramework/8.3Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Deposition.js
const csvDataPath31 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

// --- Data Processing Functions (unchanged) ---
function getApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionCounts(data, Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionColumn]) {
            const Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Depositions = row[Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionColumn]
                .split(/;|\r?\n/)   // split on ";" OR newlines
                .map(d => d.trim())
                .filter(d => d.length > 0);
            for (const aff of Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Depositions) {
                if (aff) counts.set(aff, (counts.get(aff) || 0) + 1); // Ensure Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Deposition string is not empty after trimming
            }
        }
    }
    let result = [];
    let otherCount = 0;
    for (const [name, value] of counts.entries()) {
        if (value === 1) otherCount += 1; // Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Depositions with only one occurrence go into "Other"
        else result.push({ name, value });
        }
    if (otherCount > 0) result.push({ name: "Other", value: otherCount });
    return result;
}

function getTopApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Depositions(Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionCounts, numTop = 9) {
    let top = Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionCounts
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, numTop);
    const other = Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }
    return top;
}
function renderBarChart(container, topApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Deposition, labsThatAnswered, color) {
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
        .domain([0, d3.max(topApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Deposition, d => d.value)])
        .nice()
        .range([leftMargin, width - rightMargin]);

    // Y scale for bars
    const y = d3.scaleBand()
        .domain(topApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Deposition.map(d => d.name))
        .range([topMargin, height - bottomMargin])
        .padding(0.2);

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Deposition)
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
        .data(topApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Deposition)
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
async function initializeApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionChart() {
    const container = document.getElementById("Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Deposition-chart-container");
    if (!container) return;

    let rawData;
    try { rawData = await d3.csv(csvDataPath31); }
    catch { return container.innerHTML = "<p style='color:red'>Failed to load CSV.</p>"; }

    const headers = Object.keys(rawData[0]).map(h => h.trim());

    const Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionColumn = headers.find(h =>
    h.includes("8.3") && h.includes("Select the applicable standards from the list below:")
);
    if (!Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionColumn) {
    console.error("Available headers:", headers);
    return container.innerHTML = `<p style='color:red'>Missing 8.3 Select the applicable standards from the list below: column.</p>`;
}

    const Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionCounts = getApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionCounts(rawData, Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionColumn);
    let topApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Deposition = Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionCounts.sort((a, b) => d3.descending(a.value, b.value)); // Corrected: Added sorting here

    if (topApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Deposition.length === 0) {
        return container.innerHTML = "<p>No data to display.</p>";
    }

    const labsThatAnswered = rawData.filter(d => d[Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionColumn] && d[Applicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionColumn].trim() !== "").length;

    const color = d3.scaleOrdinal()
        .domain(topApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Deposition.map(d => d.name))
        .range(d3.schemeTableau10);

    renderBarChart(container, topApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_Deposition, labsThatAnswered, color);
}
// Run
document.addEventListener("DOMContentLoaded", initializeApplicable_Standards_in_Food_Drinking_Water_And_Atmospheric_Aerosols_and_DepositionChart);
