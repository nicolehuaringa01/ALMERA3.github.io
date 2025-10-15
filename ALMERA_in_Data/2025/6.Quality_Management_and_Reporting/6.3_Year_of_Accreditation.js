// Load CSV file
d3.csv("2025_ALMERA_Capabilities_Survey.csv").then(data => {
  
  // Column to extract
  const column = "6.3 If the laboratory is accredited against ISO 17025, specify year of accreditation.";

  // Parse, clean, and filter data
  const yearCounts = d3.rollup(
    data
      .map(d => parseInt(d[column]))
      .filter(y => y >= 1900 && y <= new Date().getFullYear()),
    v => v.length,
    y => y
  );

  const processedData = Array.from(yearCounts, ([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  // Setup chart dimensions
  const svg = d3.select("#chart"),
        margin = {top: 30, right: 30, bottom: 50, left: 70},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.count)])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(processedData.map(d => d.year))
    .range([0, height])
    .padding(0.1);

  // Bars
  g.selectAll(".bar")
    .data(processedData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("y", d => y(d.year))
    .attr("width", d => x(d.count))
    .attr("height", y.bandwidth());

  // Axes
  g.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y).tickFormat(d3.format("d")));

  g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d")));

  // Labels
  g.selectAll(".label")
    .data(processedData)
    .enter()
    .append("text")
    .attr("x", d => x(d.count) + 5)
    .attr("y", d => y(d.year) + y.bandwidth() / 1.5)
    .text(d => d.count)
    .attr("fill", "#334155")
    .attr("font-size", "12px");

});
