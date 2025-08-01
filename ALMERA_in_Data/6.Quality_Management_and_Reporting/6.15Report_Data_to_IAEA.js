// ALMERA_in_Data/6.Quality_Management_and_Reporting/6.15Report_Data_to_IAEA.js

const csvDataPath15 = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // Using 'csvDataPath' for clarity in this file

async function initializeReport_Data_to_IAEAChart() {
    const container = document.getElementById("Report_Data_to_IAEA-chart-container");
    if (!container) {
      console.error("Report_Data_to_IAEA chart container element #Report_Data_to_IAEA-chart-container not found.");
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Error: Chart container not found in HTML for Report_Data_to_IAEA chart.';
        document.body.appendChild(errorDiv);
        return;
    }

    // Set dimensions for the chart. Using current width of the container.
    const width = container.clientWidth;
    const height = 120; // Fixed height as per your Observable code

    let data;
    try {
        data = await d3.csv(csvDataPath15);
        console.log("Report_Data_to_IAEA CSV data loaded successfully. Number of records:", data.length);
    } catch (error) {
        console.error("Error loading Report_Data_to_IAEA CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load Report_Data_to_IAEA data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing ---
    const Report_Data_to_IAEAColumn = '6.15 Can the laboratory report data to the IAEA ALMERA coordination if requested?';

    // Initialize counts for Yes/No
    const ALMERACMS = {
        "Yes": 0,
        "No": 0
    };

    // Validate if the required column exists
    if (data.length === 0 || !data[0][Report_Data_to_IAEAColumn]) {
        console.error(`Error: CSV data is empty or missing expected column ("${Report_Data_to_IAEAColumn}").`);
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: CSV data incomplete for Report_Data_to_IAEA chart. Check column name.</p>`;
        return;
    }

    data.forEach(d => {
        let answer = d[Report_Data_to_IAEAColumn];
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
        console.warn("No 'Yes' or 'No' responses found for Report_Data_to_IAEA.");
        container.innerHTML = "<p style='text-align: center;'>No data to display for Report_Data_to_IAEA.</p>";
        return;
    }

    // Prepare data for plotting (answer, percentage, and count)
    const chartData = Object.entries(ALMERACMS).map(([answer, count]) => ({
        answer,
        percent: count / total,
        count
    }));

    console.log("Processed Report_Data_to_IAEA chartData:", chartData);

    // --- Chart Rendering ---

    // Function to create and append the plot, allowing for redraw on resize
    const renderPlot = (currentWidth) => {
        container.innerHTML = ''; // Clear existing chart

        const Report_Data_to_IAEAPlot = Plot.plot({
            width: currentWidth,
            height: height,
            y: {
                label: null,
                axis: false // Hide y-axis as it's a single bar
            },
            x: {
                label: "Data reported to IAEA ALMERA Coordination if requested",
                labelAnchor: "center",
                labelOffset: 40, // Space for the label
                domain: [0, 1] // Ensure x-axis spans 0 to 1 for percentages
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
        container.appendChild(Report_Data_to_IAEAPlot);
        console.log("Report_Data_to_IAEA chart appended to DOM.");
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
document.addEventListener("DOMContentLoaded", initializeReport_Data_to_IAEAChart);
