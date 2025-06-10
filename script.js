// Load the CSV data
d3.csv("observable2020SurveyUpdatedData2025.csv").then(data => {
    // 1. EquipmentCounts (adapted from your Observable code)
    const equipmentCounts = () => {
        const counts = new Map();

        for (const row of data) {
            if (row["Equipment total"]) {
                const radionuclides = row["Equipment total"].split(";").map(d => d.trim());
                for (const r of radionuclides) {
                    counts.set(r, (counts.get(r) || 0) + 1);
                }
            }
        }

        return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    };

    // 2. topEquipment (adapted)
    const topEquipment = equipmentCounts()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, 7);

    // 3. equipmentToLabsMap (adapted)
    const equipmentToLabsMap = () => {
        const map = new Map();

        for (const row of data) {
            const equipmentRaw = row["Equipment total"];
            const labName = row["1.1 Name of Laboratory"];
            const memberState = row["1.3 Member State"];

            if (!equipmentRaw || !labName || !memberState) continue;

            const equipments = equipmentRaw.split(";").map(e => e.trim());

            // Count equipment occurrences
            const counts = {};
            for (const equipment of equipments) {
                if (!counts[equipment]) counts[equipment] = 0;
                counts[equipment]++;
            }

            for (const [equipment, count] of Object.entries(counts)) {
                if (!map.has(equipment)) map.set(equipment, new Map()); // equipment → Map<MemberState, Map<LabName, count>>

                const stateMap = map.get(equipment);

                if (!stateMap.has(memberState)) stateMap.set(memberState, new Map());

                stateMap.get(memberState).set(labName, count);
            }
        }

        return map;
    };

    let selectedEquipment = null; // Mutable variable in Observable, now a regular variable

    // 4. EquipmentsPieChart (adapted)
    const createPieChart = () => {
        const width = 928;
        const height = Math.min(width, 500);

        const color = d3.scaleOrdinal()
            .domain(topEquipment.map(d => d.name))
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topEquipment.length).reverse());

        const pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(width, height) / 2 - 1);

        const arcs = pie(topEquipment);

        const svg = d3.select("#chart-container") // Select the container in the HTML
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
                selectedEquipment = d.data.name; // Update the selected equipment
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

    // 5. selectedEquipmentLabs (adapted)
    const updateLabInfo = () => { // Renamed to updateLabInfo, since it's a function
        const selected = selectedEquipment;
        const container = d3.select("#lab-info-container");

        container.html(""); // Clear previous content

        if (!selected) {
            container.append("p").html("<em>Nothing to show yet.</em>");
            return;
        }

        const stateMap = equipmentToLabsMap().get(selected);

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
