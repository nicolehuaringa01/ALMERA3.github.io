// js/2.9ALMERACMsHostingCapacity.js

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

    // --- Data Processing (from your Observable code) ---

    const minVal = 20; // Keep minVal at 0 for domain, but filter data to >=1
    const maxVal = 120;
    const numBins = 5;
    const binWidth = (maxVal - minVal) / numBins;
    const thresholds = Array.from({length: numBins + 1}, (_, i) => minVal + i * binWidth);

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

    // *** MODIFIED FILTERING LOGIC HERE ***
    const filteredData = data.map(d => {
        const rawValue = d[ALMERAhostingCapacityColumn];
        // Treat null, undefined, or empty strings as non-numeric/blank
        const trimmedValue = (typeof rawValue === 'string' || rawValue instanceof String) ? rawValue.trim() : String(rawValue).trim();

        if (trimmedValue === '') {
            return null; // Explicitly mark empty cells for removal
        }
        const numValue = +trimmedValue; // Convert to number
        return numValue;
    }).filter(n => n !== null && !isNaN(n) && n >= 1); // Keep only valid numbers that are 1 or greater

    if (filteredData.length === 0) {
        console.warn("No valid ALMERA hosting capacity data found after processing (all values were non-numeric, less than 1, or column was entirely empty/blank).");
        container.innerHTML = "<p style='text-align: center;'>No valid ALMERA hosting capacity data (1 or more participants) to display.</p>";
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
                domain: [minVal, maxVal], // Keep domain for axis appearance
                tickFormat: (d, i) => {
                    // Custom tick format for ranges, adjusted to match bins precisely
                    if (i === thresholds.length - 1 && d === maxVal) return `${d}+`; // e.g., 20+
                    if (thresholds[i+1] !== undefined) {
                        const lowerBound = Math.floor(d);
                        const upperBound = Math.floor(thresholds[i+1]) - 1; // Exclusive upper bound for bin
                        if (lowerBound > upperBound) { // Handles cases where a bin is just one number (e.g., if maxVal=5, binWidth=1, then thresholds=[0,1,2,3,4,5], this helps with label 5+)
                            return `${lowerBound}+`;
                        }
                        return `${lowerBound}-${upperBound}`;
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
                    { y: "count", title: d => { // Updated tooltip logic
                        const lowerBound = Math.floor(d.x0);
                        const upperBound = Math.floor(d.x1) -1;
                        if (d.x1 === maxVal + binWidth) return `Participants ${lowerBound}+: ${d.length} labs`; // Last bin
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
