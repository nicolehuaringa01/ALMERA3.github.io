// ALMERA_in_Data/2025/6.Quality_Managemnt_and_Reporting/6.10Calibration_Method_Used_for_Gamma_Spectrometers.js

const csvDataPath10 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

// --- Data Processing Functions (MODIFIED FOR FIX) ---

function getCalibration_Method_Used_for_Gamma_SpectrometersCounts(data, Calibration_Method_Used_for_Gamma_SpectrometersColumn) {
    const counts = new Map();
    
    // 1. Initial count of ALL unique answers
    for (const row of data) {
        if (row[Calibration_Method_Used_for_Gamma_SpectrometersColumn]) {
            // Split by semicolon (;) or newline (\r?\n), trim, and filter empty strings
            const methods = row[Calibration_Method_Used_for_Gamma_SpectrometersColumn]
                .split(/;|\r?\n/) 
                .map(d => d.trim())
                .filter(d => d.length > 0);
            
            for (const method of methods) {
                if (method) counts.set(method, (counts.get(method) || 0) + 1); 
            }
        }
    }
    
    // 2. Aggregate methods that appeared only once into a single "Other" category
    let result = [];
    let otherCount = 0;
    
    for (const [name, value] of counts.entries()) {
        // Only entries with a count of 1 are grouped into 'Other'
        if (value === 1) {
            otherCount += 1; 
        } else {
            // All other entries (count > 1) are pushed directly
            result.push({ name, value });
        }
    }
    
    // 3. Add the final aggregated "Other" count (if any)
    if (otherCount > 0) result.push({ name: "Other", value: otherCount });

    return result;
}

function renderBarChart(container, topCalibration_Method_Used_for_Gamma_Spectrometers, labsThatAnswered, color) {
    // Standard D3 dimensions (can be updated for responsiveness if needed)
    const width = 928, height = 500;

    // Margins
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
        .domain([0, d3.max(topCalibration_Method_Used_for_Gamma_Spectrometers, d => d.value)])
        .nice()
        .range([leftMargin, width - rightMargin]);

    // Y scale for bars
    const y = d3.scaleBand()
        .domain(topCalibration_Method_Used_for_Gamma_Spectrometers.map(d => d.name))
        .range([topMargin, height - bottomMargin])
        .padding(0.2);

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topCalibration_Method_Used_for_Gamma_Spectrometers)
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
        .data(topCalibration_Method_Used_for_Gamma_Spectrometers)
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
        .call(d3.axisLeft(y)); 

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

// --- Main Init ---
async function initializeCalibration_Method_Used_for_Gamma_SpectrometersChart() {
    const container = document.getElementById("Calibration_Method_Used_for_Gamma_Spectrometers-chart-container");
    if (!container) return;

    let rawData;
    try { 
        // Using d3.csv with the corrected path
        rawData = await d3.csv(csvDataPath10); 
    }
    catch (error) { 
        console.error("Error loading CSV:", error);
        return container.innerHTML = "<p style='color:red'>Failed to load CSV. Check the console for details.</p>"; 
    }

    const headers = Object.keys(rawData[0]).map(h => h.trim());
    const Calibration_Method_Used_for_Gamma_SpectrometersColumn = headers.find(h =>
        h.includes("6.10") && h.includes("What is the method used for the calibration of gamma spectrometer/s?")
    );

    if (!Calibration_Method_Used_for_Gamma_SpectrometersColumn) {
        console.error("Available headers:", headers);
        // Updated error message to match the actual question being queried
        return container.innerHTML = `<p style='color:red'>Missing 6.10 Calibration Method column.</p>`;
    }

    // Use the fixed counting function
    const Calibration_Method_Used_for_Gamma_SpectrometersCounts = getCalibration_Method_Used_for_Gamma_SpectrometersCounts(rawData, Calibration_Method_Used_for_Gamma_SpectrometersColumn);
    
    // Sort the final aggregated array for display (no more top N function needed)
    let topCalibration_Method_Used_for_Gamma_Spectrometers = Calibration_Method_Used_for_Gamma_SpectrometersCounts.sort((a, b) => d3.descending(a.value, b.value));

    if (topCalibration_Method_Used_for_Gamma_Spectrometers.length === 0) {
        return container.innerHTML = "<p>No data to display.</p>";
    }

    // Determine the number of labs who actually answered the column
    const labsThatAnswered = rawData.filter(d => d[Calibration_Method_Used_for_Gamma_SpectrometersColumn] && d[Calibration_Method_Used_for_Gamma_SpectrometersColumn].trim() !== "").length;

    const color = d3.scaleOrdinal()
        .domain(topCalibration_Method_Used_for_Gamma_Spectrometers.map(d => d.name))
        .range(d3.schemeTableau10);

    renderBarChart(container, topCalibration_Method_Used_for_Gamma_Spectrometers, labsThatAnswered, color);
}

// Run (Keeping the DOMContentLoaded listener here is acceptable, 
// though direct execution often works better when the script is at the bottom of <body>.)
document.addEventListener("DOMContentLoaded", initializeCalibration_Method_Used_for_Gamma_SpectrometersChart);
