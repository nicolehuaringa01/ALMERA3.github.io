//ALMERA_in_Data/2.Human_Resources_and_Training/2.1FullTimeTrainedProfessionals_2020.js

const csvDataPath1 = "/ALMERA3.github.io/data/2020_ALMERA_Survey_Capabilities.csv";

async function initializeHumanResourcesChart() {
    // Get the container element where the chart will be appended
    const container = document.getElementById("human-resources-chart-container");
    if (!container) {
        console.error("Human resources chart container element #human-resources-chart-container not found.");
        // Display a user-friendly message if the container is missing
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Error: Chart container not found in HTML.';
        document.body.appendChild(errorDiv); // Append to body or a more suitable fallback
        return;
    }

    // Define chart dimensions based on the container's width, with a fixed height
    const width = container.clientWidth;
    const height = 500; // You can adjust this height as needed

    let data;
    try {
        // Attempt to load the CSV data
        data = await d3.csv(csvDataPath1);
        console.log("Human Resources CSV data loaded successfully. Number of records:", data.length);
    } catch (error) {
        // Log the error and display a message in the container if CSV loading fails
        console.error("Error loading Human Resources CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load human resources data. Please check the console for details and ensure the CSV path is correct.</p>";
        return;
    }

    // --- Data Processing Logic (from your Observable code) ---

    // Define the bins for professional counts
    const bins = [
        { label: "1–5", min: 1, max: 5 },
        { label: "6–10", min: 6, max: 10 },
        { label: "11–20", min: 11, max: 20 },
        { label: "21+", min: 21, max: Infinity }
    ];

    // Corrected: Reordered the colors to match your desired sorting order
    const regionColors = {
        "ASIA PACIFIC": "#0083b4",
        "AFRICA": "#9942b2",
        "EUROPE": "#d10000",
        "MIDDLE EAST": "#ddb100",
        "NORTH AND LATIN AMERICA": "#009d28"
    };

    // Define the column names from your CSV
    const professionalCountColumn = "2.1 What is the number of full-time trained professionals in the laboratory?";
    const geographicRegionColumn = "1.4 Geographic Region";

    // Validate if necessary columns exist in the first data row
    if (data.length === 0 || !data[0][professionalCountColumn] || !data[0][geographicRegionColumn]) {
        console.error(`Error: CSV data is empty or missing expected columns ("${professionalCountColumn}" or "${geographicRegionColumn}").`);
        container.innerHTML = `<p style='color: red; text-align: center;'>Error: CSV data incomplete. Check column names.</p>`;
        return;
    }

    // Step 2: Count laboratories per bin per region
    const binCounts = {};

    data.forEach(d => {
        const n = +d[professionalCountColumn]; // Convert to number
        const region = d[geographicRegionColumn]?.trim().toUpperCase(); // Clean and standardize region name

        // Only process if 'n' is a valid number and 'region' is recognized
        if (isNaN(n) || !regionColors.hasOwnProperty(region)) {
            // console.warn(`Skipping data point due to invalid professional count (${n}) or unrecognized region (${region}):`, d);
            return;
        }

        const bin = bins.find(b => n >= b.min && n <= b.max);
        if (bin) {
            const key = `${bin.label}||${region}`; // Create a unique key for combination
            binCounts[key] = (binCounts[key] || 0) + 1;
        }
    });

    // Step 3: Convert the counts into an array of objects for Observable Plot
    const chartData = Object.entries(binCounts).map(([key, count]) => {
        const [range, region] = key.split("||"); // Split the key back into range and region
        return { range, region, count };
    });

    // Handle cases where no valid data is produced for the chart
    if (chartData.length === 0) {
        console.warn("No valid data points found for human resources chart after processing.");
        container.innerHTML = "<p style='text-align: center;'>No human resources data to display after filtering.</p>";
        return;
    }

    console.log("Processed Human Resources chartData for plotting:", chartData);

    // --- Chart Rendering Logic (using Observable Plot) ---

    // Function to create and append the plot. This is wrapped so it can be called on resize.
    const renderPlot = (currentWidth) => {
        // Clear any existing chart
        container.innerHTML = '';

        const HumanResourcesPlot = Plot.plot({
            width: currentWidth, // Use the current width of the container
            height: height,
            x: {
                label: "Number of Trained Professionals (Per Lab)",
                tickRotate: 0, // No tick rotation for better readability
                domain: ["1–5", "6–10", "11–20", "21+"] // Explicit order for x-axis categories
            },
            y: {
                label: "Number of Laboratories",
                grid: true // Show grid lines for the y-axis
            },
            color: {
                legend: true, // Display a legend for colors
                label: "Geographic Region",
                domain: Object.keys(regionColors), // Explicit domain order for the legend
                range: Object.values(regionColors) // Corresponding colors for the legend
            },
            marks: [
                Plot.barY(chartData, {
                    x: "range",
                    y: "count",
                    fill: "region",
                    title: d => `${d.count} labs`, // Tooltip text
                    // Corrected: Added the sort property with your specified order
                    sort: {
                        fill: "region",
                        order: ["ASIA PACIFIC", "AFRICA", "EUROPE", "MIDDLE EAST", "NORTH AND LATIN AMERICA"]
                    }
                }),
                Plot.ruleY([0]) // Draw a baseline at y=0
            ],
            style: {
                fontFamily: "Inter, sans-serif", // Use the Inter font, falling back to sans-serif
                fontSize: "12px", // General font size for the plot
            }
        });

        container.appendChild(HumanResourcesPlot);
        console.log("Human Resources chart appended to DOM.");
    };

    // Initial render of the plot
    renderPlot(width);

    // Handle responsiveness: redraw on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            renderPlot(container.clientWidth); // Re-render with new container width after a short delay
        }, 200); // Debounce to prevent excessive redraws
    });
}

// Initialize the chart when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeHumanResourcesChart);
