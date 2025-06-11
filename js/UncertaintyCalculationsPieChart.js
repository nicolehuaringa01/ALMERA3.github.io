d3.csv("observable2020SurveyUpdatedData2025.csv").then(data => {

const UncertaintyCalculationsPieChart = {
  const width = 928;
  const height = Math.min(width, 500);

  const color = d3.scaleOrdinal()
    .domain(topUncertainty.map(d => d.name))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topUncertainty.length).reverse());

  const pie = d3.pie()
      .sort(null)
      .value(d => d.value);

  const arc = d3.arc()
      .innerRadius(0) // radial pie (no hole)
      .outerRadius(Math.min(width, height) / 2 - 1);

  const arcs = pie(topUncertainty);

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; cursor: pointer;");

  // Draw pie slices
  svg.append("g")
      .attr("stroke", "white")
    .selectAll("path")
    .data(arcs)
    .join("path")
      .attr("fill", d => color(d.data.name))
      .attr("d", arc)
      .append("title")
      .text(d => `${d.data.name}: ${d.data.value.toLocaleString("en-US")}`);

  // Add legend
  const legend = svg.append("g")
      .attr("transform", `translate(${width / 2 - 200}, ${-height / 2 + 20})`)
      .attr("font-family", "Times New Roman")
      .attr("font-size", 12)
    .selectAll("g")
    .data(color.domain())
    .join("g")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legend.append("rect")
      .attr("x", 0)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", color);

  legend.append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", "0.35em")
      .text(d => d);

  return svg.node();
}


const UncertaintyCounts = {
  const counts = new Map();

  for (const row of observable2020SurveyUpdatedData2025) {
    if (row['6.8 What uncertainty and characteristic limit calculations are used by the lab?']) {
      const radionuclides = row['6.8 What uncertainty and characteristic limit calculations are used by the lab?'].split(";").map(d => d.trim());
      for (const r of radionuclides) {
        counts.set(r, (counts.get(r) || 0) + 1);
      }
    }
  }

  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}

topUncertainty = UncertaintyCounts
  .slice() // make a copy so we don't mutate the original
  .sort((a, b) => d3.descending(a.value, b.value))
  .slice(0, 5) // get top 10


    // Call the functions to create the visualization
    UncertaintyCalculationsPieChart();
    updateLabInfo(); // Initial call to show "Nothing to show yet"
});
