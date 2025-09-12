// ALMERA_in_Data/3.Equipment/3.3Equipment_Availability.js

// Global variables to store processed data and selected state
let allSurveyData; // Will hold the loaded CSV data
let equipmentCountsData;
let topEquipmentData;
let equipmentToLabsMapData;
let selectedEquipment = null; // Emulates Observable's mutable state for selected equipment
let currentView = 'map'; // 'map' or 'list' - default view

// GLOBAL: Map of column names to a clean equipment name
const equipmentColumns = {
    "3.2 Number of Systems": "Gross Alpha Counters",
    "3.3 Number of Systems": "Gross beta counters",
    "3.4 Number of Systems": "Gamma-ray spectrometry system",
    "3.5 Number of Systems": "Alpha spectrometry system",
    "3.6 Number of Systems": "Liquid scintillation counter",
    "3.7 Number of Systems": "Mass spectrometry",
    "3.8 Number of Systems": "Other equipment"
};

// Helper function to normalize strings for comparison (remove extra spaces, non-breaking spaces)
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').replace(/\u00A0/g, ' ');
}

/**
 * Calculates the count of each equipment from the new multi-column data format.
 * @returns {Array<Object>} An array of objects, { name: string, value: number }.
 */
const calculateEquipmentCounts = () => {
    const counts = new Map();
    for (const row of allSurveyData) {
        for (const [column, name] of Object.entries(equipmentColumns)) {
            const value = parseInt(row[column]);
            if (!isNaN(value) && value > 0) {
                counts.set(name, (counts.get(name) || 0) + value);
            }
        }
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
};
/**
 * Creates a map from Equipment to a nested map of MemberState to LabName to Count,
 * from the new multi-column data format.
 * @returns {Map<string, Map<string, Map<string, number>>>} The mapping.
 */
const createEquipmentToLabsMap = () => {
    // Map: EquipmentName -> Map<MemberState, Map<LabName, count>>
    const map = new Map();

    for (const row of allSurveyData) {
        const labName = row["1.1 Name of Laboratory"];
        const memberState = row["1.3 Member State"];

        if (!labName || !memberState) continue;

        for (const [column, name] of Object.entries(equipmentColumns)) {
            const value = parseInt(row[column]);
            if (!isNaN(value) && value > 0) {
                if (!map.has(name)) {
                    map.set(name, new Map());
                }
                const stateMap = map.get(name);

                if (!stateMap.has(memberState)) {
                    stateMap.set(memberState, new Map());
                }
                stateMap.get(memberState).set(labName, value);
            }
        }
    }
    return map;
};

/**
 * Gets the top N most frequently measured equipments.
 * @param {number} n - The number of top equipments to retrieve.
 * @returns {Array<Object>} Sorted array of top equipments.
 */
const getTopEquipments = (n = 7) => { // Default to 7 for pie chart, can be adjusted
    return equipmentCountsData
        .slice() // Create a copy to avoid mutating the original array
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, n);
};

/**
 * Creates the Equipments Pie Chart.
 * @param {Function} onClickHandler - Callback function for slice clicks.
 * @returns {SVGElement} The D3 SVG node for the pie chart.
 */
const createPieChart = (onClickHandler) => {
    const width = 928;
    const height = Math.min(width, 500);

    const totalEquipmentsCount = d3.sum(topEquipmentData, d => d.value);

    // --- THIS IS THE FIX ---
    // Count labs that answered at least one of the equipment columns
    const labsThatAnswered = allSurveyData.filter(d => {
        for (const col of Object.keys(equipmentColumns)) {
            if (d[col] && d[col].trim() !== "" && parseInt(d[col]) > 0) {
                return true;
            }
        }
        return false;
    }).length;

    topEquipmentData.forEach(d => {
        d.percent = (totalEquipmentsCount > 0) ? (d.value / totalEquipmentsCount) : 0;
    });

    const color = d3.scaleOrdinal()
        .domain(topEquipmentData.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), topEquipmentData.length).reverse());

    const pie = d3.pie()
        .sort(null)
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const arcs = pie(topEquipmentData);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; cursor: pointer; display: block; margin: auto;");

    svg.append("g")
        .attr("stroke", "white")
        .selectAll()
        .data(arcs)
        .join("path")
        .attr("fill", d => color(d.data.name))
        .attr("d", arc)
        .on("click", (event, d) => {
            onClickHandler(d.data.name);
        })
        .append("title")
        .text(d => `${d.data.name}: ${(d.data.percent * 100).toFixed(1)}% (${d.data.value.toLocaleString("en-US")} systems)`);

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

    svg.append("text")
        .attr("x", -width / 2 + 10)
        .attr("y", -height / 2 + 20)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(`Total responses: ${totalEquipmentsCount.toLocaleString("en-US")}`);

    svg.append("text")
        .attr("x", -width / 2 + 10)
        .attr("y", -height / 2 + 40)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .text(`Total laboratories that answered: ${labsThatAnswered.toLocaleString("en-US")}`);

    return svg.node();
};

/**
 * Renders the list view for selected equipment, grouped by Member State.
 */
const renderListView = () => {
    const container = d3.select("#lab-info-display-container");
    container.html("");

    if (!selectedEquipment) {
        container.append("p").html("<em>Click on a pie chart slice to see related labs in a list.</em>");
        return;
    }

    const stateMap = equipmentToLabsMapData.get(selectedEquipment);

    if (!stateMap || stateMap.size === 0) {
        container.append("p").html(`No labs found for <strong>${selectedEquipment}</strong>.`);
        return;
    }

    let totalLabs = 0;
    for (const labsMap of stateMap.values()) {
        totalLabs += labsMap.size;
    }

    const mainDiv = container.append("div");

    mainDiv.append("h3").html(`Labs with <strong>${selectedEquipment}</strong> (${totalLabs} total)`);

    const sortedStates = Array.from(stateMap.keys()).sort((a, b) => a.localeCompare(b));

    sortedStates.forEach(state => {
        const labsMap = stateMap.get(state);
        const sortedLabs = Array.from(labsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

        const stateDiv = mainDiv.append("div");
        stateDiv.append("h4").text(state);

        const ul = stateDiv.append("ul").style("list-style", "none").style("padding-left", "20px");
        sortedLabs.forEach(([lab, count]) => {
            ul.append("li").html(`${lab} (<strong style='font-weight: bold;'>${count}</strong>)`);
        });
    });
};


/**
 * Updates the map display of labs based on the selected equipment.
 */
async function renderMapView() {
    const container = d3.select("#lab-info-display-container");
    container.html("");

    if (!selectedEquipment) {
        container.append("p").html("<em>Click on a pie chart slice to see related labs on the map.</em>");
        return;
    }

    const stateMap = equipmentToLabsMapData.get(selectedEquipment);

    if (!stateMap || stateMap.size === 0) {
        container.append("p").html(`No labs found for <strong>${selectedEquipment}</strong>.`);
        return;
    }

    let foundLongColumn = null;
    let foundLatColumn = null;
    let foundNameColumn = null;
    let foundStateColumn = null;
    let foundCityColumn = null;

    if (allSurveyData.length > 0) {
        const headers = Object.keys(allSurveyData[0]);
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

    if (!foundLongColumn || !foundLatColumn || !foundNameColumn || !foundStateColumn || !foundCityColumn) {
        console.error("Map Error: Missing required columns (Long, Lat, 1.1 Name of Laboratory, 1.3 Member State, City) in CSV.");
        container.append("p").html("<span style='color:red;'>Error: Geographic data or lab details missing in CSV. Cannot display map.</span>");
        return;
    }

    const labsForMap = [];
    for (const [memberState, labsMap] of stateMap.entries()) {
        for (const [labName, count] of labsMap.entries()) {
            const row = allSurveyData.find(r =>
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
                        latitude: latitude,
                        equipmentCount: count
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
        container.append("p").html(`No labs with valid geographic data found for <strong>${selectedEquipment}</strong>.`);
        return;
    }

    // --- Map Rendering Logic ---
    const width = container.node().clientWidth;
    const height = 500;
    const topojsonPath = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json";

    let world;
    try {
        world = await d3.json(topojsonPath);
    } catch (error) {
        console.error("Error loading TopoJSON data:", error);
        container.append("p").html("<span style='color:red;'>Error: Failed to load world map data from CDN. Check network connection or CDN availability.</span>");
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

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "8px")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "white")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    let pinnedCircle = null;

    g.selectAll("circle")
    .data(labsForMap)
    .join("circle")
    // Use a function to set the initial radius based on the initial zoom level
    .attr("r", d => 3 / d3.zoomTransform(svg.node()).k)
    .attr("cx", d => {
        const projected = projection([d.longitude, d.latitude]);
        return projected ? projected[0] : -1000;
    })
    .attr("cy", d => {
        const projected = projection([d.longitude, d.latitude]);
        return projected ? projected[1] : -1000;
    })
    .attr("fill", "#0b5394")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
        if (pinnedCircle && pinnedCircle.datum() === d) return;
        d3.select(this)
            .transition()
            .duration(200)
            .attr("r", 5 / d3.zoomTransform(svg.node()).k); // Scale the radius based on zoom
        tooltip.style("opacity", 1)
            .html(`<strong>${d.name}</strong><br>${d.city ? d.city + ', ' : ''}${d.country}<br><strong>${selectedEquipment}:</strong> ${d.equipmentCount}`);
    })
    .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 15) + "px");
    })
    .on("mouseout", function(event, d) {
        if (pinnedCircle && pinnedCircle.datum() === d) return;
        d3.select(this)
            .transition()
            .duration(200)
            .attr("r", 3 / d3.zoomTransform(svg.node()).k); // Scale the radius back to the base size
        tooltip.style("opacity", 0);
    })
    .on("click", function(event, d) {
        event.stopPropagation();
        const currentZoom = d3.zoomTransform(svg.node()).k;
        if (pinnedCircle && pinnedCircle.datum() === d) {
            pinnedCircle.classed("pinned", false).attr("r", 3 / currentZoom);
            pinnedCircle = null;
            tooltip.style("opacity", 0);
        } else {
            if (pinnedCircle) {
                pinnedCircle.classed("pinned", false).attr("r", 3 / currentZoom);
            }
            pinnedCircle = d3.select(this);
            pinnedCircle.classed("pinned", true).attr("r", 5 / currentZoom);
            tooltip.style("opacity", 1)
                .html(`<strong>${d.name}</strong><br>${d.city ? d.city + ', ' : ''}${d.country}<br><strong>${selectedEquipment}:</strong> ${d.equipmentCount}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 15) + "px");
        }
    });

    svg.on("click", () => {
        if (pinnedCircle) {
            pinnedCircle.classed("pinned", false).attr("r", 3);
            pinnedCircle = null;
            tooltip.style("opacity", 0);
        }
    });

    svg.call(d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
            g.selectAll("circle").attr("r", 3 / event.transform.k);
        })
    );

    container.node().appendChild(svg.node());
}
/**
 * Updates the display based on the current view selection.
 */
const updateLabInfoDisplay = () => {
    if (currentView === 'map') {
        renderMapView();
    } else {
        renderListView();
    }
};

// --- Data Loading and Initialization ---
d3.csv("/ALMERA3.github.io/data/2020_ALMERA_Capabilities_Survey.csv").then(data => {
    allSurveyData = data;

    equipmentCountsData = calculateEquipmentCounts();
    topEquipmentData = getTopEquipments(7);
    equipmentToLabsMapData = createEquipmentToLabsMap();

    const pieChartClickHandler = (equipmentName) => {
        selectedEquipment = equipmentName;
        updateLabInfoDisplay();
    };

    const pieChartSvg = createPieChart(pieChartClickHandler);
    d3.select("#chart-container").node().appendChild(pieChartSvg);

    d3.select("#view-toggle").on("change", function() {
        currentView = this.checked ? 'list' : 'map';
        updateLabInfoDisplay();
    });

    updateLabInfoDisplay();

}).catch(error => {
    console.error("Error loading CSV data:", error);
    d3.select("#chart-container").html("<p style='color: red;'>Failed to load data. Please check the CSV file path and content.</p>");
    d3.select("#lab-info-display-container").html("<p style='color: red;'>Failed to load map/list data.</p>");
});
