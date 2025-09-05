// ALMERA_in_Data/2.Human_Resources_and_Training/2.2RegularStaffTrainingProgramAvailability_2020.js

const csvDataPath2 = "/ALMERA3.github.io/data/2020_ALMERA_Capabilities_Survey.csv";

async function initializeStaffTrainingChart() {
    const container = document.getElementById("staff-training-chart-container");
    if (!container) {
        console.error("Staff training chart container element #staff-training-chart-container not found.");
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Error: Chart container not found in HTML for staff training chart.';
        document.body.appendChild(errorDiv);
        return;
    }

    const width = container.clientWidth;
    const height = 120;

    let data;
    try {
        data = await d3.csv(csvDataPath2);
        console.log("Staff Training CSV data loaded successfully. Number of records:", data.length);
    } catch (error) {
        console.error("Error loading Staff Training CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load staff training data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    const trainingColumn = '2.2 Does the laboratory have a programme for regular staff training?';

    const ALMERACMS = {
        "Yes": 0,
        "No": 0
    };

    if (data.length === 0 || !data[0][trainingColumn]) {
        console.error(`Error: CSV data is empty or missing expected column ("${trainingColumn}").`);
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: CSV data incomplete for staff training chart. Check column name.</p>`;
        return;
    }

    data.forEach(d => {
        let answer = d[trainingColumn];
        if (typeof answer === "string") {
            answer = answer.trim().split(";")[0];
            if (answer === "Yes" || answer === "No") {
                ALMERACMS[answer]++;
            }
        }
    });

    const total = ALMERACMS.Yes + ALMERACMS.No;

    if (total === 0) {
        console.warn("No 'Yes' or 'No' responses found for staff training program.");
        container.innerHTML = "<p style='text-align: center;'>No data to display for staff training program.</p>";
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

    const chartData = Object.entries(ALMERACMS).map(([answer, count]) => ({
        answer,
        percent: count / total,
        count
    }));

    console.log("Processed Staff Training chartData:", chartData);

    // Function to create and append the plot, allowing for redraw on resize
    const renderPlot = (currentWidth) => {
        
        // This time, we only clear the plot itself, not the whole container
        // to preserve the total responses text.
        const existingPlot = container.querySelector('svg');
        if (existingPlot) {
            existingPlot.remove();
        }

        const StaffTrainingPlot = Plot.plot({
            width: currentWidth,
            height: height,
            y: {
                label: null,
                axis: false
            },
            x: {
                label: "Availability of training programme for regular staff",
                labelAnchor: "center",
                labelOffset: 40,
                domain: [0, 1],
                tickFormat: d => `${Math.round(d * 100)}%`
            },
            color: {
                domain: ["Yes", "No"],
                range: ["#6aa84f", "#d13d32"],
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
                    x: d => d.percent / 2 + (d.answer === "Yes" ? 0 : chartData.find(c => c.answer === "Yes").percent),
                    text: d => `${(d.percent * 100).toFixed(0)}`,
                    fill: "white",
                    fontWeight: "bold",
                    dx: 0,
                }),
                Plot.ruleX([0])
            ],
            marginTop: 10,
            marginRight: 20,
            marginBottom: 50,
            marginLeft: 20,
            style: {
                fontFamily: "Inter, sans-serif",
                fontSize: "14px"
            }
        });
        container.appendChild(StaffTrainingPlot);
        console.log("Staff Training chart appended to DOM.");
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

// Initialize the chart when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeStaffTrainingChart);
