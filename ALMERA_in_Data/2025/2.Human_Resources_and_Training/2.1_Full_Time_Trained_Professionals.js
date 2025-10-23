//ALMERA_in_Data/2025/2.Human_Resources_and_Training/2.1_Full_Time_Trained_Professionals.js

const csvDataPath1 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

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
    const professionalCountColumn = "2.1 What is the number of full-time trained professionals and technicians in the laboratory?";
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
  container.innerHTML = '';

  // Compute total labs per region (for gray background bars)
  const totalsByRegion = d3.rollup(
    chartData,
    v => d3.sum(v, d => d.count),
    d => d.region
  );

  // Convert totals to array for sorting
  const totalsArray = Array.from(totalsByRegion, ([region, total]) => ({ region, total }));

  // Sort regions by total (ascending → least to most)
  const sortedRegions = totalsArray.sort((a, b) => a.total - b.total).map(d => d.region);

  // Plot
  const HumanResourcesPlot = Plot.plot({
    width: currentWidth,
    height: height,
    marginLeft: 60,
    marginBottom: 60,
    x: {
      domain: sortedRegions,
      label: "Geographic Region",
      tickRotate: 0
    },
    y: {
      label: "Number of Laboratories",
      grid: true
    },
    color: {
      legend: true,
      label: "Number of Full-Time Trained Professionals (Per Lab)",
      domain: ["1–5", "6–10", "11–20", "21+"],
      range: ["#7f7f7f", "#0083b4", "#9942b2", "#d10000"] // You can change range if desired
    },
    marks: [
      // Gray background bars (total per region)
      Plot.barY(totalsArray, {
        x: "region",
        y: "total",
        fill: "#e0e0e0"
      }),

      // Colored grouped bars for each range within each region
      Plot.barY(chartData, {
        x: "region",
        y: "count",
        fill: "range",
        sort: { x: sortedRegions, fill: ["1–5", "6–10", "11–20", "21+"] },
        title: d => `${d.range}: ${d.count} labs`
      }),

      // Labels above gray bars (total)
      Plot.text(totalsArray, {
        x: "region",
        y: d => d.total + 2, // position slightly above bar
        text: d => `${d.total} Labs`,
        textAnchor: "middle",
        dy: -6,
        fill: "#333",
        fontWeight: "600"
      }),

      Plot.ruleY([0])
    ],
    style: {
      fontFamily: "Inter, sans-serif",
      fontSize: "12px"
    }
  });

  container.appendChild(HumanResourcesPlot);
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
