// ALMERA_in_Data/2025/2.Human_Resources_and_Training/2.9_ALMERA_CMs_Hosting_Capacity.js

const csvDataPath8_1 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

const ALMERACMsHostingCapacityColumnName = "2.8 State the maximum number of participants";

// Helper function to normalize strings for robust column matching
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').replace(/\u00A0/g, ' ');
}

/**
 * Renders a histogram of ALMERACMs hosting capacity.
 */
async function renderALMERACMsHostingCapacityHistogram() {
    const container = d3.select("#almera-hosting-capacity-chart-container");
    container.html(""); // Clear previous content

    // Set up chart dimensions
    const width = 928;
    const height = 500;
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };

    let data;
    try {
        data = await d3.csv(csvDataPath8_1);
    } catch (error) {
        console.error("Error loading CSV data for 2.9 ALMERACMs Hosting Capacity:", error);
        container.append("p").style("color", "red").text("Failed to load data for ALMERA CMs Hosting Capacity. Please check the CSV file path and content.");
        return;
    }

    // Find the exact column name in the loaded data
    let foundColumn = null;
    const normalizedTargetColumn = normalizeString(ALMERACMsHostingCapacityColumnName);
    if (data.length > 0) {
        for (const header of Object.keys(data[0])) {
            if (normalizeString(header) === normalizedTargetColumn) {
                foundColumn = header;
                break;
            }
        }
    }

    if (!foundColumn) {
        console.error(`Column "${ALMERACMsHostingCapacityColumnName}" not found in CSV for 2.9 ALMERACMs Hosting Capacity.`);
        console.error("Available headers (normalized):", data.length > 0 ? Object.keys(data[0]).map(normalizeString) : "No data rows to inspect headers.");
        container.append("p").style("color", "red").text(`Error: Data column "${ALMERACMsHostingCapacityColumnName}" not found.`);
        return;
    }

    // Extract and parse numerical data, filtering out non-numeric values
    const capacities = data.map(d => {
        const value = parseInt(d[foundColumn]);
        return isNaN(value) ? null : value;
    }).filter(d => d !== null);

    if (capacities.length === 0) {
        container.append("p").text("No valid ALMERA CMs Hosting capacity data available to display a histogram.");
        return;
    }

    // Define the bins for the histogram
    // Using d3.histogram for automatic binning, or you can define custom bins
    // This creates bins starting at 0, 50, 70, 90, ..., 190, 200.
    const customThresholds = [
        0, 50, 70, 90, 110, 130, 150, 170, 190, 200
    ];

    const maxCapacity = d3.max(capacities);

    const domainEnd = Math.max(maxCapacity + 1, 200);

    // Determine a reasonable number of bins or step size
    // For counts, often integer bins or small ranges make sense.
    // Let's try bins of size 5, or use d3.thresholdFreedmanDiaconis for more dynamic binning
    const binThresholds = d3.range(0, maxCapacity + 5, 5); // Bins like [0-5), [5-10), etc.

   const histogram = d3.histogram()
        .value(d => d)
        .domain([0, domainEnd]) // Set domain to start at 0 and end high enough
        .thresholds(customThresholds); // Use custom thresholds

    const bins = histogram(capacities);

    // Filter out empty bins if you don't want to show them
    const nonEmptyBins = bins.filter(b => b.length > 0);

    function formatBinLabel(bin) {
        // First bin: <50
        if (bin.x0 === 0 && bin.x1 === 50) return "<50";
        // Final bin: 200+
        if (bin.x0 === 200) return "200+"; 
        // All 20-unit bins (x1 - x0 = 20)
        if (bin.x1 - bin.x0 === 20) return `${bin.x0}-${bin.x1 - 1}`;
        // Fallback (for any unexpected bins, though it shouldn't happen with our thresholds)
        return `[${bin.x0}-${bin.x1 - 1}]`;
    }

    // Set up scales
    const x = d3.scaleBand()
        .domain(nonEmptyBins.map(formatBinLabel))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(nonEmptyBins, d => d.length)]).nice()
        .range([height - margin.bottom, margin.top]);

    const labsThatAnswered = data.filter(d => d[foundColumn] && d[foundColumn].trim() !== "").length;

    // Create SVG element
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; display: block; margin: auto;");

    // Bars
    svg.append("g")
        .attr("fill", "black") // Blue color for bars
        .selectAll("rect")
        .data(nonEmptyBins)
        .join("rect")
        .attr("x", d => x(formatBinLabel(d)))
        .attr("y", d => y(d.length))
        .attr("height", d => y(0) - y(d.length))
        .attr("width", x.bandwidth())
        .append("title") // Tooltip for each bar
        .text(d => `Capacity: ${formatBinLabel(d)} participants\nNumber of Labs: ${d.length}`);
    
    // X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

    // X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 2 + 10) // Adjust position
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Maximum Number of Participants");

    // Y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5)) // Adjust number of ticks
        .call(g => g.select(".domain").remove()); // Remove axis line

    // Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left / 2 - 20) // Adjust position
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Number of Laboratories");

    // Chart Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Distribution of ALMERA CMs Hosting Capacity");

    // Total responses
    svg.append("text")
        .attr("x", margin.left)
        .attr("y", margin.top - 15)
        .attr("text-anchor", "start")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`Total responses: ${labsThatAnswered}`);
}

// Call the function to r the chart when the script loads
renderALMERACMsHostingCapacityHistogram();
