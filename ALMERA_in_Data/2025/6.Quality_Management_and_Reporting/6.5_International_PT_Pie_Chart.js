// ALMERA_in_Data/2025/6.Quality_Management_and_Reporting/6.5_International_PT_Pie_Chart

const csvDataPath52 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

// --- Data Processing Functions (unchanged) ---
function getInternational_PTCounts(data, International_PTColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[International_PTColumn]) {
            const International_PTs = row[International_PTColumn]
                .split(/;|\r?\n/)   // split on ";" OR newlines
                .map(d => d.trim())
                .filter(d => d.length > 0);
            for (const aff of International_PTs) {
                if (aff) counts.set(aff, (counts.get(aff) || 0) + 1); // Ensure International_PT string is not empty after trimming
            }
        }
    }
    let result = [];
    let otherCount = 0;
    for (const [name, value] of counts.entries()) {
        if (value === 1) otherCount += 1; // International_PTs with only one occurrence go into "Other"
        else result.push({ name, value });
        }
    if (otherCount > 0) result.push({ name: "Other", value: otherCount });
    return result;
}

function getTopInternational_PTs(International_PTCounts, numTop = 9) {
    let top = International_PTCounts
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, numTop);
    const other = International_PTCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }
    return top;
}
function renderBarChart(container, topInternational_PT, labsThatAnswered, color) {
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
        .domain([0, d3.max(topInternational_PT, d => d.value)])
        .nice()
        .range([leftMargin, width - rightMargin]);

    // Y scale for bars
    const y = d3.scaleBand()
        .domain(topInternational_PT.map(d => d.name))
        .range([topMargin, height - bottomMargin])
        .padding(0.2);

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topInternational_PT)
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
        .data(topInternational_PT)
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
async function initializeInternational_PTChart() {
    const container = document.getElementById("International_PT-chart-container");
    if (!container) return;

    let rawData;
    try { rawData = await d3.csv(csvDataPath52); }
    catch { return container.innerHTML = "<p style='color:red'>Failed to load CSV.</p>"; }

    const International_PTColumn = "6.5 What is the name of the PT scheme/s?";
    if (!rawData[0] || !rawData[0][International_PTColumn]) {
        return container.innerHTML = `<p style='color:red'>Missing "${International_PTColumn}" column.</p>`;
    }

    const International_PTCounts = getInternational_PTCounts(rawData, International_PTColumn);
    let topInternational_PT = International_PTCounts.sort((a, b) => d3.descending(a.value, b.value)); // Corrected: Added sorting here

    if (topInternational_PT.length === 0) {
        return container.innerHTML = "<p>No data to display.</p>";
    }

    const labsThatAnswered = rawData.filter(d => d[International_PTColumn] && d[International_PTColumn].trim() !== "").length;

    const color = d3.scaleOrdinal()
        .domain(topInternational_PT.map(d => d.name))
        .range(d3.schemeTableau10);

    renderBarChart(container, topInternational_PT, labsThatAnswered, color);
}
// Run
document.addEventListener("DOMContentLoaded", initializeInternational_PTChart);
