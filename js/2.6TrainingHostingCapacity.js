// js/2.6TrainingHostingCapacity.js

const csvDataPath6 = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // User-provided path

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
        if (data.length > 0) {
            // *** THIS IS THE CRUCIAL LINE TO CHECK IN YOUR BROWSER CONSOLE ***
            // It will show you the exact column names as D3.js parsed them from your CSV.
            // COPY THE ARRAY OF NAMES AFTER THIS MESSAGE.
            console.log("CSV data loaded. First row headers:", Object.keys(data[0]));

            // Also logging a few values from the column to see if they are empty/null
            console.log(`First 5 values for column "${hostingCapacityColumn}":`);
            for (let i = 0; i < Math.min(5, data.length); i++) {
                console.log(`Row ${i}:`, data[i][hostingCapacityColumn]);
            }

        } else {
            console.warn("CSV data is empty. No chart to display.");
            container.innerHTML = "<p style='text-align: center;'>CSV data is empty. No chart to display.</p>";
            return;
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

    // THIS IS THE LINE YOU NEED TO VERIFY WITH YOUR CONSOLE OUTPUT!
    // Paste the exact column name here from Object.keys(data[0]) if it's different.
    const hostingCapacityColumn = "If 'yes' above, specify the maximum number of participants for practical training"; // CURRENTLY USING YOUR PROVIDED STRING

    // Validate if the required column exists
    if (!data[0][hostingCapacityColumn]) { // data.length > 0 is already checked above
        console.error(`Error: CSV data missing required column "${hostingCapacityColumn}". Available columns:`, Object.keys(data[0]));
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: CSV data incomplete for training hosting capacity chart. Check column name. Look at console for 'Available columns:'.</p>`;
        return;
    }

    const filteredData = data.map(d => +d[hostingCapacityColumn]) // Convert to number
                             .filter(n => !isNaN(n) && n >= 0); // Filter out invalid numbers and negative counts

    if (filteredData.length === 0) {
        console.warn("No valid hosting capacity data found after processing (all values were non-numeric or less than 0, or column was empty).");
        container.innerHTML = "<p style='text-align: center;'>No valid training hosting capacity data to display (check column values or if column is entirely empty).</p>";
        return;
    }

    console.log("Processed Training Hosting Capacity data (first 10 values):", filteredData.slice(0, 10));

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
                    // Custom tick format for ranges, adjust if your bins are not simple arithmetic progression
                    if (i === thresholds.length - 1 && d === maxVal) return `${d}+`;
                    if (i === 0 && d === minVal && thresholds.length > 1 && thresholds[1] !== 0) return `${d}-${Math.floor(thresholds[1])}`; // Adjusted for 0-X range
                    const nextThreshold = thresholds[i + 1];
                    if (nextThreshold !== undefined) {
                        return `${Math.floor(d)}-${Math.floor(nextThreshold - 1)}`; // Labels like 1-5, 6-10 etc.
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
                    { y: "count", title: d => `Participants ${d.x0}-${d.x1-1}: ${d.length} labs` }, // Updated tooltip
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
