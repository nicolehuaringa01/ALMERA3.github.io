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
    const rawProcessedData = Array.from(yearCounts, ([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year);

    const finalChartData = groupHistoricalYears(rawProcessedData);

    // Chart setup
    const margin = { top: 40, right: 30, bottom: 90, left: 70 }, // Adjusted bottom margin for rotated labels
        baseWidth = 1200; // Increased width for better spacing
    const width = baseWidth - margin.left - margin.right,
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
        .domain(finalChartData.map(d => d.year))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(finalChartData, d => d.count)])
        .nice()
        .range([height, 0]);

    // Bars
    svg.selectAll(".bar")
        .data(finalChartData)
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
        .data(finalChartData)
        .enter()
        .append("text")
        .attr("x", d => x(d.year) + x.bandwidth() / 2)
        .attr("y", d => y(d.count) - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#334155")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(d => d.count);

    // Axes
    const xAxisGroup = svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d => d)); // Use custom format to allow "Pre-2000" string

    svg.append("g")
        .call(d3.axisLeft(y).ticks(6));

    // Optional: Rotate X-axis labels for readability (recommended)
    xAxisGroup.selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em");

    // Chart title (Removed as requested, but keeping this block as you had it in the code)
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "600")
        .attr("fill", "#1e293b")
        .text("ISO 17025 Accreditation Year Distribution");

// FIX: Close the .then() method call properly
}); 
// The external function definition should be outside the d3.csv block
function groupHistoricalYears(data) {
    let pre2000Count = 0;
    const post2000Data = [];

    for (const d of data) {
        // Ensure years are numbers for comparison (though they should be from rawProcessedData)
        if (Number(d.year) < 2000) { 
            pre2000Count += d.count;
        } else {
            post2000Data.push(d);
        }
    }

    const historicalGroup = {
        year: "Pre-2000",
        count: pre2000Count
    };

    const finalData = [historicalGroup, ...post2000Data];

    return finalData;
}
