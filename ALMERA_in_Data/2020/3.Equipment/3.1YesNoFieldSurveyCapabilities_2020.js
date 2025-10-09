// ALMERA_in_Data/2020/3.Equipment/3.1YesNoFieldSurveyCapabilities.js

const csvDataPath13 = "/ALMERA3.github.io/data/2020_ALMERA_Capabilities_Survey.csv";

// Helper function to normalize strings for robust column matching
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').replace(/\u00A0/g, ' ');
}

async function initializeYNFieldSurveyChart() {
    const container = document.getElementById("YNFieldSurvey-chart-container");
    if (!container) {
        console.error("YNFieldSurvey chart container element #YNFieldSurvey-chart-container not found.");
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Error: Chart container not found in HTML for YNFieldSurvey chart.';
        document.body.appendChild(errorDiv);
        return;
    }

    // Set dimensions for the chart. Using current width of the container.
    const width = container.clientWidth;
    const height = 120; // Fixed height as per your Observable code

    let data;
    try {
        data = await d3.csv(csvDataPath13);
        console.log("YNFieldSurvey CSV data loaded successfully. Number of records:", data.length);
    } catch (error) {
        console.error("Error loading YNFieldSurvey CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load YNFieldSurvey data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing ---
    const YNFieldSurveyColumn = "3.1 Does the laboratory have field survey capabilities?";

    // Find the exact column name in the loaded data using normalization
    let foundColumn = null;
    const normalizedTargetColumn = normalizeString(YNFieldSurveyColumn);
    if (data.length > 0) {
        for (const header of Object.keys(data[0])) {
            if (normalizeString(header) === normalizedTargetColumn) {
                foundColumn = header;
                break;
            }
        }
    }

    if (!foundColumn) {
        console.error(`Column "${YNFieldSurveyColumn}" not found in CSV.`);
        console.error("Available headers (normalized):", data.length > 0 ? Object.keys(data[0]).map(normalizeString) : "No data rows to inspect headers.");
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: Data column "${YNFieldSurveyColumn}" not found.</p>`;
        return;
    }

    // Initialize counts for Yes/No
    const ALMERACMS = {
        "Yes": 0,
        "No": 0
    };

    data.forEach(d => {
        let answer = d[foundColumn];
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
        console.warn("No 'Yes' or 'No' responses found for YNFieldSurvey program.");
        container.innerHTML = "<p style='text-align: center;'>No data to display for YNFieldSurvey program.</p>";
        return;
    }

    // Create the "Total responses" div and prepend it to the container.
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

    console.log("Processed YNFieldSurvey chartData:", chartData);

    // --- Chart Rendering ---

    // Function to create and append the plot, allowing for redraw on resize
    const renderPlot = (currentWidth) => {
        const existingPlot = container.querySelector('svg');
        if (existingPlot) {
            existingPlot.remove();
        }
        const YNFieldSurveyPlot = Plot.plot({
            width: currentWidth,
            height: height,
            y: {
                label: null,
                axis: false // Hide y-axis as it's a single bar
            },
            x: {
                label: "Availability of Field Survey Capabilities",
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
        container.appendChild(YNFieldSurveyPlot);
        console.log("YNFieldSurvey chart appended to DOM.");
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
document.addEventListener("DOMContentLoaded", initializeYNFieldSurveyChart);
