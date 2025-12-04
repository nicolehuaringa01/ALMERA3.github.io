// ALMERA_in_Data/6.Quality_Management_and_Reporting/6.10Calibration_Method_Used_for_Gamma_Spectrometers.js

const csvDataPath10 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv"; // User-provided path

// This function processes the raw data to count Calibration_Method_Used_for_Gamma_Spectrometerss
function getCalibration_Method_Used_for_Gamma_SpectrometersCounts(data, Calibration_Method_Used_for_Gamma_SpectrometersColumn) {
    const counts = new Map();

    for (const row of data) {
        if (row[Calibration_Method_Used_for_Gamma_SpectrometersColumn]) {
            // Split by semicolon as per your Observable notebook's implicit logic
            const Calibration_Method_Used_for_Gamma_Spectrometerss = row[Calibration_Method_Used_for_Gamma_SpectrometersColumn].split(";").map(d => d.trim());
            for (const aff of Calibration_Method_Used_for_Gamma_Spectrometerss) {
                if (aff) { // Ensure Calibration_Method_Used_for_Gamma_Spectrometers string is not empty after trimming
                    counts.set(aff, (counts.get(aff) || 0) + 1);
                }
            }
        }
    }

    let result = [];
    let otherCount = 0;

    for (const [name, value] of counts.entries()) {
        if (value === 1) { // Calibration_Method_Used_for_Gamma_Spectrometerss with only one occurrence go into "Other"
            otherCount += 1;
        } else {
            result.push({ name, value });
        }
    }

    if (otherCount > 0) {
        result.push({ name: "Other", value: otherCount });
    }

    return result;
}

// This function selects the top N Calibration_Method_Used_for_Gamma_Spectrometerss, including "Other" if present
function getTopCalibration_Method_Used_for_Gamma_Spectrometerss(Calibration_Method_Used_for_Gamma_SpectrometersCounts, numTop = 12) {
    let top = Calibration_Method_Used_for_Gamma_SpectrometersCounts
        .slice() // Create a shallow copy to sort without modifying original
        .sort((a, b) => d3.descending(a.value, b.value)) // Sort by value descending
        .slice(0, numTop); // Take the top N

    // Ensure "Other" is included if it's one of the top N or if it exists and wasn't in top N
    const other = Calibration_Method_Used_for_Gamma_SpectrometersCounts.find(d => d.name === "Other");
    if (other && !top.some(d => d.name === "Other")) {
        top.push(other); // Add "Other" if it wasn't already in the top N
        // You might want to re-sort 'top' after adding 'Other' if its position matters
        top.sort((a, b) => d3.descending(a.value, b.value));
    }

    return top;
}


async function initializeCalibration_Method_Used_for_Gamma_SpectrometersChart() {
    const container = document.getElementById("Calibration_Method_Used_for_Gamma_Spectrometers-chart-container");
    if (!container) {
        console.error("Calibration_Method_Used_for_Gamma_Spectrometers chart container element #Calibration_Method_Used_for_Gamma_Spectrometers-chart-container not found.");
        return;
    }

    // Set dimensions for the chart
    const width = 928;
    const height = Math.min(width, 500);

    let rawData;
    try {
        rawData = await d3.csv(csvDataPath10);
        console.log("Calibration_Method_Used_for_Gamma_Spectrometers CSV raw data loaded:", rawData.length, "records");
    } catch (error) {
        console.error("Error loading Calibration_Method_Used_for_Gamma_Spectrometers CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load Calibration_Method_Used_for_Gamma_Spectrometers data. Check console for details (e.g., CSV path).</p>";
        return;
    }

const headers = Object.keys(rawData[0]).map(h => h.trim());
const Calibration_Method_Used_for_Gamma_SpectrometersColumn = headers.find(h =>
    h.includes("6.10") && h.includes("What is the method used for the calibration of gamma spectrometer/s?")
);

if (!Calibration_Method_Used_for_Gamma_SpectrometersColumn) {
    console.error("Available headers:", headers);
    return container.innerHTML = `<p style='color:red'>Missing 6.10 What is the method used for the calibration of gamma spectrometer/s? column.</p>`;
}

    
    const Calibration_Method_Used_for_Gamma_SpectrometersCounts = getCalibration_Method_Used_for_Gamma_SpectrometersCounts(rawData, Calibration_Method_Used_for_Gamma_SpectrometersColumn);
    const topCalibration_Method_Used_for_Gamma_Spectrometers = getTopCalibration_Method_Used_for_Gamma_Spectrometerss(Calibration_Method_Used_for_Gamma_SpectrometersCounts, 6); // Get top 6 Calibration_Method_Used_for_Gamma_Spectrometerss

    if (topCalibration_Method_Used_for_Gamma_Spectrometers.length === 0) {
        console.warn("No valid Calibration_Method_Used_for_Gamma_Spectrometers data found after processing.");
        container.innerHTML = "<p style='text-align: center;'>No Calibration_Method_Used_for_Gamma_Spectrometers data to display after filtering/processing.</p>";
        return;
    }

     // --- Calculate total and percentages for the tooltip ---
    const totalCalibration_Method_Used_for_Gamma_SpectrometerssCount = d3.sum(topCalibration_Method_Used_for_Gamma_Spectrometers, d => d.value);

    // Add percentage to each Calibration_Method_Used_for_Gamma_Spectrometers object in topCalibration_Method_Used_for_Gamma_Spectrometers
    topCalibration_Method_Used_for_Gamma_Spectrometers.forEach(d => {
        d.percent = (totalCalibration_Method_Used_for_Gamma_SpectrometerssCount > 0) ? (d.value / totalCalibration_Method_Used_for_Gamma_SpectrometerssCount) : 0;
    });

    console.log("Processed topCalibration_Method_Used_for_Gamma_Spectrometers data with percentages:", topCalibration_Method_Used_for_Gamma_Spectrometers);

    // --- Chart Rendering Logic ---

    // Create the color scale.
    const color = d3.scaleOrdinal()
        .domain(topCalibration_Method_Used_for_Gamma_Spectrometers.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topCalibration_Method_Used_for_Gamma_Spectrometers.length).reverse());

    // Create the pie layout and arc generator.
    const pie = d3.pie()
        .sort(null) // Do not sort, use the pre-sorted topCalibration_Method_Used_for_Gamma_Spectrometers
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topCalibration_Method_Used_for_Gamma_Spectrometers);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height]) // Center the view
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;"); // General styling

    // Add a Calibration_Method_Used_for_Gamma_Spectrometers path for each value.
    svg.append("g")
        .attr("stroke", "white")
        .selectAll("path")
        .data(arcs)
        .join("path")
            .attr("fill", d => color(d.data.name))
            .attr("d", arc)
        .append("title") // Tooltip on hover
            .text(d => `${d.data.name}: ${(d.data.percent * 100).toFixed(1)}% (${d.data.value.toLocaleString("en-US")} labs)`); // MODIFIED HERE

    // Add a legend.
    const legend = svg.append("g")
        .attr("transform", `translate(${width / 2 - 200}, ${-height / 2 + 20})`) // Position adjusted for clarity
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
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

    // Append the SVG to the designated container
    container.appendChild(svg.node());
    console.log("Calibration_Method_Used_for_Gamma_Spectrometers chart appended to DOM.");

    // Handle responsiveness: redraw on window resize
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = Math.min(newWidth, 500);
        svg.attr("width", newWidth)
           .attr("height", newHeight)
           .attr("viewBox", [-newWidth / 2, -newHeight / 2, newWidth, newHeight]);

        arc.outerRadius(Math.min(newWidth, newHeight) / 2 - 1);
        svg.selectAll("path").attr("d", arc);

        // Reposition legend (optional, could be static)
        legend.attr("transform", `translate(${newWidth / 2 - 200}, ${-newHeight / 2 + 20})`);
    });
}

// Initialize the chart when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeCalibration_Method_Used_for_Gamma_SpectrometersChart);
