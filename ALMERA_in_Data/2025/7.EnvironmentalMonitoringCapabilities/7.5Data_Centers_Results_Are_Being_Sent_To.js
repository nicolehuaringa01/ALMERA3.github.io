// ALMERA_in_Data/2025/7.EnvironmentalMonitoringCapabilities/7.5Data_Centers_Results_Are_Being_Sent_To.js
const csvDataPath51 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv"; // User-provided path

// --- Data Processing Functions (unchanged) ---
function getData_Centers_Results_Are_Being_Sent_ToCounts(data, Data_Centers_Results_Are_Being_Sent_ToColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[Data_Centers_Results_Are_Being_Sent_ToColumn]) {
            const Data_Centers_Results_Are_Being_Sent_Tos = row[Data_Centers_Results_Are_Being_Sent_ToColumn]
                .split(/;|\r?\n/)   // split on ";" OR newlines
                .map(d => d.trim())
                .filter(d => d.length > 0);
            for (const aff of Data_Centers_Results_Are_Being_Sent_Tos) {
                if (aff) counts.set(aff, (counts.get(aff) || 0) + 1); // Ensure Data_Centers_Results_Are_Being_Sent_To string is not empty after trimming
            }
        }
    }
    let result = [];
    let otherCount = 0;
    for (const [name, value] of counts.entries()) {
        if (value === 1) otherCount += 1; // Data_Centers_Results_Are_Being_Sent_Tos with only one occurrence go into "Other"
        else result.push({ name, value });
        }
    if (otherCount > 0) result.push({ name: "Other", value: otherCount });
    return result;
}

function getTopData_Centers_Results_Are_Being_Sent_Tos(Data_Centers_Results_Are_Being_Sent_ToCounts, numTop = 9) {
    let top = Data_Centers_Results_Are_Being_Sent_ToCounts
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, numTop);
    const other = Data_Centers_Results_Are_Being_Sent_ToCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }
    return top;
}
function renderBarChart(container, topData_Centers_Results_Are_Being_Sent_To, labsThatAnswered, color) {
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
        .domain([0, d3.max(topData_Centers_Results_Are_Being_Sent_To, d => d.value)])
        .nice()
        .range([leftMargin, width - rightMargin]);

    // Y scale for bars
    const y = d3.scaleBand()
        .domain(topData_Centers_Results_Are_Being_Sent_To.map(d => d.name))
        .range([topMargin, height - bottomMargin])
        .padding(0.2);

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topData_Centers_Results_Are_Being_Sent_To)
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
        .data(topData_Centers_Results_Are_Being_Sent_To)
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
async function initializeData_Centers_Results_Are_Being_Sent_ToChart() {
    const container = document.getElementById("Data_Centers_Results_Are_Being_Sent_To-chart-container");
    if (!container) return;

    let rawData;
    try { rawData = await d3.csv(csvDataPath51); }
    catch { return container.innerHTML = "<p style='color:red'>Failed to load CSV.</p>"; }

    const headers = Object.keys(rawData[0]).map(h => h.trim());
const Data_Centers_Results_Are_Being_Sent_ToColumn = headers.find(h =>
    h.includes("7.5") && h.includes("To which data centre are the results being transmitted?")
);

if (!Data_Centers_Results_Are_Being_Sent_ToColumn) {
    console.error("Available headers:", headers);
    return container.innerHTML = `<p style='color:red'>Missing 7.5 To which data centre are the results being transmitted?</p>`;
}


    const Data_Centers_Results_Are_Being_Sent_ToCounts = getData_Centers_Results_Are_Being_Sent_ToCounts(rawData, Data_Centers_Results_Are_Being_Sent_ToColumn);
    let topData_Centers_Results_Are_Being_Sent_To = Data_Centers_Results_Are_Being_Sent_ToCounts.sort((a, b) => d3.descending(a.value, b.value)); // Corrected: Added sorting here

    if (topData_Centers_Results_Are_Being_Sent_To.length === 0) {
        return container.innerHTML = "<p>No data to display.</p>";
    }

    const labsThatAnswered = rawData.filter(d => d[Data_Centers_Results_Are_Being_Sent_ToColumn] && d[Data_Centers_Results_Are_Being_Sent_ToColumn].trim() !== "").length;

    const color = d3.scaleOrdinal()
        .domain(topData_Centers_Results_Are_Being_Sent_To.map(d => d.name))
        .range(d3.schemeTableau10);

    renderBarChart(container, topData_Centers_Results_Are_Being_Sent_To, labsThatAnswered, color);
}
// Run
document.addEventListener("DOMContentLoaded", initializeData_Centers_Results_Are_Being_Sent_ToChart);
