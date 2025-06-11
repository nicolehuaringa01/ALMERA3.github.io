// js/InternationalPT-visualization.js

// Declare variables in a higher scope so they are accessible to all functions
// within this script after data loading.
let allPTData; // Will hold the loaded CSV data
let ptSchemeCountsData;
let topPtSchemeData;
let ptSchemeToLabsMapData;
let selectedPtScheme = null; // Mutable state for the selected PT scheme

// Load the CSV data
d3.csv("observable2020SurveyUpdatedData2025.csv").then(data => {
    allPTData = data; // Store the loaded data globally for this script

    // 1. ptSchemeCounts: Calculate counts of each PT scheme
    ptSchemeCountsData = (() => { // Immediately invoked function to calculate once
        const counts = new Map();
        for (const row of allPTData) {
            // Correct column header for PT schemes
            if (row['If "yes" above, state the name of the PT scheme/s']) {
                const ptSchemes = row['If "yes" above, state the name of the PT scheme/s'].split(";").map(d => d.trim());
                for (const scheme of ptSchemes) {
                    counts.set(scheme, (counts.get(scheme) || 0) + 1);
                }
            }
        }
        return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    })(); // Call the function immediately

    // 2. topPtScheme: Get top 10 PT schemes
    topPtSchemeData = ptSchemeCountsData
        .slice() // Create a copy to avoid mutating the original array
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, 10);

    // 3. ptSchemeToLabsMap: Create map from PT Scheme to Labs
    ptSchemeToLabsMapData = (() => { // Immediately invoked function to calculate once
        const map = new Map();
        for (const row of allPTData) {
            const ptSchemeRaw = row['If "yes" above, state the name of the PT scheme/s'];
            const labName = row["1.1 Name of Laboratory"];
            const memberState = row["1.3 Member State"];

            if (!ptSchemeRaw || !labName || !memberState) continue;

            const ptSchemes = ptSchemeRaw.split(";").map(e => e.trim());

            for (const scheme of ptSchemes) {
                if (!map.has(scheme)) map.set(scheme, new Map()); // scheme → Map<MemberState, Map<LabName, count>>

                const stateMap = map.get(scheme);

                if (!stateMap.has(memberState)) stateMap.set(memberState, new Map());

                // Store lab name and count (if your data truly provides count per lab)
                // Assuming count for lab name per scheme for now, like your original setup
                // If it's just unique labs, you might use a Set<string> instead of Map<string, number>
                // For simplicity, sticking to your original map-of-maps for labs
                stateMap.get(memberState).set(labName, (stateMap.get(memberState).get(labName) || 0) + 1);
            }
        }
        return map;
    })(); // Call the function immediately


    // 4. PtSchemePieChart: Function to create and render the pie chart
    const PtSchemePieChart = () => { // Renamed from RadMethodPieChart for clarity
        const width = 928;
        const height = Math.min(width, 500);

        // Clear previous chart if any
        d3.select("#chart-container").html("");

        const color = d3.scaleOrdinal()
            .domain(topPtSchemeData.map(d => d.name))
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topPtSchemeData.length).reverse());

        const pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(width, height) / 2 - 1);

        const arcs = pie(topPtSchemeData);

        const svg = d3.select("#chart-container")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height])
            .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; cursor: pointer; display: block; margin: auto;");

        svg.append("g")
            .attr("stroke", "white")
            .selectAll("path") // Explicitly select 'path' elements
            .data(arcs)
            .join("path")
            .attr("fill", d => d.data.name === selectedPtScheme ? "#FFD700" : color(d.data.name)) // Highlight selected
            .attr("stroke", d => d.data.name === selectedPtScheme ? "black" : "white") // Add border to selected
            .attr("stroke-width", d => d.data.name === selectedPtScheme ? 2 : 1)
            .attr("d", arc)
            .on("click", (event, d) => {
                selectedPtScheme = d.data.name; // Update the selected PT scheme
                PtSchemePieChart(); // Re-render the chart to apply highlight
                updateLabInfo(); // Call the function to update the lab info
            })
            .append("title")
            .text(d => `${d.data.name}: ${d.data.value.toLocaleString("en-US")}`);

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
    };

    // 5. updateLabInfo: Function to update the display of labs
    const updateLabInfo = () => {
        const selected = selectedPtScheme;
        const container = d3.select("#lab-info-container");

        container.html(""); // Clear previous content

        if (!selected) {
            container.append("p").html("<em>Click on a pie slice to see related labs.</em>");
            return;
        }

        const stateMap = ptSchemeToLabsMapData.get(selected); // Use the pre-calculated map

        if (!stateMap || stateMap.size === 0) {
            container.append("p").html(`No labs found for <strong>${selected}</strong>.`);
            return;
        }

        // Get total number of *distinct* labs across all states
        let totalLabs = 0;
        for (const labsMap of stateMap.values()) {
            totalLabs += labsMap.size;
        }

        // Sort states
        const sortedStates = Array.from(stateMap.keys()).sort(d3.ascending);

        const div = container.append("div");

        div.append("h3").html(`Labs with <strong>${selected}</strong> (${totalLabs} total)`);

        sortedStates.forEach(state => {
            const labsMap = stateMap.get(state);
            const sortedLabs = Array.from(labsMap.entries()).sort((a, b) => d3.ascending(a[0], b[0])); // [labName, count]

            const stateDiv = div.append("div");
            stateDiv.append("h4").text(state);

            const ul = stateDiv.append("ul");
            sortedLabs.forEach(([lab, count]) => {
                ul.append("li").text(`${lab} (Occurrences: ${count})`); // Added "(Occurrences: X)" for clarity
            });
        });
    };

    // Initial calls to render the chart and lab info once data is loaded
    PtSchemePieChart();
    updateLabInfo(); // Show initial message for labs
}).catch(error => {
    console.error("Error loading CSV data for InternationalPT:", error);
    d3.select("#chart-container").append("p").text("Failed to load data for International PT charts.");
    d3.select("#lab-info-container").append("p").text("Data could not be loaded for International PT labs.");
});
