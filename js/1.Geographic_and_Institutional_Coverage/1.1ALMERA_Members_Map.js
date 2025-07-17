const csvDataPath = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // CORRECTED PATH
const landTopojsonPath = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json";

async function initializeALMERAMap() {
    const container = document.getElementById("almera-members-map-container");
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

    let data, land50m;
    try {
        data = await d3.csv(csvDataPath);
        console.log("ALMERA Survey Data loaded:", data.length, "records");

        const worldAtlas = await d3.json(landTopojsonPath);
        land50m = topojson.feature(worldAtlas, worldAtlas.objects.land);
        console.log("Land TopoJSON loaded.");

    } catch (error) {
        console.error("Error loading map data (CSV or TopoJSON):", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load map data. Please check console for details (e.g., CSV path).</p>";
        return;
    }

    const colorScale = d3.scaleOrdinal()
        .domain(["EUROPE", "NORTH AND LATIN AMERICA", "ASIA PACIFIC", "AFRICA", "MIDDLE EAST"])
        .range(["#d10000", "#009d28", "#0083b4", "#9942b2", "#ddb100"]);

    const projection = d3.geoOrthographic()
        .fitSize([width, height], { type: "Sphere" })
        .clipAngle(90); // Only show points on the front hemisphere
    
    const path = d3.geoPath(projection, context);
    
    const tooltip = d3.select("#map-page-tooltip");
    let selectedPoint = null;
    let initialScale = projection.scale();

    // The core rendering logic
    function render() {
        context.clearRect(0, 0, width, height);

        // Draw ocean (sphere outline)
        context.beginPath();
        path({ type: "Sphere" });
        context.fillStyle = "#ffffff";
        context.fill();

        // Draw land
        context.beginPath();
        path(land50m);
        context.fillStyle = "#cccccc";
        context.fill();

        // Filter and project points only if they are on the front side of the globe
        const projectedPoints = data.map(d => {
            const coords = [+d.Long, +d.Lat];
            if (isNaN(coords[0]) || isNaN(coords[1])) return null;

            // Use the D3 projection check to see if the point is visible
            // `path.pointRadius(0)` is a hacky way to check for visibility
            if (!d3.geoPath(projection)(d3.geoCircle().center(coords).radius(0)())) {
                return null;
            }
            
            const projected = projection(coords);
            if (!projected) return null;
            const [x, y] = projected;

            return {
                x,
                y,
                coords, // Keep original coords for rotation logic
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
        
        return clusters; // Return the clusters, not the raw points
    }

    function clusterPoints(points, radius) {
        // Your clustering function remains the same, it's correct
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

    // --- Interaction Logic ---
    let currentRotation = projection.rotate();

    const drag = d3.drag()
        .on("drag", (event) => {
            // Smooth rotation based on drag movement
            const rotate = projection.rotate();
            const sensitivity = 0.75; // Adjusted sensitivity for smoother feel
            projection.rotate([rotate[0] + event.dx * sensitivity, rotate[1] - event.dy * sensitivity, rotate[2]]);
            currentRotation = projection.rotate(); // Keep track of current rotation
            render();
        });

    const zoom = d3.zoom()
        .scaleExtent([initialScale, initialScale * 20]) // Sensible zoom levels
        .on("zoom", (event) => {
            // Correct zoom logic for a globe
            const newScale = event.transform.k * initialScale;
            projection.scale(newScale);
            render();
        });

    d3.select(canvas)
        .call(drag)
        .call(zoom)
        .on("dblclick.zoom", null) // Disable default double-click zoom
        .on("mousemove", event => {
            if (selectedPoint) return;
            const [mouseX, mouseY] = d3.pointer(event);
            const hoveredCluster = findHoveredCluster(mouseX, mouseY);
            if (hoveredCluster) {
                 d3.select(canvas).style("cursor", "pointer"); // UX improvement
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`)
                    .style("display", "block")
                    .html(getTooltipHtml(hoveredCluster));
            } else {
                 d3.select(canvas).style("cursor", "grab"); // UX improvement
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

    // Helper functions for clean code
    function findHoveredCluster(mouseX, mouseY) {
        const renderedClusters = render(); // Re-render to get current cluster positions
        return renderedClusters.find(cluster => {
            const radius = (cluster.points.length > 1) ? 10 : 5;
            const dx = mouseX - cluster.x;
            const dy = mouseY - cluster.y;
            return Math.sqrt(dx * dx + dy * dy) <= radius;
        });
    }

    function getTooltipHtml(cluster) {
        if (cluster.points.length > 1) {
            // Tooltip for a cluster
            return `<strong>${cluster.points.length} Laboratories</strong><br>Click to pin.`;
        } else {
            // Tooltip for a single point
            const point = cluster.points[0];
            return `<strong>${point.info}</strong><br>📍 ${point.city}<br>🌍 ${point.memberState}`;
        }
    }

    // Handle window resizing
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        canvas.width = newWidth;
        projection.fitSize([newWidth, height], { type: "Sphere" });
        initialScale = projection.scale();
        render();
    });

    // Initial render
    render();
}

document.addEventListener("DOMContentLoaded", initializeALMERAMap);
