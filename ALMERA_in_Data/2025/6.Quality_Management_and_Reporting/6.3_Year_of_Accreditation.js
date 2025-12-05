// Load CSV file
d3.csv("/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv").then(data => {

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

  // Chart setup
  const margin = { top: 40, right: 30, bottom: 50, left: 70 },
        width = 1200 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  // Append SVG to container
  const svg = d3.select("#Year_of_Accreditation-chart-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const x = d3.scaleBand()
    .domain(processedData.map(d => d.year))
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.count)])
    .nice()
    .range([height, 0]);

  // Bars
  svg.selectAll(".bar")
    .data(processedData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.count))
    .attr("fill", "#1e88e5");

  // Labels
  svg.selectAll(".label")
    .data(processedData)
    .enter()
    .append("text")
    .attr("x", d => x(d.year) + x.bandwidth() / 2)
    .attr("y", d => y(d.count) - 5)
    .attr("text-anchor", "middle")
    .attr("fill", "#334155")
    .attr("font-size", "12px")
    .text(d => d.count);

  // Axes
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .call(d3.axisLeft(y).ticks(6));

  // Chart title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "600")
    .attr("fill", "#1e293b")
    .text("ISO 17025 Accreditation Year Distribution");

});
