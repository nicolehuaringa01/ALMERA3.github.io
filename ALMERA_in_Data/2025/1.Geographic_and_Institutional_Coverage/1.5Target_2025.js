// ALMERA_in_Data/2025/1.Geographic_and_Institutional_Coverage/1.5Target_2025.js
const csvDataPath5 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

// --- Data Processing Functions (unchanged) ---
function gettargetCounts(data, targetColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[targetColumn]) {
            const targets = row[targetColumn]
                .split(/;|\r?\n/)   // split on ";" OR newlines
                .map(d => d.trim())
                .filter(d => d.length > 0);
            for (const aff of targets) {
                if (aff) counts.set(aff, (counts.get(aff) || 0) + 1); // Ensure target string is not empty after trimming
            }
        }
    }
    let result = [];
    let otherCount = 0;
    for (const [name, value] of counts.entries()) {
        if (value === 1) otherCount += 1; // targets with only one occurrence go into "Other"
        else result.push({ name, value });
        }
    if (otherCount > 0) result.push({ name: "Other", value: otherCount });
    return result;
}

function getToptargets(targetCounts, numTop = 9) {
    let top = targetCounts
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, numTop);
    const other = targetCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }
    return top;
}
function renderBarChart(container, toptarget, labsThatAnswered, color) {
    const width = 928, height = 500;

    // Define vertical space for each section
    const legendHeight = 40;
    const totalLabsHeight = 30;
    const topMargin = legendHeight + totalLabsHeight + 20; // extra padding above bars
    const bottomMargin = 50;
    const leftMargin = 50;
    const rightMargin = 30;

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

    // X scale for bars
    const x = d3.scaleLinear()
        .domain([0, d3.max(toptarget, d => d.value)])
        .nice()
        .range([leftMargin, width - rightMargin]);

    // Y scale for bars
    const y = d3.scaleBand()
        .domain(toptarget.map(d => d.name))
        .range([topMargin, height - bottomMargin])
        .padding(0.2);

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(toptarget)
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
        .data(toptarget)
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

    // Y axis (no labels)
    svg.append("g")
        .attr("transform", `translate(${leftMargin},0)`)
        .call(d3.axisLeft(y).tickFormat(''));

    // Total labs (top band)
    svg.append("text")
        .attr("x", leftMargin)
        .attr("y", 20) // Moved to the top, 20px from the top of the SVG
        .attr("text-anchor", "start")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(`Total laboratories that answered: ${labsThatAnswered.toLocaleString("en-US")}`);

    // Legend (middle band)
    const legend = svg.append("g")
        .attr("transform", `translate(${leftMargin}, ${totalLabsHeight + 20})`); // Positioned below the total labs text
    toptarget.forEach((d, i) => {
        const g = legend.append("g").attr("transform", `translate(${i * 150}, 0)`);
        g.append("rect").attr("width", 15).attr("height", 15).attr("fill", color(d.name));
        g.append("text").attr("x", 20).attr("y", 12).text(d.name).attr("font-size", "12px");
    });
    
    container.appendChild(svg.node());
}

// --- Main Init ---
async function initializetargetChart() {
    const container = document.getElementById("target-chart-container");
    if (!container) return;

    let rawData;
    try { rawData = await d3.csv(csvDataPath5); }
    catch { return container.innerHTML = "<p style='color:red'>Failed to load CSV.</p>"; }

    const targetColumn = "1.13 Target users of laboratory's analytical services";
    if (!rawData[0] || !rawData[0][targetColumn]) {
        return container.innerHTML = `<p style='color:red'>Missing "${targetColumn}" column.</p>`;
    }

    const targetCounts = gettargetCounts(rawData, targetColumn);
    let toptarget = getToptargets(targetCounts, 6);

    if (toptarget.length === 0) {
        return container.innerHTML = "<p>No data to display.</p>";
    }

    const labsThatAnswered = rawData.filter(d => d[targetColumn] && d[targetColumn].trim() !== "").length;

    const color = d3.scaleOrdinal()
        .domain(toptarget.map(d => d.name))
        .range(d3.schemeTableau10);

    renderBarChart(container, toptarget, labsThatAnswered, color);
}

// Run
document.addEventListener("DOMContentLoaded", initializetargetChart);
