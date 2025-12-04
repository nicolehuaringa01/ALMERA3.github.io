// ALMERA_in_Data/2025/7.EnvironmentalMonitoringCapabilities/7.5Environmental_Monitoring_Network_for_Gamma_Spectrometry_of_Aerosols_for_gaseous_iodine_in_country.js

// FIX 2: Corrected CSV path for GitHub Pages
const csvDataPath5 = "ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

async function initializeEnvironmental_Monitoring_Network_for_Gamma_Spectrometry_of_Aerosols_for_gaseous_iodine_in_countryChart() {
    const container = document.getElementById("Environmental_Monitoring_Network_for_Gamma_Spectrometry_of_Aerosols_for_gaseous_iodine_in_country-chart-container");
    // Simplified container check logic
    if (!container) {
        console.error("Chart container not found.");
        return;
    }

    // Set dimensions for the chart
    const width = container.clientWidth;
    const height = 120; // Fixed height

    let data;
    try {
        data = await d3.csv(csvDataPath5);
        console.log("CSV data loaded successfully. Number of records:", data.length);
    } catch (error) {
        console.error("Error loading CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing (FIX 1: Robust Column Finding) ---

    // 1. Get all headers and trim whitespace
    const headers = data.length > 0 ? Object.keys(data[0]).map(h => h.trim()) : [];
    
    // 2. Search for the column using key phrases unique to this question
    const targetColumn = headers.find(h => 
        h.includes("7.5") && 
        h.includes("environmental monitoring network") && 
        h.includes("aerosols")
    );

    // Use the found column name, or if not found, use a fallback (which will cause the check below to fail)
    const Environmental_Monitoring_Network_for_Gamma_Spectrometry_of_Aerosols_for_gaseous_iodine_in_countryColumn = targetColumn;


    // Initialize counts for Yes/No
    const ALMERACMS = {
        "Yes": 0,
        "No": 0
    };

    // Validate if the required column exists
    if (!Environmental_Monitoring_Network_for_Gamma_Spectrometry_of_Aerosols_for_gaseous_iodine_in_countryColumn) {
        console.error("Available headers:", headers);
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: Column not found. Check unique keywords (7.5, network, aerosols).</p>`;
        return;
    }
    
    data.forEach(d => {
        let answer = d[Environmental_Monitoring_Network_for_Gamma_Spectrometry_of_Aerosols_for_gaseous_iodine_in_countryColumn];
        if (typeof answer === "string") {
            // Trim whitespace and take only the first part if semi-colon separated
            answer = answer.trim().split(";")[0];
            // Increment count for "Yes" or "No" answers
            if (answer === "Yes" || answer === "No") {
                ALMERACMS[answer]++;
            }
        }
    });

    // ... (rest of the calculation and rendering logic is unchanged and is correct) ...
    const total = ALMERACMS.Yes + ALMERACMS.No;

    // Check if total is zero to avoid division by zero
    if (total === 0) {
        console.warn("No 'Yes' or 'No' responses found for chart.");
        container.innerHTML = "<p style='text-align: center;'>No data to display.</p>";
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

    console.log("Processed chartData:", chartData);

    // --- Chart Rendering ---

    // Function to create and append the plot, allowing for redraw on resize
    const renderPlot = (currentWidth) => {
        const existingPlot = container.querySelector('svg');
        if (existingPlot) {
            existingPlot.remove();
        }
        const chartPlot = Plot.plot({
            width: currentWidth,
            height: height,
            y: {
                label: null,
                axis: false // Hide y-axis as it's a single bar
            },
            x: {
                label: "Automatic monitors for gamma-ray spectrometry of aerosols and/or gaseous iodine in the country",
                labelAnchor: "center",
                labelOffset: 40, // Space for the label
                domain: [0, 1], // Ensure x-axis spans 0 to 1 for percentages
                tickFormat: d => `${Math.round(d * 100)}%` // Added percent symbol for clarity
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
                    x: (d, i) => {
                         // Find the 'Yes' percentage to correctly offset the 'No' label
                         const yesPercent = chartData.find(c => c.answer === "Yes")?.percent || 0;
                         return d.answer === "Yes" ? d.percent / 2 : yesPercent + d.percent / 2;
                    },
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
        container.appendChild(chartPlot);
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

// Initialize the chart when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeEnvironmental_Monitoring_Network_for_Gamma_Spectrometry_of_Aerosols_for_gaseous_iodine_in_countryChart);
