// ALMERA_in_Data/2025/4.Methods/4.1MethodAndRoutineDevelopment_2025.js

const csvDataPath1 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

const MethodAndRoutineDevelopmentColumn = '4.1 Has the laboratory been involved in development of routine and/or rapid analytical methods?';

/**
 * Initializes and renders the stacked bar chart for Method and Routine Development data.
 */
async function initializeMethodAndRoutineDevelopmentChart() {
    const container = document.getElementById("MethodAndRoutineDevelopment-chart-container");
    if (!container) {
        console.error("Chart container element #MethodAndRoutineDevelopment-chart-container not found.");
        container.innerHTML = '<div style="color: red; text-align: center;">Error: Chart container not found in HTML.</div>';
        return;
    }

    // Clear container, but keep it ready for content
    container.innerHTML = '';

    // Set dimensions
    const width = container.clientWidth;
    const height = 120; // Fixed height

    let data;
    try {
        // Load data using the corrected path
        data = await d3.csv(csvDataPath1);
        console.log("MethodAndRoutineDevelopment CSV data loaded successfully. Records:", data.length);
    } catch (error) {
        console.error("Error loading MethodAndRoutineDevelopment CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load MethodAndRoutineDevelopment data. Please check the console and CSV path.</p>";
        return;
    }

    // --- Data Processing ---
    
    // Validate if the required column exists
    if (data.length === 0 || !data[0].hasOwnProperty(MethodAndRoutineDevelopmentColumn)) {
        console.error(`Error: CSV data is empty or missing expected column ("${MethodAndRoutineDevelopmentColumn}").`);
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: CSV data incomplete for chart. Check column name.</p>`;
        return;
    }

    // Initialize counts for Yes/No
    const counts = {
        "Yes": 0,
        "No": 0
    };

    data.forEach(d => {
        let answer = d[MethodAndRoutineDevelopmentColumn];
        if (typeof answer === "string") {
            // Trim whitespace and take only the first part if semi-colon separated
            answer = answer.trim().split(";")[0];
            // Increment count for "Yes" or "No" answers
            if (counts.hasOwnProperty(answer)) {
                counts[answer]++;
            }
        }
    });

    const total = counts.Yes + counts.No;

    if (total === 0) {
        console.warn("No 'Yes' or 'No' responses found.");
        container.innerHTML = "<p style='text-align: center;'>No data to display for MethodAndRoutineDevelopment program.</p>";
        return;
    }

    // Display total responses count
    const totalResponsesDiv = document.createElement('div');
    totalResponsesDiv.textContent = `Total responses: ${total}`;
    totalResponsesDiv.style.fontWeight = 'bold';
    totalResponsesDiv.style.textAlign = 'left';
    totalResponsesDiv.style.paddingBottom = '5px';
    container.appendChild(totalResponsesDiv);

    // Prepare data for plotting
    const chartData = Object.entries(counts).map(([answer, count]) => ({
        answer,
        percent: count / total,
        count
    }));

    console.log("Processed MethodAndRoutineDevelopment chartData:", chartData);

    // --- Chart Rendering ---

    const renderPlot = (currentWidth) => {
        // Remove existing plot before redrawing
        const existingPlot = container.querySelector('svg');
        if (existingPlot) {
            existingPlot.remove();
        }
        
        const MethodAndRoutineDevelopmentPlot = Plot.plot({
            width: currentWidth,
            height: height,
            y: {
                label: null,
                axis: false // Hide y-axis
            },
            x: {
                label: "Lab involvement in method development",
                labelAnchor: "center",
                labelOffset: 40, 
                domain: [0, 1], // Percentage domain [0, 1]
                tickFormat: d => `${Math.round(d * 100)}%`
            },
            color: {
                // Ensure Yes comes first for stacking order
                domain: ["Yes", "No"], 
                range: ["#6aa84f", "#d13d32"], // Green for Yes, Red for No
                legend: true 
            },
            marks: [
                Plot.barX(chartData, {
                    y: () => "All Labs", 
                    x: "percent", 
                    fill: "answer", 
                    title: d => `${d.answer}: ${(d.percent * 100).toFixed(1)}% (${d.count} labs)`
                }),
                Plot.text(chartData, {
                    y: () => "All Labs",
                    // Calculate the cumulative position for text labels
                    x: (d, i) => {
                        const previousPercent = i === 0 ? 0 : chartData.slice(0, i).reduce((sum, curr) => sum + curr.percent, 0);
                        return previousPercent + d.percent / 2;
                    },
                    text: d => `${(d.percent * 100).toFixed(0)}%`,
                    fill: "white",
                    fontWeight: "bold",
                    dx: 0, 
                }),
                Plot.ruleX([0])
            ],
            // Adjusted margins for layout
            marginTop: 10,
            marginRight: 20,
            marginBottom: 50,
            marginLeft: 20,
            style: {
                fontFamily: "Inter, sans-serif",
                fontSize: "14px"
            }
        });
        container.appendChild(MethodAndRoutineDevelopmentPlot);
        console.log("Chart appended to DOM.");
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

// **FIX:** Call the function directly. The script is loaded at the end of the <body>,
// guaranteeing the container is available and avoiding potential race conditions 
// with other scripts or redundant DOMContentLoaded handlers.
initializeMethodAndRoutineDevelopmentChart();
