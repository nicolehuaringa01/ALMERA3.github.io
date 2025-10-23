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
    .domain([0, d3.max(chartData.filter(d => d.region === "TOTAL"), d => d.count) * 1.1])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // ... (The rest of your code remains the same until the gray bars)

  // Gray total bars
  svg.selectAll(".total-bar")
    .data(chartData.filter(d => d.region === "TOTAL"))
    .enter()
    .append("rect")
    .attr("x", d => x0(d.range))
    .attr("y", d => y(d.count))
    .attr("width", x0.bandwidth())
    .attr("height", d => y(0) - y(d.count))
    .attr("fill", "#e0e0e0")
     // --- TOOLTIP FUNCTIONALITY ---
    .on("mousemove", (event, d) => {
        const totalPct = ((d.count / totalLabs) * 100).toFixed(1);
        tooltip.style("display", "block")
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px")
          .html(`
              <b>Range: ${d.range}</b><br>
              Total labs: ${d.count}<br>
              (${totalPct}% of all respondents)
          `);
    })
    .on("mouseleave", () => tooltip.style("display", "none"));

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

// New Legend positioning
// Let's place it at the top, just below the very top margin, and center it or place it near the left for clarity.
// New Legend positioning
const legend = svg.append("g")
  .attr("transform", `translate(${margin.left}, 30)`); // Starting position for the legend

let currentX = 0; // Tracks the current X position for placing legend items

for (const [region, color] of Object.entries(regionColors)) {
  // Group for each legend item (rect + text) to easily position them
  const legendItem = legend.append("g")
    .attr("transform", `translate(${currentX}, 0)`);

  legendItem.append("rect")
    .attr("x", 0)
    .attr("y", 0) // Align to the top of the legend item group
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", color);

  // Append text
  const textElement = legendItem.append("text")
    .attr("x", 20) // 15 (rect width) + 5 (small gap)
    .attr("y", 12) // Align text vertically with the rect
    .text(region)
    .style("font-size", "14px")
    .style("font-weight", "600");

  // --- FIX: Replaced the dynamic calculation with a safe estimate ---
  // We need to estimate the width of the text to calculate the position of the next legend item.
  // A quick way is to use a rough estimate: (Region Name Length * Font Size Factor)
  // Let's use 8 pixels per character for 14px text, plus a generous fixed padding.
  const textWidthEstimate = region.length * 8; 

  // Update currentX for the next legend item
  // 20 (rect and gap) + textWidthEstimate + 40 (generous padding for next item)
  currentX += 20 + textWidthEstimate + 40; 
}

// Total responses in top-right corner (This remains as is)
svg.append("text")
  .attr("x", width - margin.right)  
  .attr("y", 30)            
  .attr("text-anchor", "end")       
  .style("font-size", "14px")
  .style("font-weight", "600")
  .text(`Total responses: ${totalLabs}`);

});
