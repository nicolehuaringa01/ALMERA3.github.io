//js/6.Quality_Management_and_Reporting/6.9Decay_Library.js


d3.csv("/ALMERA3.github.io/data/Observable2020Survey.csv").then(data => {
    // 1. Decay_LibraryCounts (adapted from your Observable code)
    const Decay_LibraryCounts = () => {
        const counts = new Map();

        for (const row of data) {
            if (row["6.9 What decay data library is used?"]) {
                const radionuclides = row["6.9 What decay data library is used?"].split(";").map(d => d.trim());
                for (const r of radionuclides) {
                    counts.set(r, (counts.get(r) || 0) + 1);
                }
            }
        }

        return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    };

    // 2. topDecay_Library (adapted)
    const topDecay_Library = Decay_LibraryCounts()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, 7);

    // 3. Decay_LibraryToLabsMap (adapted)
    const Decay_LibraryToLabsMap = () => {
        const map = new Map();

        for (const row of data) {
            const Decay_LibraryRaw = row["6.9 What decay data library is used?"];
            const labName = row["1.1 Name of Laboratory"];
            const memberState = row["1.3 Member State"];

            if (!Decay_LibraryRaw || !labName || !memberState) continue;

            const Decay_Librarys = Decay_LibraryRaw.split(";").map(e => e.trim());

            // Count Decay_Library occurrences
            const counts = {};
            for (const Decay_Library of Decay_Librarys) {
                if (!counts[Decay_Library]) counts[Decay_Library] = 0;
                counts[Decay_Library]++;
            }

            for (const [Decay_Library, count] of Object.entries(counts)) {
                if (!map.has(Decay_Library)) map.set(Decay_Library, new Map()); // Decay_Library → Map<MemberState, Map<LabName, count>>

                const stateMap = map.get(Decay_Library);

                if (!stateMap.has(memberState)) stateMap.set(memberState, new Map());

                stateMap.get(memberState).set(labName, count);
            }
        }

        return map;
    };

    let selectedDecay_Library = null; // Mutable variable in Observable, now a regular variable

    // 4. Decay_LibrarysPieChart (adapted)
    const createPieChart = () => {
        const width = 928;
        const height = Math.min(width, 500);
// --- Calculate total and percentages for the tooltip ---
    const totalDecay_LibrarysCount = d3.sum(topDecay_Library, d => d.value);

    // Add percentage to each Decay_Library object in topDecay_Library
    topDecay_Library.forEach(d => {
        d.percent = (totalDecay_LibrarysCount > 0) ? (d.value / totalDecay_LibrarysCount) : 0;
    });

    console.log("Processed topDecay_Library data with percentages:", topDecay_Library);
        const color = d3.scaleOrdinal()
            .domain(topDecay_Library.map(d => d.name))
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topDecay_Library.length).reverse());

        const pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(width, height) / 2 - 1);

        const arcs = pie(topDecay_Library);

        const svg = d3.select("#Decay_Library_Chart-chart-container") // Select the container in the HTML
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
                selectedDecay_Library = d.data.name; // Update the selected Decay_Library
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

    // 5. selectedDecay_LibraryLabs (adapted)
    const updateLabInfo = () => { // Renamed to updateLabInfo, since it's a function
        const selected = selectedDecay_Library;
        const container = d3.select("#lab-info-container");

        container.html(""); // Clear previous content

        if (!selected) {
            container.append("p").html("<em>Nothing to show yet.</em>");
            return;
        }

        const stateMap = Decay_LibraryToLabsMap().get(selected);

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
