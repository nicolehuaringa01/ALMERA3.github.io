// ALMERA3.github.io/ALMERA_in_Data/1.Geographic_and_Institutional_Coverage/1.5Target.js

// --- Data Processing Functions (unchanged) ---
function getTargetCounts(data, TargetColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[TargetColumn]) {
            const Targets = row[TargetColumn]
                .split(/;|\r?\n/)   // split on ";" OR newlines
                .map(d => d.trim())
                .filter(d => d.length > 0);
            for (const aff of Targets) {
                if (aff) counts.set(aff, (counts.get(aff) || 0) + 1); // Ensure Target string is not empty after trimming
            }
        }
    }
    let result = [];
    let otherCount = 0;
    for (const [name, value] of counts.entries()) {
        if (value === 1) otherCount += 1; // Targets with only one occurrence go into "Other"
        else result.push({ name, value });
        }
    if (otherCount > 0) result.push({ name: "Other", value: otherCount });
    return result;
}

function getTopTargets(TargetCounts, numTop = 9) {
    let top = TargetCounts
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, numTop);
    const other = TargetCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }
    return top;
}
function renderBarChart(container, topTarget, labsThatAnswered, color) {
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
        .domain([0, d3.max(topTarget, d => d.value)])
        .nice()
        .range([leftMargin, width - rightMargin]);

    // Y scale for bars
    const y = d3.scaleBand()
        .domain(topTarget.map(d => d.name))
        .range([topMargin, height - bottomMargin])
        .padding(0.2);

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topTarget)
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
        .data(topTarget)
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
    topTarget.forEach((d, i) => {
        const g = legend.append("g").attr("transform", `translate(${i * 150}, 0)`);
        g.append("rect").attr("width", 15).attr("height", 15).attr("fill", color(d.name));
        g.append("text").attr("x", 20).attr("y", 12).text(d.name).attr("font-size", "12px");
    });
    
    container.appendChild(svg.node());
}

// --- Main Init ---
async function initializeTargetChart() {
    const container = document.getElementById("Target-chart-container");
    if (!container) return;

    let rawData;
    try { rawData = await d3.csv(csvDataPath4); }
    catch { return container.innerHTML = "<p style='color:red'>Failed to load CSV.</p>"; }

    const TargetColumn = "1.13 Target users of laboratory's analytical services";
    if (!rawData[0] || !rawData[0][TargetColumn]) {
        return container.innerHTML = `<p style='color:red'>Missing "${TargetColumn}" column.</p>`;
    }

    const TargetCounts = getTargetCounts(rawData, TargetColumn);
    let topTarget = getTopTargets(TargetCounts, 6);

    if (topTarget.length === 0) {
        return container.innerHTML = "<p>No data to display.</p>";
    }

    const labsThatAnswered = rawData.filter(d => d[TargetColumn] && d[TargetColumn].trim() !== "").length;

    const color = d3.scaleOrdinal()
        .domain(topTarget.map(d => d.name))
        .range(d3.schemeTableau10);

    renderBarChart(container, topTarget, labsThatAnswered, color);
}

// Run
document.addEventListener("DOMContentLoaded", initializeTargetChart);
