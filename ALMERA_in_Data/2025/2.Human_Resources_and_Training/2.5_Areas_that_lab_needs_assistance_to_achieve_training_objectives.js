// ALMERA_in_Data/2025/2.Human_Resources_and_Training/2.5_Areas_that_lab_needs_assistance_to_achieve_training_objectives.js

const csvDataPath5 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

// --- Utility function for mapping long labels to short names ---
function mapAreasToShortNames(longName) {
    // Trim and convert to lowercase for robust matching
    const trimmedName = longName.trim();

    // Use a switch or if/else for mapping
    switch (trimmedName) {
        case "Data Management (e.g., statistical analysis, specialized software operation, data reporting)":
            return "Data Management";
        
        // The second largest label, based on your screenshot
        case "Specific Analytical Methods":
            return "Specific Analytical Methods"; // Keeping this one as is, as it's not overly long
            
        // The third largest label, based on your screenshot
        case "Training Materials and Resources (e.g., standard operating procedures (SOPs), manuals, documentation)":
            return "Training Materials and Resources";
            
        // The fourth largest label, based on your screenshot
        case "General Laboratory Management (e.g., safety, inventory, purchasing, long-term planning)":
            return "General Laboratory Management";

        // The fifth largest label, based on your screenshot
        case "Quality Management":
            return "Quality Management";

        // The sixth largest label, based on your screenshot
        case "None":
            return "None";
        
        // Return the original name if no match is found (e.g., "Other" or short names)
        default:
            return trimmedName;
    }
}
// ------------------------------------------


// --- Data Processing Functions (Updated) ---
function getAreas_that_lab_needs_assistance_to_achieve_training_objectivesCounts(data, Areas_that_lab_needs_assistance_to_achieve_training_objectivesColumn) {
    const counts = new Map();
    for (const row of data) {
        if (row[Areas_that_lab_needs_assistance_to_achieve_training_objectivesColumn]) {
            const areas = row[Areas_that_lab_needs_assistance_to_achieve_training_objectivesColumn]
                .split(/;|\r?\n/)
                .map(d => mapAreasToShortNames(d)) // 🛑 FIX 1: Apply mapping here!
                .filter(d => d.length > 0);
                
            for (const area of areas) {
                if (area) counts.set(area, (counts.get(area) || 0) + 1);
            }
        }
    }
    
    let result = [];
    let otherCount = 0;
    
    // Process counts to separate single occurrences (which should be minimized by mapping)
    for (const [name, value] of counts.entries()) {
        if (value === 1 && name !== "Other") { 
            otherCount += 1;
        }
        else result.push({ name, value });
    }
    
    // Aggregate the "Other" counts
    const existingOther = result.find(d => d.name === "Other");
    if (existingOther) {
        existingOther.value += otherCount;
    } else if (otherCount > 0) {
        result.push({ name: "Other", value: otherCount });
    }

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

// --- Render Chart Function (Updated Margins) ---
function renderBarChart(container, topAreas_that_lab_needs_assistance_to_achieve_training_objectives, labsThatAnswered, color) {
    const width = 928, height = 500;

    const topMargin = 50;
    const bottomMargin = 50;
    // 🛑 FIX 2: Reverted margin back to a smaller size as labels are now short
    const leftMargin = 200; 
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
                // Title text still uses the short name
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

    // Y axis (The labels will now be the short names)
    const yAxis = svg.append("g")
        .attr("transform", `translate(${leftMargin},0)`)
        .call(d3.axisLeft(y).tickSize(0));
        
    // Reset Y-axis label alignment (removed wrapping logic)
    yAxis.selectAll(".tick text")
        .attr("dy", "0.35em"); // Center text vertically 


    // Total labs (top band)
    svg.append("text")
        .attr("x", leftMargin)
        .attr("y", 20)
        .attr("text-anchor", "start")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(`Total laboratories that answered: ${labsThatAnswered.toLocaleString("en-US")}`);

    container.appendChild(svg.node());
}
// --- Main Init (unchanged) ---
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
