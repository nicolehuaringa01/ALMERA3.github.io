// ALMERA_in_Data/2025/7.EnvironmentalMonitoringCapabilities/7.5Environmental_Monitoring_Network_for_Gamma_Spectrometry_of_Aerosols_for_gaseous_iodine_in_country
const csvDataPath5_1 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

async function initializeData_Reporting_In_Emergency_SituationsChart() {
    const container = document.getElementById("Data_Reporting_In_Emergency_Situations-chart-container");
    if (!container) {
      console.error("Environmental_Monitoring_Network_for_Gamma_Spectrometry_of_Aerosols_for_gaseous_iodine_in_countrys-chart-container not found.");
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Error: Chart container not found in HTML for Data_Reporting_In_Emergency_Situations chart.';
        document.body.appendChild(errorDiv);
        return;
    }

        // Set dimensions for the chart. Using current width of the container.
    const width = container.clientWidth;
    const height = 120; // Fixed height as per your Observable code

    let data;
    try {
        data = await d3.csv(csvDataPath5_1);
        console.log("Data_Reporting_In_Emergency_Situations CSV data loaded successfully. Number of records:", data.length);
    } catch (error) {
        console.error("Error loading Data_Reporting_In_Emergency_Situations CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load Data_Reporting_In_Emergency_Situations data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing (MODIFIED) ---

    // 1. Get all headers and trim whitespace
    const headers = data.length > 0 ? Object.keys(data[0]).map(h => h.trim()) : [];

    // 2. Robustly search for the column using key phrases
    const targetColumn = headers.find(h =>
        h.includes("7.5") &&
        h.includes("Is there an environmental monitoring network of automatic monitors for gamma-ray spectrometry of aerosols and/or for gaseous iodine in the laboratory's country?")
    );

    // Use the found column name for the rest of the script
    const Data_Reporting_In_Emergency_SituationsColumn = targetColumn;

    // Initialize counts for Yes/No
    const ALMERACMS = {
        "Yes": 0,
        "No": 0
    };

    // Validate if the required column exists
    if (!Data_Reporting_In_Emergency_SituationsColumn) { // Simpler check using the new variable
        console.error("Available headers:", headers);
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: Column not found. Check unique keywords (7.5, Is there an environmental monitoring network of automatic monitors for gamma-ray spectrometry of aerosols and/or for gaseous iodine in the laboratory's country?).</p>`;
        return;
    }

    data.forEach(d => {
        let answer = d[Data_Reporting_In_Emergency_SituationsColumn];
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
        console.warn("No 'Yes' or 'No' responses found for Data_Reporting_In_Emergency_Situations.");
        container.innerHTML = "<p style='text-align: center;'>No data to display for Data_Reporting_In_Emergency_Situations.</p>";
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

    console.log("Processed Data_Reporting_In_Emergency_Situations chartData:", chartData);

    // --- Chart Rendering ---

    // Function to create and append the plot, allowing for redraw on resize
    const renderPlot = (currentWidth) => {
        const existingPlot = container.querySelector('svg');
        if (existingPlot) {
            existingPlot.remove();
        }

        const Data_Reporting_In_Emergency_SituationsPlot = Plot.plot({
            width: currentWidth,
            height: height,
            y: {
                label: null,
                axis: false // Hide y-axis as it's a single bar
            },
            x: {
                label: "Availability of an environmental monitoring network of automatic monitors for gamma-ray spectrometry of aerosols and/or for gaseous iodine in the country",
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
        container.appendChild(Data_Reporting_In_Emergency_SituationsPlot);
        console.log("Data_Reporting_In_Emergency_Situations chart appended to DOM.");
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
document.addEventListener("DOMContentLoaded", initializeData_Reporting_In_Emergency_SituationsChart);
