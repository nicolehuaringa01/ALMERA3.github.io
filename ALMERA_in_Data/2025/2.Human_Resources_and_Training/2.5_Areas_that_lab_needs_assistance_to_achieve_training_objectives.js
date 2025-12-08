// ALMERA_in_Data/2025/2.Human_Resources_and_Training/2.5_Areas_that_lab_needs_assistance_to_achieve_training_objectives.js

const csvDataPath5 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

// --- Utility function for text wrapping ---
function wrapText(text, maxWidth, lineHeight) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeightPx = 14, // Approximate line height in pixels for 12px font
            y = text.attr("y") || 0,
            // Ensure dy is a string like "0.35em" to work with D3's tspan positioning
            dy = text.attr("dy") ? parseFloat(text.attr("dy")) : 0.35, 
            tspan = text.text(null).append("tspan").attr("x", -10).attr("y", y).attr("dy", dy + "em");
        
        // Define a character limit based on a rough estimate (25 chars) 
        // We use character count as measuring text width can be complex in D3 without prior rendering
        const charLimit = 35; 

        while (word = words.pop()) {
            line.push(word);
            // If the current line is too long, or we are at the end of the text
            if (line.join(" ").length > charLimit && line.length > 1) {
                // Remove the last word, print the line, and start a new line with the last word
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                    .attr("x", -10) // Left align to the Y-axis tick mark
                    .attr("y", y)
                    // Increment lineNumber and use lineHeight for vertical spacing
                    .attr("dy", ++lineNumber * lineHeight + dy + "em") 
                    .text(word);
            } else {
                // If it fits or is the first word, just update the current line
                tspan.text(line.join(" "));
            }
        }
    });
}
// ------------------------------------------

// --- Data Processing Functions (unchanged) ---
function getAreas_that_lab_needs_assistance_to_achieve_training_objectivesCounts(data, Areas_that_lab_needs_assistance_to_achieve_training_objectivesColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[Areas_that_lab_needs_assistance_to_achieve_training_objectivesColumn]) {
            const Areas_that_lab_needs_assistance_to_achieve_training_objectivess = row[Areas_that_lab_needs_assistance_to_achieve_training_objectivesColumn]
                .split(/;|\r?\n/)   // split on ";" OR newlines
                .map(d => d.trim())
                .filter(d => d.length > 0);
            for (const aff of Areas_that_lab_needs_assistance_to_achieve_training_objectivess) {
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

function getTopAreas_that_lab_needs_assistance_to_achieve_training_objectivess(Areas_that_lab_needs_assistance_to_achieve_training_objectivesCounts, numTop = 9) {
    let top = Areas_that_lab_needs_assistance_to_achieve_training_objectivesCounts
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, numTop);
    const other = Areas_that_lab_needs_assistance_to_achieve_training_objectivesCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other);
        top.sort((a, b) => d3.descending(a.value, b.value));
    }
    return top;
}

// --- Render Chart Function (Updated) ---
function renderBarChart(container, topAreas_that_lab_needs_assistance_to_achieve_training_objectives, labsThatAnswered, color) {
    const width = 928, height = 500;

    // Adjust vertical space since we are removing the legend
    const topMargin = 50;
    const bottomMargin = 50;
    // FIX 1: Increased margin for long, wrapped labels
    const leftMargin = 300; 
    const rightMargin = 30;

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

    // X scale for bars
    const x = d3.scaleLinear()
        .domain([0, d3.max(topAreas_that_lab_needs_assistance_to_achieve_training_objectives, d => d.value)])
        .nice()
        .range([leftMargin, width - rightMargin]);

    // Y scale for bars
    const y = d3.scaleBand()
        .domain(topAreas_that_lab_needs_assistance_to_achieve_training_objectives.map(d => d.name))
        .range([topMargin, height - bottomMargin])
        .padding(0.2);

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topAreas_that_lab_needs_assistance_to_achieve_training_objectives)
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
        .data(topAreas_that_lab_needs_assistance_to_achieve_training_objectives)
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

    // Y axis (with wrapped labels)
    const yAxis = svg.append("g")
        .attr("transform", `translate(${leftMargin},0)`)
        .call(d3.axisLeft(y).tickSize(0)); // Use tickSize(0) for cleaner look

    // FIX 2: Apply the wrapping to the text elements using a line height of 1.2
    yAxis.selectAll(".tick text")
        .call(wrapText, leftMargin - 10, 1.2); 

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
async function initializeAreas_that_lab_needs_assistance_to_achieve_training_objectivesChart() {
    const container = document.getElementById("Areas_that_lab_needs_assistance_to_achieve_training_objectives-chart-container");
    if (!container) return;

    let rawData;
    try { rawData = await d3.csv(csvDataPath5); }
    catch { return container.innerHTML = "<p style='color:red'>Failed to load CSV.</p>"; }

    const Areas_that_lab_needs_assistance_to_achieve_training_objectivesColumn = "2.5 In which areas does the laboratory need assistance to help it achieve its training objectives?";
    if (!rawData[0] || !rawData[0][Areas_that_lab_needs_assistance_to_achieve_training_objectivesColumn]) {
        return container.innerHTML = `<p style='color:red'>Missing "${Areas_that_lab_needs_assistance_to_achieve_training_objectivesColumn}" column.</p>`;
    }

    const Areas_that_lab_needs_assistance_to_achieve_training_objectivesCounts = getAreas_that_lab_needs_assistance_to_achieve_training_objectivesCounts(rawData, Areas_that_lab_needs_assistance_to_achieve_training_objectivesColumn);
    let topAreas_that_lab_needs_assistance_to_achieve_training_objectives = Areas_that_lab_needs_assistance_to_achieve_training_objectivesCounts.sort((a, b) => d3.descending(a.value, b.value));

    if (topAreas_that_lab_needs_assistance_to_achieve_training_objectives.length === 0) {
        return container.innerHTML = "<p>No data to display.</p>";
    }

    const labsThatAnswered = rawData.filter(d => d[Areas_that_lab_needs_assistance_to_achieve_training_objectivesColumn] && d[Areas_that_lab_needs_assistance_to_achieve_training_objectivesColumn].trim() !== "").length;

    const color = d3.scaleOrdinal()
        .domain(topAreas_that_lab_needs_assistance_to_achieve_training_objectives.map(d => d.name))
        .range(d3.schemeTableau10);

    renderBarChart(container, topAreas_that_lab_needs_assistance_to_achieve_training_objectives, labsThatAnswered, color);
}
// Run
document.addEventListener("DOMContentLoaded", initializeAreas_that_lab_needs_assistance_to_achieve_training_objectivesChart);
