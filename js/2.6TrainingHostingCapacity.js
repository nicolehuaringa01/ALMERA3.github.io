// js/2.6TrainingHostingCapacity.js

// IMPORTANT: Verify this path carefully!
// This path is relative to the root of your GitHub Pages project.
// Based on your previous successful paths, this assumes:
// - Your GitHub Pages are serving from 'https://nicolehuaringa01.github.io/ALMERA3.github.io/'
// - Your CSV file is located at '/ALMERA3.github.io/data/Observable2020Survey.csv'
const csvDataPath6 = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // User-provided path

// Helper function to normalize strings for comparison (remove extra spaces, non-breaking spaces)
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').replace(/\u00A0/g, ' '); // Replace all whitespace with single space, remove non-breaking spaces
}

async function initializeTrainingHostingCapacityChart() {
    const container = document.getElementById("training-hosting-capacity-chart-container");
    if (!container) {
        console.error("Training hosting capacity chart container element #training-hosting-capacity-chart-container not found.");
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Error: Chart container not found in HTML for training hosting capacity chart.';
        document.body.appendChild(errorDiv);
        return;
    }

    const width = container.clientWidth;
    const height = 500;

    let data;
    try {
        data = await d3.csv(csvDataPath6);
        console.log("Training Hosting Capacity CSV data loaded successfully. Number of records:", data.length);
        if (data.length === 0) {
            console.warn("CSV data is empty. No chart to display.");
            container.innerHTML = "<p style='text-align: center;'>CSV data is empty. No chart to display.</p>";
            return;
        }

        // *** CRUCIAL DEBUGGING STEP: Log all headers found by D3.js ***
        const parsedHeaders = Object.keys(data[0]);
        console.log("CSV data loaded. First row headers (as parsed by D3.js):", parsedHeaders);

        // Also log a few values from the target column to check content
        const potentialTargetColumn = "If 'yes' above, specify the maximum number of participants for practical training";
        console.log(`Checking first 5 values for column "${potentialTargetColumn}":`);
        for (let i = 0; i < Math.min(5, data.length); i++) {
            console.log(`Row ${i}:`, data[i][potentialTargetColumn]);
        }


    } catch (error) {
        console.error("Error loading Training Hosting Capacity CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load training hosting capacity data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing (from your Observable code) ---

    const minVal = 0;
    const maxVal = 20;
    const numBins = 5;
    const binWidth = (maxVal - minVal) / numBins;
    const thresholds = Array.from({length: numBins + 1}, (_, i) => minVal + i * binWidth);

    // The user-provided exact string for the column name
    const targetColumnName = "If 'yes' above, specify the maximum number of participants for practical training";

    // --- Robust Column Name Validation ---
    // Find the actual column name in the parsed headers that matches our target,
    // accounting for potential hidden whitespace or character differences.
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
    const hostingCapacityColumn = foundColumn; // Use the exactly matched header

    const filteredData = data.map(d => +d[hostingCapacityColumn]) // Convert to number
                             .filter(n => !isNaN(n) && n >= 0); // Filter out invalid numbers and negative counts

    if (filteredData.length === 0) {
        console.warn("No valid hosting capacity data found after processing (all values were non-numeric or less than 0, or column was entirely empty).");
        container.innerHTML = "<p style='text-align: center;'>No valid training hosting capacity data to display (check column values or if column is entirely empty).</p>";
        return;
    }

    console.log("Processed Training Hosting Capacity data (first 10 valid values):", filteredData.slice(0, 10));

    // --- Chart Rendering Logic (using Observable Plot) ---

    const renderPlot = (currentWidth) => {
        container.innerHTML = ''; // Clear any existing chart

        const TrainingHostingCapacityPlot = Plot.plot({
            width: currentWidth,
            height: height,
            x: {
                label: "Amount of Participants that each lab could host",
                domain: [minVal, maxVal],
                tickFormat: (d, i) => {
                    // Custom tick format for ranges, adjusted to match bins precisely
                    if (i === thresholds.length - 1 && d === maxVal) return `${d}+`; // e.g., 20+
                    if (thresholds[i+1] !== undefined) {
                        return `${Math.floor(d)}-${Math.floor(thresholds[i+1]) - (thresholds[i+1] > d ? 1 : 0)}`; // e.g., 1-4, 5-9, 10-14, 15-19
                    }
                    return `${Math.floor(d)}`;
                },
            },
            y: {
                label: "Number of Laboratories",
                grid: true
            },
            marks: [
                Plot.rectY(filteredData, Plot.binX(
                    { y: "count", title: d => `Participants ${Math.floor(d.x0)}-${Math.floor(d.x1)-1}: ${d.length} labs` }, // Updated tooltip with floored values
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

        container.appendChild(TrainingHostingCapacityPlot);
        console.log("Training Hosting Capacity chart appended to DOM.");
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

document.addEventListener("DOMContentLoaded", initializeTrainingHostingCapacityChart);
