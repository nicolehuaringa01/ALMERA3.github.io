//ALMERA_in_Data/6.Quality_Management_and_Reporting/6.8Uncertainty_Calculations.js


d3.csv("/ALMERA3.github.io/data/Observable2020Survey.csv").then(data => {
    // 1. Uncertainty_and_Characteristic_LimitsCounts (adapted from your Observable code)
    const Uncertainty_and_Characteristic_LimitsCounts = () => {
        const counts = new Map();

        for (const row of data) {
            if (row["6.8 What uncertainty and characteristic limit calculations are used by the lab?"]) {
                const radionuclides = row["6.8 What uncertainty and characteristic limit calculations are used by the lab?"].split(";").map(d => d.trim());
                for (const r of radionuclides) {
                    counts.set(r, (counts.get(r) || 0) + 1);
                }
            }
        }

        return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    };

    // 2. topUncertainty_and_Characteristic_Limits (adapted)
    const topUncertainty_and_Characteristic_Limits = Uncertainty_and_Characteristic_LimitsCounts()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, 7);

    // 3. Uncertainty_and_Characteristic_LimitsToLabsMap (adapted)
    const Uncertainty_and_Characteristic_LimitsToLabsMap = () => {
        const map = new Map();

        for (const row of data) {
            const Uncertainty_and_Characteristic_LimitsRaw = row["6.8Uncertainty_Calculations"];
            const labName = row["1.1 Name of Laboratory"];
            const memberState = row["1.3 Member State"];

            if (!Uncertainty_and_Characteristic_LimitsRaw || !labName || !memberState) continue;

            const Uncertainty_and_Characteristic_Limitss = Uncertainty_and_Characteristic_LimitsRaw.split(";").map(e => e.trim());

            // Count Uncertainty_and_Characteristic_Limits occurrences
            const counts = {};
            for (const Uncertainty_and_Characteristic_Limits of Uncertainty_and_Characteristic_Limitss) {
                if (!counts[Uncertainty_and_Characteristic_Limits]) counts[Uncertainty_and_Characteristic_Limits] = 0;
                counts[Uncertainty_and_Characteristic_Limits]++;
            }

            for (const [Uncertainty_and_Characteristic_Limits, count] of Object.entries(counts)) {
                if (!map.has(Uncertainty_and_Characteristic_Limits)) map.set(Uncertainty_and_Characteristic_Limits, new Map()); // Uncertainty_and_Characteristic_Limits → Map<MemberState, Map<LabName, count>>

                const stateMap = map.get(Uncertainty_and_Characteristic_Limits);

                if (!stateMap.has(memberState)) stateMap.set(memberState, new Map());

                stateMap.get(memberState).set(labName, count);
            }
        }

        return map;
    };

    let selectedUncertainty_and_Characteristic_Limits = null; // Mutable variable in Observable, now a regular variable

    // 4. Uncertainty_and_Characteristic_LimitssPieChart (adapted)
    const createPieChart = () => {
        const width = 928;
        const height = Math.min(width, 500);
// --- Calculate total and percentages for the tooltip ---
    const totalUncertainty_and_Characteristic_LimitssCount = d3.sum(topUncertainty_and_Characteristic_Limits, d => d.value);

    // Add percentage to each Uncertainty_and_Characteristic_Limits object in topUncertainty_and_Characteristic_Limits
    topUncertainty_and_Characteristic_Limits.forEach(d => {
        d.percent = (totalUncertainty_and_Characteristic_LimitssCount > 0) ? (d.value / totalUncertainty_and_Characteristic_LimitssCount) : 0;
    });

    console.log("Processed topUncertainty_and_Characteristic_Limits data with percentages:", topUncertainty_and_Characteristic_Limits);
        const color = d3.scaleOrdinal()
            .domain(topUncertainty_and_Characteristic_Limits.map(d => d.name))
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topUncertainty_and_Characteristic_Limits.length).reverse());

        const pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(width, height) / 2 - 1);

        const arcs = pie(topUncertainty_and_Characteristic_Limits);

        const svg = d3.select("#Uncertainty_and_Characteristic_Limits_Chart-chart-container") // Select the container in the HTML
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height])
            .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; cursor: pointer;");

        svg.append("g")
            .attr("stroke", "white")
            .selectAll()
            .data(arcs)
            .join("path")
            .attr("fill", d => color(d.data.name))
            .attr("d", arc)
            .on("click", (event, d) => {
                selectedUncertainty_and_Characteristic_Limits = d.data.name; // Update the selected Uncertainty_and_Characteristic_Limits
                updateLabInfo(); // Call the function to update the lab info
            })
            .append("title")
            .text(d => `${d.data.name}: ${(d.data.percent * 100).toFixed(1)}% (${d.data.value.toLocaleString("en-US")} labs)`); // MODIFIED HERE

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

    // 5. selectedUncertainty_and_Characteristic_LimitsLabs (adapted)
    const updateLabInfo = () => { // Renamed to updateLabInfo, since it's a function
        const selected = selectedUncertainty_and_Characteristic_Limits;
        const container = d3.select("#lab-info-container");

        container.html(""); // Clear previous content

        if (!selected) {
            container.append("p").html("<em>Nothing to show yet.</em>");
            return;
        }

        const stateMap = Uncertainty_and_Characteristic_LimitsToLabsMap().get(selected);

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
                ul.append("li").text(`${lab} (${count})`);
            });
        });
    };

    // Call the functions to create the visualization
    createPieChart();
    updateLabInfo(); // Initial call to show "Nothing to show yet"
});
