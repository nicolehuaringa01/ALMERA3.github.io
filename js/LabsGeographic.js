// Example CSV data path (change this to the path where your CSV is hosted)
const csvFilePath = "observable2020SurveyUpdateData2025.csv";

d3.csv(csvFilePath).then(data => {
  // Group and count labs per geographic region
  let regionCounts = d3.rollups(
    data,
    v => v.length,
    d => d["1.4 Geographic Region"]?.trim()
  ).map(([region, count]) => ({ region, count }));

  // Process region names
  let processedRegionCounts = regionCounts.map(d => ({
    ...d,
    region: d.region.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())
  }));

  // Create the plot
  const LabsGeographic = Plot.plot({
    x: {
      label: "Geographic Region",
      tickRotate: 0,
      labelOffset: 30,
      font: "Times New Roman",
      fontSize: "12px"
    },
    y: {
      label: "Number of Laboratories",
      font: "Times New Roman",
      fontSize: "14px"
    },
    marks: [
      Plot.barY(processedRegionCounts, {
        x: "region",
        y: "count",
        sort: {x: "y", reverse: true},
        fill: d => {
          switch(d.region) {
            case "North And Latin America": return "#009d28";
            case "Asia Pacific": return "#0083b4";
            case "Africa": return "#9942b2";
            case "Middle East": return "#ddb100";
            case "Europe": return "#d10000";
            default: return "black";
          }
        },
        title: d => `${d.region}: ${d.count} labs`
      }),
      Plot.text(processedRegionCounts, {
        x: "region",
        y: "count",
        text: d => d.count,
        dy: 10,
        fill: "white",
        fontSize: "14px"
      }),
      Plot.ruleY([0])
    ],
    style: {
      fontFamily: "Times New Roman",
      fontSize: "10px"
    }
  });

  // Append plot to the DOM
  document.getElementById("chart").appendChild(LabsGeographic);
});
