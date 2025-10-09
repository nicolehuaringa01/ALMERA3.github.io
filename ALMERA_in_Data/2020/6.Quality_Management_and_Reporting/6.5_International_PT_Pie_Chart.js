//ALMERA_in_Data/2020/6.Quality_Management_and_Reporting/6.5_International_PT_Pie_Chart.js


d3.csv("/ALMERA3.github.io/data/2020_ALMERA_Capabilities_Survey.csv").then(data => {
    // 1. International_PT_PieCounts (adapted from your Observable code)
    const International_PT_PieCounts = () => {
        const counts = new Map();

        for (const row of data) {
            if (row["If 'yes' above, state the name of the PT scheme/s"]) {
                const radionuclides = row["If 'yes' above, state the name of the PT scheme/s"].split(";").map(d => d.trim());
                for (const r of radionuclides) {
                    counts.set(r, (counts.get(r) || 0) + 1);
                }
            }
        }

        return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    };

    // 2. topInternational_PT_Pie (adapted)
    const topInternational_PT_Pie = International_PT_PieCounts()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, 7);

    // 3. International_PT_PieToLabsMap (adapted)
    const International_PT_PieToLabsMap = () => {
        const map = new Map();

        for (const row of data) {
            const International_PT_PieRaw = row["International_PT_Pie total"];
            const labName = row["1.1 Name of Laboratory"];
            const memberState = row["1.3 Member State"];

            if (!International_PT_PieRaw || !labName || !memberState) continue;

            const International_PT_Pies = International_PT_PieRaw.split(";").map(e => e.trim());

            // Count International_PT_Pie occurrences
            const counts = {};
            for (const International_PT_Pie of International_PT_Pies) {
                if (!counts[International_PT_Pie]) counts[International_PT_Pie] = 0;
                counts[International_PT_Pie]++;
            }

            for (const [International_PT_Pie, count] of Object.entries(counts)) {
                if (!map.has(International_PT_Pie)) map.set(International_PT_Pie, new Map()); // International_PT_Pie → Map<MemberState, Map<LabName, count>>

                const stateMap = map.get(International_PT_Pie);

                if (!stateMap.has(memberState)) stateMap.set(memberState, new Map());

                stateMap.get(memberState).set(labName, count);
            }
        }

        return map;
    };

    let selectedInternational_PT_Pie = null; // Mutable variable in Observable, now a regular variable

    // 4. International_PT_PiesPieChart (adapted)
    const createPieChart = () => {
        const width = 928;
        const height = Math.min(width, 500);
// --- Calculate total and percentages for the tooltip ---
    const totalInternational_PT_PiesCount = d3.sum(topInternational_PT_Pie, d => d.value);

    // Add percentage to each International_PT_Pie object in topInternational_PT_Pie
    topInternational_PT_Pie.forEach(d => {
        d.percent = (totalInternational_PT_PiesCount > 0) ? (d.value / totalInternational_PT_PiesCount) : 0;
    });

    console.log("Processed topInternational_PT_Pie data with percentages:", topInternational_PT_Pie);
        const color = d3.scaleOrdinal()
            .domain(topInternational_PT_Pie.map(d => d.name))
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topInternational_PT_Pie.length).reverse());

        const pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(width, height) / 2 - 1);

        const arcs = pie(topInternational_PT_Pie);

        const svg = d3.select("#International_PT_Pie_Chart-chart-container") // Select the container in the HTML
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
                selectedInternational_PT_Pie = d.data.name; // Update the selected International_PT_Pie
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

    // 5. selectedInternational_PT_PieLabs (adapted)
    const updateLabInfo = () => { // Renamed to updateLabInfo, since it's a function
        const selected = selectedInternational_PT_Pie;
        const container = d3.select("#lab-info-container");

        container.html(""); // Clear previous content

        if (!selected) {
            container.append("p").html("<em>Nothing to show yet.</em>");
            return;
        }

        const stateMap = International_PT_PieToLabsMap().get(selected);

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
