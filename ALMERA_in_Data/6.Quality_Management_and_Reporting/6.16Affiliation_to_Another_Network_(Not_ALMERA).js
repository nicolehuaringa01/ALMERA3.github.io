// ALMERA_in_Data/6.Quality_Management_and_Reporting/6.16Affiliation_to_Another_Network.js

const csvDataPath16 = "/ALMERA3.github.io/data/2020_ALMERA_Capabilities_Survey.csv";

// Helper function to normalize strings for comparison (remove extra spaces, non-breaking spaces)
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').replace(/\u00A0/g, ' '); // Replace all whitespace with single space, remove non-breaking spaces
}

async function initializeAffiliation_to_Another_NetworkChart() {
    const container = document.getElementById("Affiliation_to_Another_Network-chart-container");
    if (!container) {
        console.error("Affiliation_to_Another_Network chart container element #Affiliation_to_Another_Network-chart-container not found.");
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Error: Chart container not found in HTML for Affiliation_to_Another_Network chart.';
        document.body.appendChild(errorDiv);
        return;
    }

    // Set dimensions for the chart. Using current width of the container.
    const width = container.clientWidth;
    const height = 120; // Fixed height as per your Observable code

    let rawData; // Renamed to rawData to distinguish from processed data
    try {
        rawData = await d3.csv(csvDataPath16);
        console.log("Affiliation_to_Another_Network CSV raw data loaded successfully. Number of records:", rawData.length);

        if (rawData.length === 0) {
            console.warn("CSV data is empty. No chart to display.");
            container.innerHTML = "<p style='text-align: center;'>CSV data is empty. No chart to display.</p>";
            return;
        }

        // *** CRUCIAL DEBUGGING STEP: Log all headers found by D3.js ***
        const parsedHeaders = Object.keys(rawData[0]);
        console.log("CSV data loaded. First row headers (as parsed by D3.js):", parsedHeaders);
        console.log("CSV data loaded. First row headers (normalized for comparison):", parsedHeaders.map(normalizeString));


    } catch (error) {
        console.error("Error loading Affiliation_to_Another_Network CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load Affiliation_to_Another_Network data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing ---
    const targetColumnName = '6.16 Is the laboratory part of another network in addition to ALMERA? (e.g. Ring of 5, RANET, PROCORAD, etc.)';

    // --- Robust Column Name Validation ---
    let foundColumn = null;
    const normalizedTarget = normalizeString(targetColumnName);

    // Iterate through the actual parsed headers to find a match
    for (const header of Object.keys(rawData[0])) {
        if (normalizeString(header) === normalizedTarget) {
            foundColumn = header; // Use the exact header string parsed by D3.js
            break;
        }
    }

    if (!foundColumn) {
        console.error(`Error: Could not find a matching column for "${targetColumnName}" in the CSV data.`);
        console.error("Available headers (normalized for comparison):", Object.keys(rawData[0]).map(normalizeString));
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: Column "${targetColumnName}" not found in CSV. Please check the exact header name in the console's 'Available headers:'.</p>`;
        return;
    }

    console.log(`Successfully identified column: "${foundColumn}" for processing.`);
    const Affiliation_to_Another_NetworkColumn = foundColumn; // Use the found exact column name

    // Initialize counts for Yes/No
    const ALMERACMS = {
        "Yes": 0,
        "No": 0
    };

    // Process data using the found column name
    rawData.forEach(d => {
        let answer = d[Affiliation_to_Another_NetworkColumn];
        if (typeof answer === "string") {
            // Trim whitespace and take only the first part if semi-colon separated
            answer = answer.trim().split(";")[0];
            // Increment count for "Yes" or "No" answers
            if (answer === "Yes" || answer === "No") {
                ALMERACMS[answer]++;
            }
        }
    });

    const total = ALMERACMS.Yes + ALMERACMS.No;

    // Check if total is zero to avoid division by zero
    if (total === 0) {
        console.warn("No 'Yes' or 'No' responses found for Affiliation_to_Another_Network.");
        container.innerHTML = "<p style='text-align: center;'>No data to display for Affiliation_to_Another_Network.</p>";
        return;
    }
    const totalResponsesDiv = document.createElement('div');
    totalResponsesDiv.textContent = `Total responses: ${total}`;
    totalResponsesDiv.style.fontWeight = 'bold';
    totalResponsesDiv.style.textAlign = 'left';
    totalResponsesDiv.style.paddingBottom = '5px';
    container.innerHTML = ''; // Clear container first
    container.appendChild(totalResponsesDiv);


    // Prepare data for plotting (answer, percentage, and count)
    const chartData = Object.entries(ALMERACMS).map(([answer, count]) => ({
        answer,
        percent: count / total,
        count
    }));

    console.log("Processed Affiliation_to_Another_Network chartData:", chartData);

    // --- Chart Rendering ---

    // Function to create and append the plot, allowing for redraw on resize
    const renderPlot = (currentWidth) => {
        const existingPlot = container.querySelector('svg');
        if (existingPlot) {
            existingPlot.remove();
        }


        const Affiliation_to_Another_NetworkPlot = Plot.plot({
            width: currentWidth,
            height: height,
            y: {
                label: null,
                axis: false // Hide y-axis as it's a single bar
            },
            x: {
                label: "Participation in other networks in addition to ALMERA",
                labelAnchor: "center",
                labelOffset: 40, // Space for the label
                domain: [0, 1], // Ensure x-axis spans 0 to 1 for percentages
                tickFormat: d => `${Math.round(d * 100)}`
            },
            color: {
                domain: ["Yes", "No"], // Explicit domain for color mapping
                range: ["#6aa84f", "#d13d32"], // Green for Yes, Red for No
                legend: true // Display legend
            },
            marks: [
                Plot.barX(chartData, {
                    y: () => "All Labs", // Single bar
                    x: "percent", // Use percentage for bar length
                    fill: "answer", // Color by Yes/No answer
                    title: d => `${d.answer}: ${(d.percent * 100).toFixed(1)}% (${d.count} labs)` // Tooltip
                }),
                Plot.text(chartData, {
                    y: () => "All Labs",
                    // Position text in the middle of each segment
                    x: d => d.percent / 2 + (d.answer === "Yes" ? 0 : chartData.find(c => c.answer === "Yes").percent),
                    text: d => `${(d.percent * 100).toFixed(0)}%`, // Display percentage rounded to whole number
                    fill: "white",
                    fontWeight: "bold",
                    dx: 0, // No horizontal offset
                }),
                Plot.ruleX([0]) // Vertical baseline at x=0
            ],
            // Adjusted margins for better layout given height and label offset
            marginTop: 10,
            marginRight: 20,
            marginBottom: 50,
            marginLeft: 20,
            style: {
                fontFamily: "Inter, sans-serif", // Using Inter as per your HTML
                fontSize: "14px"
            }
        });
        container.appendChild(Affiliation_to_Another_NetworkPlot);
        console.log("Affiliation_to_Another_Network chart appended to DOM.");
    };

    // Initial render
    renderPlot(width);

    // Handle responsiveness
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            renderPlot(container.clientWidth);
        }, 200); // Debounce
    });
}

// Initialize the chart when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeAffiliation_to_Another_NetworkChart);
