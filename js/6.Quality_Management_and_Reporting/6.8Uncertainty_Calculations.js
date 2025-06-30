// js/UncertaintyCalculationsPieChart.js

// Declare variables in a higher scope so they are accessible to all functions
// within this script after data loading.
let allUncertaintyData; // Will hold the loaded CSV data
let uncertaintyCountsData;
let topUncertaintyData;
let uncertaintyToLabsMapData; // Placeholder, assuming you might want a map for labs later
let selectedUncertaintyScheme = null; // To track selection for interactivity

// Load the CSV data
d3.csv("/ALMERA3.github.io/data/Observable2020Survey.csv").then(data => {
    allUncertaintyData = data; // Store the loaded data globally for this script

    // 1. UncertaintyCounts: Calculate counts of each uncertainty calculation method
    uncertaintyCountsData = (() => { // Immediately invoked function to calculate once
        const counts = new Map();
        for (const row of allUncertaintyData) {
            const calculationMethodsRaw = row['6.8 What uncertainty and characteristic limit calculations are used by the lab?'];
            if (calculationMethodsRaw) {
                const methods = calculationMethodsRaw.split(";").map(d => d.trim());
                for (const method of methods) {
                    // Filter out empty strings that might result from split
                    if (method) {
                        counts.set(method, (counts.get(method) || 0) + 1);
                    }
                }
            }
        }
        return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    })(); // Call the function immediately

    // 2. topUncertainty: Get top 5 uncertainty methods (as per your original slice(0, 5))
    topUncertaintyData = uncertaintyCountsData
        .slice() // Create a copy so we don't mutate the original
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, 5); // get top 5

    // 3. (Optional) uncertaintyToLabsMapData: If you need to link methods to labs on click
    // This part is similar to your InternationalPT-visualization.js
    uncertaintyToLabsMapData = (() => {
        const map = new Map();
        for (const row of allUncertaintyData) {
            const methodsRaw = row['6.8 What uncertainty and characteristic limit calculations are used by the lab?'];
            const labName = row["1.1 Name of Laboratory"]; // Assuming this column exists
            const memberState = row["1.3 Member State"]; // Assuming this column exists

            if (!methodsRaw || !labName || !memberState) continue;

            const methods = methodsRaw.split(";").map(e => e.trim()).filter(Boolean); // Filter out empty strings

            for (const method of methods) {
                if (!map.has(method)) map.set(method, new Map());
                const stateMap = map.get(method);
                if (!stateMap.has(memberState)) stateMap.set(memberState, new Map());
                stateMap.get(memberState).set(labName, (stateMap.get(memberState).get(labName) || 0) + 1);
            }
        }
        return map;
    })();


    // 4. UncertaintyCalculationsPieChart: Function to create and render the pie chart
    const UncertaintyCalculationsPieChart = () => { // <--- THIS IS THE CRITICAL LINE. It must be `() => {` not `{`
        const width = 928;
        const height = Math.min(width, 500);

        // Clear previous chart if any, and append to the specific container
        d3.select("#Uncertainty_Calculations-chart-container").html(""); // Clear content of div
        const svg = d3.select("#Uncertainty_Calculations-chart-container")
            .append("svg") // Append SVG to the div
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height])
            .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; cursor: pointer; display: block; margin: auto;"); // Center the SVG

        const color = d3.scaleOrdinal()
            .domain(topUncertaintyData.map(d => d.name)) // Use topUncertaintyData
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topUncertaintyData.length).reverse());

        const pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(width, height) / 2 - 1);

        const arcs = pie(topUncertaintyData); // Use topUncertaintyData

        // Draw pie slices
        svg.append("g")
            .attr("stroke", "white")
            .selectAll("path")
            .data(arcs)
            .join("path")
            .attr("fill", d => d.data.name === selectedUncertaintyScheme ? "#FFD700" : color(d.data.name)) // Highlight selected
            .attr("stroke", d => d.data.name === selectedUncertaintyScheme ? "black" : "white") // Add border to selected
            .attr("stroke-width", d => d.data.name === selectedUncertaintyScheme ? 2 : 1)
            .attr("d", arc)
            .on("click", (event, d) => {
                selectedUncertaintyScheme = d.data.name; // Update the selected scheme
                UncertaintyCalculationsPieChart(); // Re-render the chart to apply highlight
                updateLabInfo2(); // Call the function to update the lab info for this chart
            })
            .append("title")
            .text(d => `${d.data.name}: ${d.data.value.toLocaleString("en-US")}`);

        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width / 2 - 200}, ${-height / 2 + 20})`)
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

        return svg.node();
    }; // <--- Function ends here


    // 5. updateLabInfo2: Function to update the display of labs for this specific chart
    const updateLabInfo2 = () => {
        const selected = selectedUncertaintyScheme;
        const container = d3.select("#Uncertainty_Calculations-container"); // Target the correct container

        container.html(""); // Clear previous content

        if (!selected) {
            container.append("p").html("<em>Click on a pie slice to see labs using this calculation.</em>");
            return;
        }

        const stateMap = uncertaintyToLabsMapData.get(selected);

        if (!stateMap || stateMap.size === 0) {
            container.append("p").html(`No labs found for <strong>${selected}</strong>.`);
            return;
        }

        let totalLabs = 0;
        for (const labsMap of stateMap.values()) {
            totalLabs += labsMap.size;
        }

        const sortedStates = Array.from(stateMap.keys()).sort(d3.ascending);

        const div = container.append("div");

        div.append("h3").html(`Labs using <strong>${selected}</strong> (${totalLabs} total)`);

        sortedStates.forEach(state => {
            const labsMap = stateMap.get(state);
            const sortedLabs = Array.from(labsMap.entries()).sort((a, b) => d3.ascending(a[0], b[0]));

            const stateDiv = div.append("div");
            stateDiv.append("h4").text(state);

            const ul = stateDiv.append("ul");
            sortedLabs.forEach(([lab, count]) => {
                ul.append("li").text(`${lab} (Occurrences: ${count})`);
            });
        });
    };

    // Initial calls to render the chart and lab info once data is loaded
    UncertaintyCalculationsPieChart(); // Call the function to draw the chart
    updateLabInfo2(); // Call the function to show initial message for labs

}).catch(error => {
    // Basic error handling for data loading
    console.error("Error loading CSV data for Uncertainty Calculations:", error);
    d3.select("#Uncertainty_Calculations-chart-container").append("p").text("Failed to load data for Uncertainty Calculations chart.");
    d3.select("#Uncertainty_Calculations-container").append("p").text("Data could not be loaded for Uncertainty Calculation labs.");
});
