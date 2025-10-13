// ALMERA_in_Data/2025/7.EnvironmentalMonitoringCapabilities/7.6Gamma_Dose_Rate_Monitoring_Network_Availability.js

const csvDataPath6 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

async function initializeGamma_Dose_Rate_Monitoring_Network_AvailabilityChart() {
    const container = document.getElementById("Gamma_Dose_Rate_Monitoring_Network_Availability-chart-container");
    if (!container) {
      console.error("Gamma_Dose_Rate_Monitoring_Network_Availability chart container element #Gamma_Dose_Rate_Monitoring_Network_Availabilitys-chart-container not found.");
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Error: Chart container not found in HTML for Gamma_Dose_Rate_Monitoring_Network_Availability chart.';
        document.body.appendChild(errorDiv);
        return;
    }

    // Set dimensions for the chart. Using current width of the container.
    const width = container.clientWidth;
    const height = 120; // Fixed height as per your Observable code

    let data;
    try {
        data = await d3.csv(csvDataPath6);
        console.log("Gamma_Dose_Rate_Monitoring_Network_Availability CSV data loaded successfully. Number of records:", data.length);
    } catch (error) {
        console.error("Error loading Gamma_Dose_Rate_Monitoring_Network_Availability CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load Gamma_Dose_Rate_Monitoring_Network_Availability data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing ---
    const Gamma_Dose_Rate_Monitoring_Network_AvailabilityColumn = "7.4 Is there a gamma dose rate monitoring network operational in the country?";

    // Initialize counts for Yes/No
    const ALMERACMS = {
        "Yes": 0,
        "No": 0
    };

    // Validate if the required column exists
    if (data.length === 0 || !data[0][Gamma_Dose_Rate_Monitoring_Network_AvailabilityColumn]) {
        console.error(`Error: CSV data is empty or missing expected column ("${Gamma_Dose_Rate_Monitoring_Network_AvailabilityColumn}").`);
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: CSV data incomplete for Gamma_Dose_Rate_Monitoring_Network_Availability chart. Check column name.</p>`;
        return;
    }

    data.forEach(d => {
        let answer = d[Gamma_Dose_Rate_Monitoring_Network_AvailabilityColumn];
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
        console.warn("No 'Yes' or 'No' responses found for Gamma_Dose_Rate_Monitoring_Network_Availability.");
        container.innerHTML = "<p style='text-align: center;'>No data to display for Gamma_Dose_Rate_Monitoring_Network_Availability.</p>";
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

    console.log("Processed Gamma_Dose_Rate_Monitoring_Network_Availability chartData:", chartData);

    // --- Chart Rendering ---

    // Function to create and append the plot, allowing for redraw on resize
    const renderPlot = (currentWidth) => {
        const existingPlot = container.querySelector('svg');
        if (existingPlot) {
            existingPlot.remove();
        }

        const Gamma_Dose_Rate_Monitoring_Network_AvailabilityPlot = Plot.plot({
            width: currentWidth,
            height: height,
            y: {
                label: null,
                axis: false // Hide y-axis as it's a single bar
            },
            x: {
                label: "Automatic monitors for gamma-ray spectrometry of aerosols and/or gasouse iodine in the country",
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
        container.appendChild(Gamma_Dose_Rate_Monitoring_Network_AvailabilityPlot);
        console.log("Gamma_Dose_Rate_Monitoring_Network_Availability chart appended to DOM.");
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
document.addEventListener("DOMContentLoaded", initializeGamma_Dose_Rate_Monitoring_Network_AvailabilityChart);
