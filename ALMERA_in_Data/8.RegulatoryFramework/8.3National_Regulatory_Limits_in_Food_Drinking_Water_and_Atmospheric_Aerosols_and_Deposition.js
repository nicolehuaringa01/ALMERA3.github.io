// ALMERA_in_Data/8.RegulatoryFramework/8.3National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_Deposition.js

const csvDataPath3 = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // Using 'csvDataPath' for clarity in this file

async function initializeNational_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_DepositionChart() {
    const container = document.getElementById("National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_Deposition-chart-container");
    if (!container) {
      console.error("National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_Deposition chart container element #National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_Depositions-chart-container not found.");
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Error: Chart container not found in HTML for National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_Deposition chart.';
        document.body.appendChild(errorDiv);
        return;
    }

    // Set dimensions for the chart. Using current width of the container.
    const width = container.clientWidth;
    const height = 120; // Fixed height as per your Observable code

    let data;
    try {
        data = await d3.csv(csvDataPath3);
        console.log("National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_Deposition CSV data loaded successfully. Number of records:", data.length);
    } catch (error) {
        console.error("Error loading National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_Deposition CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_Deposition data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing ---
    const National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_DepositionColumn = '8.3 Does the country have national regulatory limits for radioactivity in food, drinking water, and/or atmospheric aerosols and deposition?';

    // Initialize counts for Yes/No
    const ALMERACMS = {
        "Yes": 0,
        "No": 0
    };

    // Validate if the required column exists
    if (data.length === 0 || !data[0][National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_DepositionColumn]) {
        console.error(`Error: CSV data is empty or missing expected column ("${National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_DepositionColumn}").`);
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: CSV data incomplete for National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_Deposition chart. Check column name.</p>`;
        return;
    }

    data.forEach(d => {
        let answer = d[National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_DepositionColumn];
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
        console.warn("No 'Yes' or 'No' responses found for National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_Deposition.");
        container.innerHTML = "<p style='text-align: center;'>No data to display for National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_Deposition.</p>";
        return;
    }

    // Prepare data for plotting (answer, percentage, and count)
    const chartData = Object.entries(ALMERACMS).map(([answer, count]) => ({
        answer,
        percent: count / total,
        count
    }));

    console.log("Processed National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_Deposition chartData:", chartData);

    // --- Chart Rendering ---

    // Function to create and append the plot, allowing for redraw on resize
    const renderPlot = (currentWidth) => {
        container.innerHTML = ''; // Clear existing chart

        const National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_DepositionPlot = Plot.plot({
            width: currentWidth,
            height: height,
            y: {
                label: null,
                axis: false // Hide y-axis as it's a single bar
            },
            x: {
                label: "Radioactivity Standards in food, drinking water, and/or atmospheric aerosols and deposition ",
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
        container.appendChild(National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_DepositionPlot);
        console.log("National_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_Deposition chart appended to DOM.");
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
document.addEventListener("DOMContentLoaded", initializeNational_Regulatory_Limits_in_Food_Drinking_Water_and_Atmospheric_Aerosols_and_DepositionChart);
