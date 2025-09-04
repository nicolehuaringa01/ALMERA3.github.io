// ALMERA3.github.io/ALMERA_in_Data/1.Geographic_and_Institutional_Coverage/1.6Scope_2020.js

const csvDataPath6 = "/ALMERA3.github.io/data/2020_ALMERA_Capabilities_Survey.csv";

function getscopeCounts(data, scopeColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[scopeColumn]) {
            const scopes = row[scopeColumn]
                .split(/;|\r?\n/)   // split on ";" OR newlines
                .map(d => d.trim())
                .filter(d => d.length > 0);
            
            // Check if the current lab selected both options
            const hasAnthropogenic = scopes.includes("Anthropogenic");
            const hasNORM = scopes.includes("NORM (Naturally-Occurring Radioactive Materials)");

            // If both are present, create a new "Both" category
            if (hasAnthropogenic && hasNORM) {
                counts.set("Both", (counts.get("Both") || 0) + 1);
            } else {
                // Continue with the original logic to count each individual option
                for (const aff of scopes) {
                    if (aff) counts.set(aff, (counts.get(aff) || 0) + 1);
                }
            }
        }
    }
    let result = [];
    let otherCount = 0;
    for (const [name, value] of counts.entries()) {
        if (value === 1) otherCount += 1; // scopes with only one occurrence go into "Other"
        else result.push({ name, value });
    }
    if (otherCount > 0) result.push({ name: "Other", value: otherCount });
    return result;
}

// This function selects the top N scopes, including "Other" if present
function getTopscopes(scopeCounts, numTop = 2) {
    let top = scopeCounts
        .slice() // Create a shallow copy to sort without modifying original
        .sort((a, b) => d3.descending(a.value, b.value)) // Sort by value descending
        .slice(0, numTop); // Take the top N

    // Ensure "Other" is included if it's one of the top N or if it exists and wasn't in top N
    const other = scopeCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }

    return top;
}

function renderBarChart(container, topscope, labsThatAnswered, color) {
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
        .domain([0, d3.max(topscope, d => d.value)])
        .nice()
        .range([leftMargin, width - rightMargin]);

    // Y scale for bars
    const y = d3.scaleBand()
        .domain(topscope.map(d => d.name))
        .range([topMargin, height - bottomMargin])
        .padding(0.2);

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topscope)
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
        .data(topscope)
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
    topscope.forEach((d, i) => {
        const g = legend.append("g").attr("transform", `translate(${i * 150}, 0)`);
        g.append("rect").attr("width", 15).attr("height", 15).attr("fill", color(d.name));
        g.append("text").attr("x", 20).attr("y", 12)
          .text(d.name === "NORM (Naturally-Occurring Radioactive Materials)" ? "NORM" : d.name)
          .attr("font-size", "12px");
    });
    
    container.appendChild(svg.node());
}

// --- Main Init ---
async function initializescopeChart() {
    const container = document.getElementById("scope-chart-container");
    if (!container) return;

    let rawData;
    try { rawData = await d3.csv(csvDataPath6); }
    catch { return container.innerHTML = "<p style='color:red'>Failed to load CSV.</p>"; }
    const scopeColumn = "1.14 Scope of radioactivity measurements/monitoring programme and sources of interest";
    if (!rawData[0] || !rawData[0][scopeColumn]) {
        return container.innerHTML = `<p style='color:red'>Missing "${scopeColumn}" column.</p>`;
    }

    const scopeCounts = getscopeCounts(rawData, scopeColumn);
    let topscope = getTopscopes(scopeCounts, 6);

    if (topscope.length === 0) {
        return container.innerHTML = "<p>No data to display.</p>";
    }

    const labsThatAnswered = rawData.filter(d => d[scopeColumn] && d[scopeColumn].trim() !== "").length;

    const color = d3.scaleOrdinal()
        .domain(topscope.map(d => d.name))
        .range(d3.schemeTableau10);

    renderBarChart(container, topscope, labsThatAnswered, color);
}

// Run
document.addEventListener("DOMContentLoaded", initializescopeChart);
