// ALMERA3.github.io/ALMERA_in_Data/1.Geographic_and_Institutional_Coverage/1.3_Affiliation_2025.js
const csvDataPath3 = "/ALMERA3.github.io/data/ALMERA_Capabilities_Survey_2025_TEST.csv";

// --- Data Processing Functions ---
function getAffiliationCounts(data, affiliationColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[affiliationColumn]) {
            const affiliations = row[affiliationColumn]
                .split(/;|\r?\n/)   // split on ";" OR newlines
                .map(d => d.trim())
                .filter(d => d.length > 0);
            for (const aff of affiliations) {
                counts.set(aff, (counts.get(aff) || 0) + 1);
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

    // --- Process data ---
    const affiliationCounts = d3.rollup(
        rawData.flatMap(d => d[affiliationColumn].split(";").map(a => a.trim())),
        v => v.length,
        d => d
    );

    const affiliationArray = Array.from(affiliationCounts, ([name, value]) => ({ name, value }));
    const topAffiliation = getTopAffiliations(affiliationArray);

    const totalLabs = new Set(rawData.map(d => d.LabID)).size;

    const labsThatAnswered = new Set(
        rawData.filter(d => d[affiliationColumn] && d[affiliationColumn].trim() !== "")
               .map(d => d.LabID)
    ).size;

    const totalAffiliationsCount = Array.from(affiliationCounts.values())
        .reduce((a, b) => a + b, 0);

    // --- Chart setup ---
    const margin = { top: 60, right: 30, bottom: 50, left: 120 };
    const width = 700 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
        .domain(Array.from(affiliationCounts.keys()))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, Math.max(d3.max(Array.from(affiliationCounts.values())), totalLabs) * 1.2])
        .nice()
        .range([height, 0]);

    // Bars
    svg.selectAll("rect")
        .data(Array.from(affiliationCounts.entries()))
        .enter().append("rect")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[1]))
        .attr("fill", "#69b3a2");

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    // --- Red reference lines ---
    // Thick line for all labs
    svg.append("line")
        .attr("x1", 0).attr("x2", width)
        .attr("y1", y(totalLabs)).attr("y2", y(totalLabs))
        .attr("stroke", "red").attr("stroke-width", 3)
        .attr("stroke-dasharray", "5,3");

    svg.append("text")
        .attr("x", width - 10)
        .attr("y", y(totalLabs) - 5)
        .attr("text-anchor", "end")
        .attr("fill", "red")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(`Total labs: ${totalLabs}`);

    // Thinner line for labs that answered
    svg.append("line")
        .attr("x1", 0).attr("x2", width)
        .attr("y1", y(labsThatAnswered)).attr("y2", y(labsThatAnswered))
        .attr("stroke", "red").attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "2,2");

    svg.append("text")
        .attr("x", width - 10)
        .attr("y", y(labsThatAnswered) - 5)
        .attr("text-anchor", "end")
        .attr("fill", "red")
        .attr("font-size", "12px")
        .text(`Labs that answered: ${labsThatAnswered}`);

    // --- Labels at top ---
    svg.append("text")
        .attr("x", 0).attr("y", -20)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(`Total responses: ${totalAffiliationsCount.toLocaleString("en-US")}`);

    svg.append("text")
        .attr("x", 0).attr("y", -5)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .text(`Total laboratories that answered: ${labsThatAnswered.toLocaleString("en-US")}`);

    svg.append("text")
        .attr("x", 0).attr("y", 10)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .text(`Total laboratories in network: ${totalLabs.toLocaleString("en-US")}`);
}

// Run
document.addEventListener("DOMContentLoaded", initializeAffiliationChart);
