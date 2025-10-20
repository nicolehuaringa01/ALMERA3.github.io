// ALMERA_In_Data/2025/3.Equipment/3.3Equipment_Availability_PILOT

const csvDataPath3 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";
const topojsonPath = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json";

// Globals / state
let allSurveyData_Equipment;
let equipmentCountsData;
let topEquipmentData;
let equipmentToLabsMapData;
let selectedEquipment = null;

// Helper: normalize strings for robust header matching
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').replace(/\u00A0/g, ' ');
}

// --- Parsing equipment entries in the "3.2 Select the equipment available in your laboratory." cell ---
// Split by semicolon, newline, carriage return, and trim.
function extractEquipmentList(cellText) {
    if (!cellText) return [];
    return cellText
        .split(/;|\n|\r/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

// Count each equipment once per lab (presence)
const calculateEquipmentCounts = (equipmentColumnName) => {
    const counts = new Map();

    for (const row of allSurveyData_Equipment) {
        const raw = row[equipmentColumnName];
        if (!raw) continue;

        const equipmentList = extractEquipmentList(raw);
        const unique = new Set(equipmentList.map(normalizeString).filter(Boolean));
        for (const eq of unique) {
            counts.set(eq, (counts.get(eq) || 0) + 1);
        }
    }

    // Convert to array of objects
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
};

// Create map: equipmentName -> Map(memberState -> Set(labName))
const createEquipmentToLabsMap = (equipmentColumnName) => {
    const map = new Map();

    for (const row of allSurveyData_Equipment) {
        const raw = row[equipmentColumnName];
        const labName = row["1.1 Name of Laboratory"];
        const memberState = row["1.3 Member State"];
        if (!raw || !labName || !memberState) continue;

        const equipmentList = extractEquipmentList(raw);
        const unique = new Set(equipmentList.map(normalizeString).filter(Boolean));

        for (const eq of unique) {
            if (!map.has(eq)) map.set(eq, new Map());
            const stateMap = map.get(eq);
            if (!stateMap.has(memberState)) stateMap.set(memberState, new Set());
            stateMap.get(memberState).add(labName);
        }
    }
    return map;
};

// Get top N equipment by labs count
const getTopEquipments = (n = 20) => {
    return equipmentCountsData
        .slice()
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, n);
};

// ----------------- Visualization components (mirror Radionuclides) -----------------

// Bar chart
const EquipmentBarChart = (currentSelectedEquipment, onClickHandler) => {
    const width = 928;
    const height = 500;
    const margin = { top: 40, right: 20, bottom: 120, left: 60 };

    const x = d3.scaleBand()
        .domain(topEquipmentData.map(d => d.name))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(topEquipmentData, d => d.value)]).nice()
        .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
        .domain(topEquipmentData.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topEquipmentData.length).reverse());

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; cursor: pointer; display: block; margin: auto;");

    // Bars
    svg.append("g")
        .selectAll("rect")
        .data(topEquipmentData)
        .join("rect")
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.value))
        .attr("height", d => y(0) - y(d.value))
        .attr("width", x.bandwidth())
        .attr("fill", d => d.name === currentSelectedEquipment ? "#FFD700" : color(d.name))
        .attr("stroke", d => d.name === currentSelectedEquipment ? "black" : "none")
        .attr("stroke-width", d => d.name === currentSelectedEquipment ? 2 : 0)
        .on("click", (event, d) => { onClickHandler(d.name); })
        .append("title")
        .text(d => `${d.name}: ${d.value.toLocaleString("en-US")} labs`);

    // X axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

    // Y axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove());

    // Y label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${margin.left / 2}, ${height / 2}) rotate(-90)`)
        .text("Count of laboratories")
        .attr("font-size", "12px");

    return svg.node();
};

// Treemap
const EquipmentTreemap = (currentSelectedEquipment, onClickHandler) => {
    const width = 928;
    const height = 500;

    const data = {
        name: "Equipments",
        children: topEquipmentData.map(d => ({ name: d.name, value: d.value }))
    };

    const color = d3.scaleOrdinal()
        .domain(topEquipmentData.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateBlues(t * 0.7 + 0.3), topEquipmentData.length).reverse());

    const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    d3.treemap()
        .size([width, height])
        .padding(2)(root);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; display: block; margin: auto;");

    const node = svg.selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    node.append("rect")
        .attr("id", d => d.data.name.replace(/\s/g, '-'))
        .attr("fill", d => d.data.name === currentSelectedEquipment ? "#FFD700" : color(d.data.name))
        .attr("stroke", d => d.data.name === currentSelectedEquipment ? "black" : "none")
        .attr("stroke-width", d => d.data.name === currentSelectedEquipment ? 2 : 0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .on("click", (event, d) => { onClickHandler(d.data.name); })
        .append("title")
        .text(d => `${d.data.name}: ${d.data.value.toLocaleString("en-US")} labs`);

    node.append("text")
        .attr("x", 4)
        .attr("y", 14)
        .text(d => {
            const rectWidth = d.x1 - d.x0;
            if (rectWidth > 30) return d.data.name;
            return "";
        })
        .attr("fill", "white")
        .attr("font-size", "10px")
        .attr("pointer-events", "none");

    return svg.node();
};

// Update map/list for selected equipment (mirrors radionuclides version)
const updateSelectedEquipmentLabs = async () => {
    const chartDisplayContainer = d3.select("#Equipment-chart-display-container");
    chartDisplayContainer.select(".lab-map-content").remove();

    const mapInfoDiv = chartDisplayContainer.append("div")
        .attr("class", "lab-map-content")
        .style("margin-top", "20px")
        .style("padding", "15px")
        .style("border", "1px solid #eee")
        .style("border-radius", "8px")
        .style("background", "#fff")
        .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)");

    if (!selectedEquipment) {
        mapInfoDiv.append("p").html("<em>Click on a chart element (bar or treemap tile) to see related labs on the map.</em>");
        return;
    }

    const stateMap = equipmentToLabsMapData.get(selectedEquipment);
    if (!stateMap || stateMap.size === 0) {
        mapInfoDiv.append("p").html(`No labs found for <strong>${selectedEquipment}</strong>.`);
        return;
    }

    // Find actual CSV header names for coordinates and lab info (robust)
    let foundLongColumn = null;
    let foundLatColumn = null;
    let foundNameColumn = null;
    let foundStateColumn = null;
    let foundCityColumn = null;

    if (allSurveyData_Equipment.length > 0) {
        const headers = Object.keys(allSurveyData_Equipment[0]);
        const normalizedHeaders = headers.map(normalizeString);

        const targetLong = normalizeString("Long");
        const targetLat = normalizeString("Lat");
        const targetName = normalizeString("1.1 Name of Laboratory");
        const targetState = normalizeString("1.3 Member State");
        const targetCity = normalizeString("City");

        for (let i = 0; i < headers.length; i++) {
            if (normalizedHeaders[i] === targetLong) foundLongColumn = headers[i];
            if (normalizedHeaders[i] === targetLat) foundLatColumn = headers[i];
            if (normalizedHeaders[i] === targetName) foundNameColumn = headers[i];
            if (normalizedHeaders[i] === targetState) foundStateColumn = headers[i];
            if (normalizedHeaders[i] === targetCity) foundCityColumn = headers[i];
        }
    }

    if (!foundLongColumn || !foundLatColumn || !foundNameColumn || !foundStateColumn) {
        console.error("Map Error: Missing required columns (Long, Lat, 1.1 Name of Laboratory, 1.3 Member State) in CSV.");
        mapInfoDiv.append("p").html("<span style='color:red;'>Error: Geographic data or lab details missing in CSV. Cannot display map.</span>");
        return;
    }

    // Assemble labs array with coordinates and (for availability) just presence
    const labsForMap = [];
    for (const [memberState, labsSet] of stateMap.entries()) {
        for (const labName of labsSet) {
            const row = allSurveyData_Equipment.find(r =>
                normalizeString(r[foundNameColumn]) === normalizeString(labName) &&
                normalizeString(r[foundStateColumn]) === normalizeString(memberState)
            );

            if (row) {
                const longitude = +row[foundLongColumn];
                const latitude = +row[foundLatColumn];
                const city = row[foundCityColumn];

                if (!isNaN(longitude) && !isNaN(latitude)) {
                    labsForMap.push({
                        name: labName,
                        country: memberState,
                        city: city,
                        longitude: longitude,
                        latitude: latitude
                    });
                } else {
                    console.warn(`Skipping lab ${labName} (${memberState}) due to invalid Long/Lat: ${row[foundLongColumn]}, ${row[foundLatColumn]}`);
                }
            } else {
                console.warn(`Could not find full data row for lab: ${labName} in ${memberState}`);
            }
        }
    }

    if (labsForMap.length === 0) {
        mapInfoDiv.append("p").html(`No labs with valid geographic data found for <strong>${selectedEquipment}</strong>.`);
        return;
    }

    // Map rendering (mirrors radionuclides)
    const width = 900;
    const height = 500;

    let world;
    try {
        world = await d3.json(topojsonPath);
    } catch (error) {
        console.error("Error loading TopoJSON data:", error);
        mapInfoDiv.append("p").html("<span style='color:red;'>Error: Failed to load world map data from CDN. Check network connection or CDN availability.</span>");
        return;
    }

    const land = topojson.feature(world, world.objects.land);
    const projection = d3.geoEquirectangular().fitSize([width, height], land);
    const path = d3.geoPath().projection(projection);

    const svg = d3.create("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("background", "white")
        .style("display", "block");

    const g = svg.append("g");

    g.append("path")
        .datum(land)
        .attr("fill", "#9fc5e8")
        .attr("stroke", "#9fc5e8")
        .attr("d", path);

    // Fixed dot radius as presence indicator (keeps the look of radionuclides map)
    g.selectAll("circle")
        .data(labsForMap)
        .enter()
        .append("circle")
        .attr("cx", d => {
            const p = projection([d.longitude, d.latitude]);
            return p ? p[0] : -1000;
        })
        .attr("cy", d => {
            const p = projection([d.longitude, d.latitude]);
            return p ? p[1] : -1000;
        })
        .attr("r", 4)
        .attr("fill", "#0b5394")
        .attr("stroke", "#0b5394")
        .append("title")
        .text(d => `${d.name} (${d.city ? d.city + ', ' : ''}${d.country})`);

    // Zoom behavior (mirrors)
    svg.call(d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
            // Keep radius visually stable on zoom
            g.selectAll("circle").attr("r", 4 / event.transform.k);
        })
    );

    mapInfoDiv.node().appendChild(svg.node());
};

// Top-level renderer (mirrors radionuclides)
const renderCharts_EquipmentReplica = () => {
    const chartDisplayContainer = d3.select("#Equipment-chart-display-container");
    chartDisplayContainer.html(""); // clear

    // Which charts are selected
    const selectedCharts = Array.from(document.querySelectorAll('#Equipment-chart-selection-container .chart-selector-Equipment'))
        .filter(cb => cb.checked).map(cb => cb.value);

    const clickHandler = (equipmentName) => {
        selectedEquipment = equipmentName;
        // Re-render to apply highlight & update map
        renderCharts_EquipmentReplica();
    };

    if (selectedCharts.includes("Bar chart")) {
        const barSvg = EquipmentBarChart(selectedEquipment, clickHandler);
        chartDisplayContainer.node().appendChild(barSvg);
    }

    if (selectedCharts.includes("Tree Map")) {
        const treeSvg = EquipmentTreemap(selectedEquipment, clickHandler);
        chartDisplayContainer.node().appendChild(treeSvg);
    }

    if (selectedCharts.length === 0) {
        chartDisplayContainer.append("p").text("Please select at least one chart to display.");
    }

    // Always update the map/info area
    updateSelectedEquipmentLabs();
};

// ----------------- Data loading & initialization -----------------
d3.csv(csvDataPath3).then(data => {
    allSurveyData_Equipment = data;

    // Discover equipment column name robustly
    const targetEquipmentColNormalized = normalizeString("3.2 Select the equipment available in your laboratory.");
    let foundEquipmentCol = null;
    if (allSurveyData_Equipment.length > 0) {
        for (const header of Object.keys(allSurveyData_Equipment[0])) {
            if (normalizeString(header) === targetEquipmentColNormalized) {
                foundEquipmentCol = header;
                break;
            }
        }
    }

    if (!foundEquipmentCol) {
        console.error(`Initialization Error: Could not find equipment column "3.2 Select the equipment available in your laboratory."`);
        d3.select("#Equipment-chart-display-container").html("<p style='color:red;'>Failed to initialize charts: Equipment column not found. Check console for details.</p>");
        return;
    }

    equipmentCountsData = calculateEquipmentCounts(foundEquipmentCol);
    topEquipmentData = getTopEquipments(20); // show top 20 by default
    equipmentToLabsMapData = createEquipmentToLabsMap(foundEquipmentCol);

    // Attach checkbox listeners (if they exist)
    document.querySelectorAll('#Equipment-chart-selection-container .chart-selector-Equipment').forEach(cb => {
        cb.addEventListener('change', renderCharts_EquipmentReplica);
    });

    // Initial render
    renderCharts_EquipmentReplica();

}).catch(error => {
    console.error("Error loading CSV for equipment replica:", error);
    d3.select("#Equipment-chart-display-container").html("<p style='color:red;'>Failed to load data. Check CSV path.</p>");
});

