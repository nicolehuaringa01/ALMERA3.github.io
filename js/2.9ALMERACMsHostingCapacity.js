// js/2.9ALMERACMsHostingCapacity.js

// IMPORTANT: Verify this path carefully!
// This path is relative to the root of your GitHub Pages project.
// Based on your previous successful paths, this assumes:
// - Your GitHub Pages are serving from 'https://nicolehuaringa01.github.io/ALMERA3.github.io/'
// - Your CSV file is located at '/ALMERA3.github.io/data/Observable2020Survey.csv'
const csvDataPath9 = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // User-provided path

// Helper function to normalize strings for comparison (remove extra spaces, non-breaking spaces)
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').replace(/\u00A0/g, ' '); // Replace all whitespace with single space, remove non-breaking spaces
}

async function initializeALMERAHostingCapacityChart() {
    const container = document.getElementById("almera-hosting-capacity-chart-container");
    if (!container) {
        console.error("ALMERA hosting capacity chart container element #almera-hosting-capacity-chart-container not found.");
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Error: Chart container not found in HTML for ALMERA hosting capacity chart.';
        document.body.appendChild(errorDiv);
        return;
    }

    const width = container.clientWidth;
    const height = 500;

    let data;
    try {
        data = await d3.csv(csvDataPath9);
        console.log("ALMERA Hosting Capacity CSV data loaded successfully. Number of records:", data.length);
        if (data.length === 0) {
            console.warn("CSV data is empty. No chart to display.");
            container.innerHTML = "<p style='text-align: center;'>CSV data is empty. No chart to display.</p>";
            return;
        }

        const parsedHeaders = Object.keys(data[0]);
        console.log("CSV data loaded. First row headers (as parsed by D3.js):", parsedHeaders);

    } catch (error) {
        console.error("Error loading ALMERA Hosting Capacity CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load ALMERA hosting capacity data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing ---

    const minVal = 20; // Start of your first desired bin
    const maxVal = 120; // End of your last desired bin
    const numBins = 5;

    const binWidth = (maxVal - minVal) / numBins; // (120 - 20) / 5 = 100 / 5 = 20
    const thresholds = Array.from({length: numBins + 1}, (_, i) => minVal + i * binWidth); // [20, 40, 60, 80, 100, 120]

    const targetColumnName = "If 'yes' above, state the maximum number of participants";

    let foundColumn = null;
    const normalizedTarget = normalizeString(targetColumnName);

    for (const header of Object.keys(data[0])) {
        if (normalizeString(header) === normalizedTarget) {
            foundColumn = header;
            break;
        }
    }

    if (!foundColumn) {
        console.error(`Error: Could not find a matching column for "${targetColumnName}" in the CSV data.`);
        console.error("Available headers (normalized for comparison):", Object.keys(data[0]).map(normalizeString));
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: Column "${targetColumnName}" not found in CSV. Please check the exact header name.</p>`;
        return;
    }

    console.log(`Successfully identified column: "${foundColumn}" for processing.`);
    const ALMERAhostingCapacityColumn = foundColumn;

    const filteredData = data.map(d => {
        const rawValue = d[ALMERAhostingCapacityColumn];
        const trimmedValue = (typeof rawValue === 'string' || rawValue instanceof String) ? rawValue.trim() : String(rawValue).trim();
        if (trimmedValue === '') {
            return null;
        }
        const numValue = +trimmedValue;
        return numValue;
    }).filter(n => n !== null && !isNaN(n) && n >= minVal); // Keep only valid numbers that are >= your minVal

    if (filteredData.length === 0) {
        console.warn("No valid ALMERA hosting capacity data found after processing (all values were non-numeric, less than minVal, or column was entirely empty/blank).");
        container.innerHTML = "<p style='text-align: center;'>No valid ALMERA hosting capacity data (starting from 20 participants) to display.</p>";
        return;
    }

    console.log("Processed ALMERA CM Hosting Capacity data (first 10 valid values):", filteredData.slice(0, 10));

    // --- Chart Rendering Logic (using Observable Plot) ---

    const renderPlot = (currentWidth) => {
        container.innerHTML = ''; // Clear any existing chart

        const ALMERAHostingCapacityPlot = Plot.plot({
            width: currentWidth,
            height: height,
            x: {
                label: "Amount of Participants that each lab could host",
                domain: [minVal, maxVal], // Stays [20, 120]
                // *** CHANGE: Use thresholds for ticks, and format simply as numbers ***
                tickFormat: d => d, // Formats tick values as plain numbers (20, 40, etc.)
                ticks: thresholds, // Explicitly use your calculated thresholds for ticks
            },
            y: {
                label: "Number of Laboratories",
                grid: true,
                // *** CHANGE: Format y-axis ticks as integers ***
                tickFormat: d3.format("d") // Formats y-axis ticks as integers (e.g., 1, 2, 3)
            },
            marks: [
                Plot.rectY(filteredData, Plot.binX(
                    { y: "count", title: d => {
                        const lowerBound = Math.floor(d.x0);
                        const upperBound = Math.floor(d.x1) - (d.x1 === maxVal + binWidth ? 0 : 1); // For labels like 20-39, 40-59, etc.
                        if (d.x1 === maxVal + binWidth) return `Participants ${lowerBound}+: ${d.length} labs`; // Last bin (e.g., 120+)
                        if (lowerBound === upperBound) return `Participants ${lowerBound}: ${d.length} labs`; // Single value bin (e.g., 20)
                        return `Participants ${lowerBound}-${upperBound}: ${d.length} labs`;
                    }},
                    {
                        x: d => d,
                        thresholds: thresholds,
                        fill: "black"
                    }
                )),
                Plot.ruleY([0])
            ],
            style: {
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
            }
        });

        container.appendChild(ALMERAHostingCapacityPlot);
        console.log("ALMERA Hosting Capacity chart appended to DOM.");
    };

    renderPlot(width);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            renderPlot(container.clientWidth);
        }, 200);
    });
}

document.addEventListener("DOMContentLoaded", initializeALMERAHostingCapacityChart);
