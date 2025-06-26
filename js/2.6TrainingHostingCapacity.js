// js/2.6TrainingHostingCapacity.js

// IMPORTANT: Verify this path carefully!
// This path is relative to the root of your GitHub Pages project.
// Based on your previous successful paths, this assumes:
// - Your GitHub Pages are serving from 'https://nicolehuaringa01.github.io/ALMERA3.github.io/'
// - Your CSV file is located at '/ALMERA3.github.io/data/Observable2020Survey.csv'
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

    // Define chart dimensions based on the container's width, with a fixed height
    const width = container.clientWidth;
    const height = 500; // Height as per your Observable code

    let data;
    try {
        data = await d3.csv(csvDataPath6);
        console.log("Training Hosting Capacity CSV data loaded successfully. Number of records:", data.length);
    } catch (error) {
        console.error("Error loading Training Hosting Capacity CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load training hosting capacity data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing (from your Observable code) ---

    // Define custom max value and number of bins for the histogram
    const minVal = 0; // Assuming minimum can be 0 or 1, adjusted for safety
    const maxVal = 20; // Maximum value for the x-axis domain
    const numBins = 5;
    const binWidth = (maxVal - minVal) / numBins; // Calculate bin width
    // Generate thresholds for the bins (e.g., [0, 4, 8, 12, 16, 20])
    const thresholds = Array.from({length: numBins + 1}, (_, i) => minVal + i * binWidth);

    // Define the column for hosting capacity
    const hostingCapacityColumn = 'If "yes" above, specify the maximum number of participants for practical training';

    // Validate if the required column exists
    if (data.length === 0 || !data[0][hostingCapacityColumn]) {
        console.error(`Error: CSV data is empty or missing expected column ("${hostingCapacityColumn}").`);
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: CSV data incomplete for training hosting capacity chart. Check column name.</p>`;
        return;
    }

    // Filter and prepare data for the histogram.
    // We only want valid numbers from the hosting capacity column.
    const filteredData = data.map(d => +d[hostingCapacityColumn]) // Convert to number
                             .filter(n => !isNaN(n) && n >= 0); // Filter out invalid numbers and negative counts

    if (filteredData.length === 0) {
        console.warn("No valid hosting capacity data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No valid training hosting capacity data to display.</p>";
        return;
    }

    console.log("Processed Training Hosting Capacity data:", filteredData);

    // --- Chart Rendering Logic (using Observable Plot) ---

    // Function to create and append the plot, allowing for redraw on resize
    const renderPlot = (currentWidth) => {
        container.innerHTML = ''; // Clear any existing chart

        const TrainingHostingCapacityPlot = Plot.plot({
            width: currentWidth, // Use the current width of the container
            height: height,
            x: {
                label: "Amount of Participants that each lab could host",
                domain: [minVal, maxVal], // Explicit domain for x-axis
                tickFormat: (d, i) => { // Custom tick format to show ranges
                    if (i === thresholds.length - 1) return `${d}+`; // For the last bin (e.g., 20+)
                    if (i === 0 && thresholds[1] === bins[0].max + 1) return `0-${bins[0].max}`; // For 0 to 5 or similar initial bin
                    const binLabel = bins.find(b => d >= b.min && d <= b.max);
                    return binLabel ? binLabel.label : `${d}`;
                },
                // Add explicit ticks if thresholds are not automatically picked well by Plot
                // ticks: thresholds
            },
            y: {
                label: "Number of Laboratories",
                grid: true // Show grid lines for the y-axis
            },
            marks: [
                // Histogram bars
                Plot.rectY(filteredData, Plot.binX(
                    { y: "count", title: d => `${d.x1 - d.x0} participants: ${d.length} labs` }, // Tooltip
                    {
                        x: d => d, // Pass the numerical value directly
                        thresholds: thresholds, // Use the custom thresholds
                        fill: "black" // Fill bars with black as specified
                    }
                )),
                Plot.ruleY([0]) // Draw a baseline at y=0
            ],
            style: {
                fontFamily: "Inter, sans-serif", // Use Inter as per your HTML
                fontSize: "12px", // General font size for the plot
            }
        });

        container.appendChild(TrainingHostingCapacityPlot);
        console.log("Training Hosting Capacity chart appended to DOM.");
    };

    // Initial render of the plot
    renderPlot(width);

    // Handle responsiveness: redraw on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            renderPlot(container.clientWidth); // Re-render with new container width after a short delay
        }, 200); // Debounce to prevent excessive redraws
    });
}

// Initialize the chart when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeTrainingHostingCapacityChart);
