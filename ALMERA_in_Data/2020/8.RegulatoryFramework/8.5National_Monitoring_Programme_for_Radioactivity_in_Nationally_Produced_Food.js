// ALMERA_in_Data/2020/8.RegulatoryFramework/8.5National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_Food.js

const csvDataPath5 = "/ALMERA3.github.io/data/2020_ALMERA_Capabilities_Survey.csv"; // Using 'csvDataPath' for clarity in this file

async function initializeNational_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_FoodChart() {
    const container = document.getElementById("National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_Food-chart-container");
    if (!container) {
      console.error("National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_Food chart container element #National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_Foods-chart-container not found.");
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Error: Chart container not found in HTML for National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_Food chart.';
        document.body.appendChild(errorDiv);
        return;
    }

    // Set dimensions for the chart. Using current width of the container.
    const width = container.clientWidth;
    const height = 120; // Fixed height as per your Observable code

    let data;
    try {
        data = await d3.csv(csvDataPath5);
        console.log("National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_Food CSV data loaded successfully. Number of records:", data.length);
    } catch (error) {
        console.error("Error loading National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_Food CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_Food data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing ---
    const National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_FoodColumn = '8.5 Is there a national monitoring programme for radioactivity in nationally-produced food?';

    // Initialize counts for Yes/No
    const ALMERACMS = {
        "Yes": 0,
        "No": 0
    };

    // Validate if the required column exists
    if (data.length === 0 || !data[0][National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_FoodColumn]) {
        console.error(`Error: CSV data is empty or missing expected column ("${National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_FoodColumn}").`);
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: CSV data incomplete for National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_Food chart. Check column name.</p>`;
        return;
    }

    data.forEach(d => {
        let answer = d[National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_FoodColumn];
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
        console.warn("No 'Yes' or 'No' responses found for National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_Food.");
        container.innerHTML = "<p style='text-align: center;'>No data to display for National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_Food.</p>";
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

    console.log("Processed National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_Food chartData:", chartData);

    // --- Chart Rendering ---

    // Function to create and append the plot, allowing for redraw on resize
    const renderPlot = (currentWidth) => {
        const existingPlot = container.querySelector('svg');
        if (existingPlot) {
            existingPlot.remove();
        }
        const National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_FoodPlot = Plot.plot({
            width: currentWidth,
            height: height,
            y: {
                label: null,
                axis: false // Hide y-axis as it's a single bar
            },
            x: {
                label: "Presence of National Monitoring Programme for Radioactivity in Nationally-produced Food",
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
        container.appendChild(National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_FoodPlot);
        console.log("National_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_Food chart appended to DOM.");
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
document.addEventListener("DOMContentLoaded", initializeNational_Monitoring_Programme_for_Radioactivity_in_Nationally_Produced_FoodChart);
