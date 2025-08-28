// ALMERA3.github.io/ALMERA_in_Data/1.Geographic_and_Institutional_Coverage/1.3_Affiliation_2025.js
const csvDataPath3 = "/ALMERA3.github.io/data/ALMERA_Capabilities_Survey_2025_TEST.csv";

// --- Data Processing Functions (unchanged) ---
function getAffiliationCounts(data, affiliationColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[affiliationColumn]) {
            const affiliations = row[affiliationColumn]
                .split(/;|\r?\n/)   // split on ";" OR newlines
                .map(d => d.trim())
                .filter(d => d.length > 0);
            for (const aff of affiliations) {
                if (aff) counts.set(aff, (counts.get(aff) || 0) + 1);
            }
        }
    }
    let result = [];
    let otherCount = 0;
    for (const [name, value] of counts.entries()) {
        if (value === 1) otherCount += 1;
        else result.push({ name, value });
    }
    if (otherCount > 0) result.push({ name: "Other", value: otherCount });
    return result;
}

function getTopAffiliations(affiliationCounts, numTop = 6) {
    let top = affiliationCounts
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, numTop);
    const other = affiliationCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other);
        top.sort((a, b) => d3.descending(a.value, b.value));
    }
    return top;
}

// --- Visualization Options ---

// Option 1: Bar Chart with Reference Line
function renderBarChart(container, topAffiliation, labsThatAnswered, color) {
    const width = 928, height = 500, margin = {top: 50, right: 30, bottom: 50, left: 150};
    const svg = d3.create("svg")
        .attr("width", width).attr("height", height)
        .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

    const x = d3.scaleLinear()
        .domain([0, d3.max(topAffiliation, d => d.value)])
        .nice()
        .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
        .domain(topAffiliation.map(d => d.name))
        .range([margin.top, height - margin.bottom])
        .padding(0.1);

    svg.append("g")
        .selectAll("rect")
        .data(topAffiliation)
        .join("rect")
            .attr("x", margin.left)
            .attr("y", d => y(d.name))
            .attr("width", d => x(d.value) - margin.left)
            .attr("height", y.bandwidth())
            .attr("fill", d => color(d.name))
        .append("title")
            .text(d => `${d.name}: ${d.value} labs`);

    // X axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    // Y axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Reference line for labs that answered
    svg.append("line")
        .attr("x1", x(labsThatAnswered)).attr("x2", x(labsThatAnswered))
        .attr("y1", margin.top).attr("y2", height - margin.bottom)
        .attr("stroke", "red").attr("stroke-dasharray", "4 2")
        .attr("stroke-width", 2);

    svg.append("text")
        .attr("x", x(labsThatAnswered)).attr("y", margin.top - 10)
        .attr("fill", "red").attr("text-anchor", "middle")
        .text(`Labs that answered: ${labsThatAnswered}`);

    container.appendChild(svg.node());
}

// Option 2: 100% Stacked Bar (Proportions)
function renderStackedBar(container, topAffiliation, labsThatAnswered, color) {
    const width = 928, height = 200, margin = {top: 40, right: 30, bottom: 40, left: 30};
    const svg = d3.create("svg")
        .attr("width", width).attr("height", height)
        .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

    const total = d3.sum(topAffiliation, d => d.value);
    let cumulative = 0;

    svg.append("g")
        .selectAll("rect")
        .data(topAffiliation)
        .join("rect")
            .attr("x", d => {
                const prev = cumulative / total * (width - margin.left - margin.right) + margin.left;
                cumulative += d.value;
                return prev;
            })
            .attr("y", margin.top)
            .attr("width", d => (d.value / total) * (width - margin.left - margin.right))
            .attr("height", height - margin.top - margin.bottom)
            .attr("fill", d => color(d.name))
        .append("title")
            .text(d => `${d.name}: ${(d.value/total*100).toFixed(1)}% (${d.value} labs)`);

    // Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top - 20})`);
    topAffiliation.forEach((d, i) => {
        const g = legend.append("g").attr("transform", `translate(${i*150},0)`);
        g.append("rect").attr("width", 15).attr("height", 15).attr("fill", color(d.name));
        g.append("text").attr("x", 20).attr("y", 12).text(d.name);
    });

    container.appendChild(svg.node());
}

// --- Main Init ---
async function initializeAffiliationChart() {
    const container = document.getElementById("affiliation-chart-container");
    if (!container) return;

    let rawData;
    try { rawData = await d3.csv(csvDataPath3); }
    catch { return container.innerHTML = "<p style='color:red'>Failed to load CSV.</p>"; }

    const affiliationColumn = "1.11 Affiliation";
    if (!rawData[0] || !rawData[0][affiliationColumn]) {
        return container.innerHTML = `<p style='color:red'>Missing "${affiliationColumn}" column.</p>`;
    }

    const affiliationCounts = getAffiliationCounts(rawData, affiliationColumn);
    let topAffiliation = getTopAffiliations(affiliationCounts, 6);

    if (topAffiliation.length === 0) {
        return container.innerHTML = "<p>No data to display.</p>";
    }

    const labsThatAnswered = rawData.filter(d => d[affiliationColumn] && d[affiliationColumn].trim() !== "").length;

    const color = d3.scaleOrdinal()
        .domain(topAffiliation.map(d => d.name))
        .range(d3.schemeTableau10);

    // Pick which chart to render:
    renderBarChart(container, topAffiliation, labsThatAnswered, color);
    // renderStackedBar(container, topAffiliation, labsThatAnswered, color);
}

// Run
document.addEventListener("DOMContentLoaded", initializeAffiliationChart);
