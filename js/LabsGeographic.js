
const csvDataPath2 = "/ALMERA3.github.io/data/Observable2020Survey.csv";
console.log("Attempting to load CSV from:", csvDataPath2);

d3.csv(csvDataPath2)
  .then(data => {
    console.log("CSV Data loaded successfully. Number of rows:", data.length);
    if (data.length === 0) {
      console.warn("CSV data is empty.");
      const chartContainer = document.getElementById("labs-geographic-chart");
      if (chartContainer) {
        chartContainer.innerHTML = "<p style='color: orange;'>CSV data is empty. No chart to display.</p>";
      }
      return;
    }

    // Check if the required column exists
    const geographicRegionColumn = "1.4 Geographic Region";
    if (!data[0] || !data[0][geographicRegionColumn]) {
      console.error(`Error: CSV data missing required column "${geographicRegionColumn}". Available columns:`, Object.keys(data[0] || {}));
      const chartContainer = document.getElementById("labs-geographic-chart");
      if (chartContainer) {
        chartContainer.innerHTML = `<p style='color: red;'>Error: Missing "${geographicRegionColumn}" column in CSV data.</p>`;
      }
      return;
    }

    // Group and count labs per geographic region
    let regionCounts = d3.rollups(
      data,
      v => v.length,
      d => d[geographicRegionColumn]?.trim()
    ).map(([region, count]) => ({ region, count }));

    // Process region names to ensure consistent capitalization
    let processedRegionCounts = regionCounts.map(d => ({
      ...d,
      region: d.region ? d.region.toLowerCase().replace(/\b\w/g, char => char.toUpperCase()) : "Unknown/Unspecified" // Handle potential undefined/null regions
    }));

    // Filter out any regions that might be empty strings or 'Unknown' if not desired for display
    processedRegionCounts = processedRegionCounts.filter(d => d.region !== "" && d.region !== "Unknown/Unspecified");


    // Create the plot
    const LabsGeographic = Plot.plot({
      x: {
        label: "Geographic Region",
        tickRotate: 0, // No rotation
        labelOffset: 30, // Offset for the label
      },
      y: {
        label: "Number of Laboratories",
        // Nice.js does not support direct font properties in Plot.plot, use CSS for styling
      },
      marks: [
        Plot.barY(processedRegionCounts, {
          x: "region",
          y: "count",
          sort: {x: "y", reverse: true}, // Sort regions by count, descending
          fill: d => {
            switch(d.region) {
              case "North And Latin America": return "#009d28";
              case "Asia Pacific": return "#0083b4";
              case "Africa": return "#9942b2";
              case "Middle East": return "#ddb100";
              case "Europe": return "#d10000";
              default: return "black"; // Fallback for any other regions
            }
          },
          title: d => `${d.region}: ${d.count} labs` // Tooltip on hover
        }),
        Plot.text(processedRegionCounts, {
          x: "region",
          y: "count",
          text: d => d.count,
          dy: 10, // Offset text slightly above bars
          fill: "white",
          fontSize: "14px"
        }),
        Plot.ruleY([0]) // Baseline rule at y=0
      ],
      // Apply overall plot styling for fonts
      style: {
        fontFamily: "Inter, sans-serif", // Inherit font from HTML body or specify
        fontSize: "10px",
      },
      color: { // Ensure colors are handled properly if scaling is needed (not directly for discrete fills)
        domain: ["North And Latin America", "Asia Pacific", "Africa", "Middle East", "Europe"],
        range: ["#009d28", "#0083b4", "#9942b2", "#ddb100", "#d10000"]
      }
    });

    // Append plot to the DOM element with the correct ID
    const chartContainer = document.getElementById("labs-geographic-chart");
    if (chartContainer) {
      chartContainer.appendChild(LabsGeographic);
      console.log("Chart appended to labs-geographic-chart.");
    } else {
      console.error("Error: Chart container element with ID 'labs-geographic-chart' not found in the DOM.");
    }
  })
  .catch(error => {
    console.error("Error loading or processing CSV data:", error);
    const chartContainer = document.getElementById("labs-geographic-chart");
    if (chartContainer) {
      chartContainer.innerHTML = "<p style='color: red;'>Failed to load graph data. Please check the console for errors and ensure the CSV path is correct and the column names match.</p>";
    }
  });
