// ALMERA_in_Data/3.Equipment/3.1FieldSurveyCapabilities.js

const csvDataPath1 = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // Using 'csvDataPath' for clarity in this file

// This function processes the new data format with separate columns for each system type
function getSystemCounts(rawData) {
    const systemColumns = [
        "3.2 Number of Systems", // Gross Alpha Counters
        "3.3 Number of Systems", // Gross beta counters
        "3.4 Number of Systems", // Gamma-ray spectrometry system
        "3.5 Number of Systems", // Alpha spectrometry system
        "3.6 Number of Systems", // Liquid scintillation counter
        "3.7 Number of Systems", // Mass spectrometry
        "3.8 Number of Systems", // Field survey capabilities
        "3.9 Number of Systems"  // Other equipment
    ];

    const systemLabels = [
        "Gross Alpha Counters",
        "Gross Beta Counters",
        "Gamma-ray Spectrometry",
        "Alpha Spectrometry",
        "Liquid Scintillation",
        "Mass Spectrometry",
        "Other1",
        "Other2"
    ];

    const counts = [];
    const totalsRow = rawData[0]; // Assuming the first row contains the totals

    systemColumns.forEach((column, index) => {
        const value = +totalsRow[column]; // Convert the string value to a number
        if (!isNaN(value) && value > 0) {
            counts.push({
                name: systemLabels[index],
                value: value
            });
        }
    });

    return counts;
}
// This function selects the top N FieldSurveyCapabilitiess, including "Other" if present
function getTopFieldSurveyCapabilitiess(FieldSurveyCapabilitiesCounts, numTop = 6) {
    let top = FieldSurveyCapabilitiesCounts
        .slice() // Create a shallow copy to sort without modifying original
        .sort((a, b) => d3.descending(a.value, b.value)) // Sort by value descending
        .slice(0, numTop); // Take the top N

    // Ensure "Other" is included if it's one of the top N or if it exists and wasn't in top N
    const other = FieldSurveyCapabilitiesCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }

    return top;
}


// --- New Chart Initialization ---
async function initializeFieldSurveyCapabilitiesChart() {
    const container = document.getElementById("FieldSurveyCapabilities-chart-container");
    if (!container) {
        console.error("FieldSurveyCapabilities chart container element #FieldSurveyCapabilities-chart-container not found.");
        return;
    }

    const width = 928;
    const height = 500;

    let rawData;
    try {
        rawData = await d3.csv(csvDataPath1);
        console.log("FieldSurveyCapabilities CSV raw data loaded:", rawData.length, "records");
    } catch (error) {
        console.error("Error loading FieldSurveyCapabilities CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load data. Check console for details.</p>";
        return;
    }

    // Process the new data format
    const systemCounts = getSystemCounts(rawData);

    if (systemCounts.length === 0) {
        console.warn("No valid system data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No data to display after filtering/processing.</p>";
        return;
    }

    // Sort the counts in descending order for the bar chart
    systemCounts.sort((a, b) => d3.descending(a.value, b.value));

    // --- Chart Rendering Logic (Bar Chart) ---
    const topMargin = 50;
    const bottomMargin = 50;
    const leftMargin = 200;
    const rightMargin = 30;

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

    const x = d3.scaleLinear()
        .domain([0, d3.max(systemCounts, d => d.value)])
        .nice()
        .range([leftMargin, width - rightMargin]);

    const y = d3.scaleBand()
        .domain(systemCounts.map(d => d.name))
        .range([topMargin, height - bottomMargin])
        .padding(0.2);

    const color = d3.scaleOrdinal(d3.schemeTableau10).domain(systemCounts.map(d => d.name));

    svg.append("g")
        .selectAll("rect")
        .data(systemCounts)
        .join("rect")
            .attr("x", leftMargin)
            .attr("y", d => y(d.name))
            .attr("width", d => x(d.value) - leftMargin)
            .attr("height", y.bandwidth())
            .attr("fill", d => color(d.name))
        .append("title")
            .text(d => `${d.name}: ${d.value} systems`);

    svg.append("g")
        .attr("transform", `translate(0,${height - bottomMargin})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${leftMargin},0)`)
        .call(d3.axisLeft(y));

    container.appendChild(svg.node());
}

// Run the chart initialization
document.addEventListener("DOMContentLoaded", initializeFieldSurveyCapabilitiesChart);
