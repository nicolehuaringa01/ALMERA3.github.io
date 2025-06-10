// Load the CSV data
d3.csv("observable2020SurveyUpdatedData2025.csv").then(data => {
    // 1. radionuclideCounts (adapted from your Observable code)
  
    const radionuclideCounts = () => {
        const counts = new Map();

        for (const row of data) {
            if (row["EasyRadionuclides"]) {
                const radionuclides = row["EasyRadionuclides"].split(";").map(d => d.trim());
                for (const r of radionuclides) {
                    counts.set(r, (counts.get(r) || 0) + 1);
                }
            }
        }

        return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    };

    // 2. topEquipment (adapted)
    const topRadionuclides = RadionuclideCounts()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, 7);

    // 3. RadionuclideToLabsMap (adapted)
    const RadionuclideToLabsMap = () => {
        const map = new Map();

        for (const row of data) {
            const RadionuclideRaw = row["EasyRadionuclides"];
            const labName = row["1.1 Name of Laboratory"];
            const memberState = row["1.3 Member State"];

            if (!equipmentRaw || !labName || !memberState) continue;

            const equipments = equipmentRaw.split(";").map(e => e.trim());

            // Count equipment occurrences
            const counts = {};
            for (const Radionuclide of Radionuclides) {
                if (!counts[Radionuclide]) counts[Radionuclide] = 0;
                counts[Radionuclide]++;
            }

            for (const [Radionuclide, count] of Object.entries(counts)) {
                if (!map.has(Radionuclide)) map.set(Radionuclide, new Map()); // Radionuclide → Map<MemberState, Map<LabName, count>>

                const stateMap = map.get(Radionuclide);

                if (!stateMap.has(memberState)) stateMap.set(memberState, new Map());

                stateMap.get(memberState).set(labName, count);
            }
        }

        return map;
    };

    let selectedEquipment = null; // Mutable variable in Observable, now a regular variable

    // 4. chartDisplay (adapted)
   chartDisplay = {
  const container = html`<div style="display: flex; flex-wrap: wrap; gap: 20px;"></div>`;

  if (selectedCharts.includes("Bar chart")) {
    const barChart = RadionuclidesBarChart; // Ensure this cell is defined
    container.appendChild(barChart);
  }

  if (selectedCharts.includes("Tree Map")) {
    const treeMap = RadionuclidesTreemap; // Ensure this cell is defined
    container.appendChild(treeMap);
  }

  return container;
}
    // 4.5 selectedCharts
viewof selectedCharts = Inputs.checkbox(["Bar chart", "Tree Map"], {
  label: "Please select charts to display",
  value: ["Bar chart"]// Default selection
})
    // 5. selectedRadionuclideLabs (adapted)
    const updateLabInfo = () => { // Renamed to updateLabInfo, since it's a function
        const selected = selectedRadionuclide;
        const container = d3.select("#lab-info-container");

        container.html(""); // Clear previous content

        if (!selected) {
            container.append("p").html("<em>Nothing to show yet.</em>");
            return;
        }

        const stateMap = RadionuclideToLabsMap().get(selected);

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
