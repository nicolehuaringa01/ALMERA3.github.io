// 2.1_Full_Time_Trained_Professionals.js

const csvPath = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

// Color mapping by region
const regionColors = {
  "NORTH AND LATIN AMERICA": "#2ca02c", // green
  "EUROPE": "#d62728",                 // red
  "ASIA PACIFIC": "#1f77b4",           // blue
  "MIDDLE EAST": "#ffbf00",            // yellow
  "AFRICA": "#9467bd"                  // purple
};

// Define ranges
const ranges = [
  { label: "1-5", min: 1, max: 5 },
  { label: "6-10", min: 6, max: 10 },
  { label: "11-15", min: 11, max: 15 },
  { label: "16-20", min: 16, max: 20 },
  { label: "21+", min: 21, max: Infinity }
];

// SVG setup
const container = d3.select("#human-resources-chart-container");
const width = 900;
const height = 500;
// Increased margin.top to ensure space for the legend.
const margin = { top: 120, right: 50, bottom: 120, left: 80 }; 

const svg = container.append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("font-family", "Inter, sans-serif");

// Tooltip
const tooltip = container.append("div")
  .style("position", "absolute")
  .style("background", "white")
  .style("padding", "6px 10px")
  .style("border", "1px solid #ccc")
  .style("border-radius", "6px")
  .style("font-size", "14px")
  .style("display", "none")
  .style("pointer-events", "none");

// Load data
d3.csv(csvPath).then(data => {
  const regionCol = "1.4 Geographic Region";
  const trainedCol = "2.1 What is the number of full-time trained professionals and technicians in the laboratory?";

  // Filter valid numeric responses
  const validData = data.filter(d => d[trainedCol] && !isNaN(+d[trainedCol]));

  const totalLabs = validData.length;

  // Create group counts per region and range
  const grouped = d3.rollup(
    validData,
    v => v.length,
    d => d[regionCol],
    d => {
      const num = +d[trainedCol];
      const range = ranges.find(r => num >= r.min && num <= r.max);
      return range ? range.label : "Unknown";
    }
  );

  // Prepare data for visualization
  const chartData = [];
  ranges.forEach(range => {
    let totalCount = 0;
    for (const region of grouped.keys()) {
      const count = grouped.get(region)?.get(range.label) || 0;
      totalCount += count;
      const totalRegion = d3.sum(Array.from(grouped.get(region)?.values() || []));
      const pct = totalRegion > 0 ? ((count / totalRegion) * 100).toFixed(1) : 0;
      chartData.push({
        range: range.label,
        region,
        count,
        pct
      });
    }
    chartData.push({
      range: range.label,
      region: "TOTAL",
      count: totalCount
    });
  });

  // Axes
  const x0 = d3.scaleBand()
    .domain(ranges.map(r => r.label))
    .range([margin.left, width - margin.right])
    .paddingInner(0.3);

  const x1 = d3.scaleBand()
    .domain(Object.keys(regionColors))
    .range([0, x0.bandwidth()])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(chartData.filter(d => d.region === "TOTAL"), d => d.count) * 1.2])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Gray total bars
  svg.selectAll(".total-bar")
    .data(chartData.filter(d => d.region === "TOTAL"))
    .enter()
    .append("rect")
    .attr("x", d => x0(d.range))
    .attr("y", d => y(d.count))
    .attr("width", x0.bandwidth())
    .attr("height", d => y(0) - y(d.count))
    .attr("fill", "#e0e0e0");

  // Colored bars
  svg.selectAll(".region-bar")
    .data(chartData.filter(d => d.region !== "TOTAL"))
    .enter()
    .append("rect")
    .attr("x", d => x0(d.range) + x1(d.region))
    .attr("y", d => y(d.count))
    .attr("width", x1.bandwidth())
    .attr("height", d => y(0) - y(d.count))
    .attr("fill", d => regionColors[d.region])
    .on("mousemove", (event, d) => {
      tooltip.style("display", "block")
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px")
        .html(`<b>${d.region}</b><br>Total labs: ${d.count}<br>(${d.pct}% of region)`);
    })
    .on("mouseleave", () => tooltip.style("display", "none"));

  // Axes rendering
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .style("font-size", "14px");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "14px");

  // Vertical legend on the left
// FIX: Changed the translate Y value to move the legend further up.
// I'm using margin.top / 3 as a starting point, which should put it high up in the margin area.
const legend = svg.append("g")
  .attr("transform", `translate(${margin.left}, 30)`); // Adjusted from ${margin.top} to 30

let i = 0;
for (const [region, color] of Object.entries(regionColors)) {
  const yOffset = i * 25; // spacing between items

  legend.append("rect")
    .attr("x", 0)
    .attr("y", yOffset)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", color);

  legend.append("text")
    .attr("x", 20)
    .attr("y", yOffset + 12) // align text with rect
    .text(region)
    .style("font-size", "14px")
    .style("font-weight", "600");

  i++;
}

// Total responses in top-right corner
svg.append("text")
  .attr("x", width - margin.right)  // right edge minus margin
  .attr("y", 30)            // FIX: Also adjusted this Y position to match the new legend position
  .attr("text-anchor", "end")       // align text to the right
  .style("font-size", "14px")
  .style("font-weight", "600")
  .text(`Total responses: ${totalLabs}`);

});
