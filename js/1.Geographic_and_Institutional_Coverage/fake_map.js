const csvDataPath1000 = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // CORRECTED PATH
// Replace the simple land data with a more detailed Natural Earth TopoJSON
const worldTopojsonPath = "https://cdn.jsdelivr.net/npm/world-atlas@2/world-110m.json";

async function initializeALMERAMap() {
    const container = document.getElementById("almera-members-map-container1");
    if (!container) {
        console.error("Map container element #almera-members-map-container not found.");
        return;
    }

    const width = container.clientWidth;
    const height = 500;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    container.appendChild(canvas);

    const context = canvas.getContext("2d");

    let data, worldTopo;
    try {
        data = await d3.csv(csvDataPath1000);
        console.log("ALMERA Survey Data loaded:", data.length, "records");

        // Fetch the more detailed world topojson
        worldTopo = await d3.json(worldTopojsonPath);
        console.log("World TopoJSON loaded with land and rivers.");

    } catch (error) {
        console.error("Error loading map data (CSV or TopoJSON):", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load map data. Please check console for details (e.g., CSV path).</p>";
        return;
    }

    // --- Map and Data Processing ---
    const colorScale = d3.scaleOrdinal()
        .domain(["EUROPE", "NORTH AND LATIN AMERICA", "ASIA PACIFIC", "AFRICA", "MIDDLE EAST"])
        .range(["#d10000", "#009d28", "#0083b4", "#9942b2", "#ddb100"]);

    const projection = d3.geoOrthographic()
        .fitSize([width, height], { type: "Sphere" })
        .clipAngle(90);

    const path = d3.geoPath(projection, context);

    const tooltip = d3.select("#map-page-tooltip");
    let selectedPoint = null;
    let initialScale = projection.scale();

    // Helper function to get rendered clusters, used by event handlers
    function findHoveredCluster(mouseX, mouseY) {
        // Re-render to get current cluster positions
        const renderedClusters = render();
        return renderedClusters.find(cluster => {
            const radius = (cluster.points.length > 1) ? 10 : 5;
            const dx = mouseX - cluster.x;
            const dy = mouseY - cluster.y;
            return Math.sqrt(dx * dx + dy * dy) <= radius;
        });
    }
    
    function getTooltipHtml(cluster) {
        if (cluster.points.length > 1) {
            return `<strong>${cluster.points.length} Laboratories</strong><br>Click to pin.`;
        } else {
            const point = cluster.points[0];
            return `<strong>${point.info}</strong><br>📍 ${point.city}<br>🌍 ${point.memberState}`;
        }
    }

    // Function to render the map and dots with a terrain effect
    function render() {
        context.clearRect(0, 0, width, height);

        // Draw ocean (sphere outline)
        context.beginPath();
        path({ type: "Sphere" });
        context.fillStyle = "#add8e6"; // A light blue color for water
        context.fill();

        // Get the land and river features from the new data file
        const land = topojson.feature(worldTopo, worldTopo.objects.land);
        const rivers = topojson.feature(worldTopo, worldTopo.objects.rivers);

        // Draw landmasses
        context.beginPath();
        path(land);
        context.fillStyle = "#cccccc"; // Neutral gray land color
        context.fill();

        // Draw rivers on top of the land
        context.beginPath();
        path(rivers);
        context.strokeStyle = "#4682b4"; // A darker blue for rivers
        context.lineWidth = 0.5;
        context.stroke();

        // Prepare points and clusters as before
        const projectedPoints = data.map(d => {
            const coords = [+d.Long, +d.Lat];
            if (isNaN(coords[0]) || isNaN(coords[1])) return null;

            // Check if point is on the visible side of the globe
            if (!d3.geoPath(projection)(d3.geoCircle().center(coords).radius(0)())) {
                return null;
            }

            const projected = projection(coords);
            if (!projected) return null;
            const [x, y] = projected;

            return {
                x, y, coords,
                color: colorScale(d["1.4 Geographic Region"]?.trim().toUpperCase() || "UNKNOWN"),
                info: d["1.1 Name of Laboratory"] || "Laboratory Name Missing",
                city: d["City"] || "Unknown City",
                memberState: d["1.3 Member State"] || "No Member State"
            };
        }).filter(p => p !== null);

        const clusters = clusterPoints(projectedPoints, 15);

        clusters.forEach(cluster => {
            if (cluster.points.length > 1) {
                // Draw a cluster circle
                context.beginPath();
                context.arc(cluster.x, cluster.y, 10, 0, 2 * Math.PI);
                context.fillStyle = "gray";
                context.fill();
                context.strokeStyle = "white";
                context.lineWidth = 1;
                context.stroke();
                context.fillStyle = "white";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.font = "bold 10px Inter, sans-serif";
                context.fillText(cluster.points.length, cluster.x, cluster.y);
            } else {
                const point = cluster.points[0];
                context.beginPath();
                context.arc(point.x, point.y, 5, 0, 2 * Math.PI);
                context.fillStyle = point.color;
                context.fill();
                context.strokeStyle = "white";
                context.lineWidth = 0.5;
                context.stroke();
            }
        });
        
        return clusters;
    }

    // Your clusterPoints function here (unchanged)
    function clusterPoints(points, radius) {
      const clusters = [];
      points.forEach(point => {
        let addedToCluster = false;
        clusters.forEach(cluster => {
          if (isNaN(point.x) || isNaN(point.y) || isNaN(cluster.x) || isNaN(cluster.y)) return;
          const dx = point.x - cluster.x;
          const dy = point.y - cluster.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < radius) {
            cluster.points.push(point);
            cluster.x = (cluster.x * (cluster.points.length - 1) + point.x) / cluster.points.length;
            cluster.y = (cluster.y * (cluster.points.length - 1) + point.y) / cluster.points.length;
            addedToCluster = true;
          }
        });
        if (!addedToCluster) {
          clusters.push({
            x: point.x,
            y: point.y,
            points: [point]
          });
        }
      });
      return clusters;
    }
    
    // Your drag and zoom functions here (from the previous fixed version)
    let currentRotation = projection.rotate();

    const drag = d3.drag()
        .on("drag", (event) => {
            const rotate = projection.rotate();
            const sensitivity = 0.75;
            projection.rotate([rotate[0] + event.dx * sensitivity, rotate[1] - event.dy * sensitivity, rotate[2]]);
            currentRotation = projection.rotate();
            render();
        });

    const zoom = d3.zoom()
        .scaleExtent([initialScale, initialScale * 20])
        .on("zoom", (event) => {
            const newScale = event.transform.k * initialScale;
            projection.scale(newScale);
            render();
        });

    d3.select(canvas)
        .call(drag)
        .call(zoom)
        .on("dblclick.zoom", null)
        .on("mousemove", event => {
            if (selectedPoint) return;
            const [mouseX, mouseY] = d3.pointer(event);
            const hoveredCluster = findHoveredCluster(mouseX, mouseY);
            if (hoveredCluster) {
                d3.select(canvas).style("cursor", "pointer");
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`)
                    .style("display", "block")
                    .html(getTooltipHtml(hoveredCluster));
            } else {
                d3.select(canvas).style("cursor", "grab");
                tooltip.style("display", "none");
            }
        })
        .on("click", event => {
            const [mouseX, mouseY] = d3.pointer(event);
            const clickedCluster = findHoveredCluster(mouseX, mouseY);
            if (clickedCluster) {
                if (selectedPoint === clickedCluster) {
                    selectedPoint = null;
                    tooltip.style("display", "none");
                } else {
                    selectedPoint = clickedCluster;
                    tooltip
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY + 10}px`)
                        .style("display", "block")
                        .html(getTooltipHtml(clickedCluster));
                }
            } else {
                selectedPoint = null;
                tooltip.style("display", "none");
            }
        });

    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        canvas.width = newWidth;
        projection.fitSize([newWidth, height], { type: "Sphere" });
        initialScale = projection.scale();
        render();
    });

    render();
}

document.addEventListener("DOMContentLoaded", initializeALMERAMap);
