// Example CSV data path (change this to the path where your CSV is hosted)
// On GitHub Pages, paths are relative to the HTML file.
// If your CSV is in the same directory as this HTML, 'observable2020SurveyUpdateData2025.csv' is correct.
// If it's in a subfolder like 'data/', use './data/observable2020SurveyUpdateData2025.csv'
const csvFilePath = "observable2020SurveyUpdateData2025.csv"; 

d3.csv(csvFilePath).then(data => {
  // Group and count labs per geographic region
  let regionCounts = d3.rollups(
    data,
    v => v.length,
    d => d["1.4 Geographic Region"]?.trim()
  ).map(([region, count]) => ({ region, count }));

  // Process region names to ensure consistent capitalization
  let processedRegionCounts = regionCounts.map(d => ({
    ...d,
    region: d.region ? d.region.toLowerCase().replace(/\b\w/g, char => char.toUpperCase()) : "Unknown" // Handle potential undefined/null regions
  }));

  // Create the plot
  const LabsGeographic = Plot.plot({
    // Set a consistent height for the plot itself, if needed
    // height: 400, 
    x: {
      label: "Geographic Region",
      tickRotate: 0,
      labelOffset: 30,
      // font: "Times New Roman", // Plot.plot uses CSS fonts, better handled there
      // fontSize: "12px"
    },
    y: {
      label: "Number of Laboratories",
      // font: "Times New Roman",
      // fontSize: "14px"
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
            default: return "black"; // Fallback for unknown regions
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
    style: {
      fontFamily: "Inter, sans-serif", // Use Inter from your HTML, or specify if needed
      fontSize: "10px",
      // background: "#f9fafb" // Match body background, or set to transparent
    }
  });

  // Append plot to the DOM element with the correct ID
  const chartContainer = document.getElementById("labs-geographic-chart");
  if (chartContainer) {
    chartContainer.appendChild(LabsGeographic);
  } else {
    console.error("Error: Chart container element with ID 'labs-geographic-chart' not found.");
  }
}).catch(error => {
  console.error("Error loading or processing CSV data:", error);
  const chartContainer = document.getElementById("labs-geographic-chart");
  if (chartContainer) {
    chartContainer.innerHTML = "<p style='color: red;'>Failed to load graph data. Please check the console for errors and ensure the CSV path is correct.</p>";
  }
});
