
const csvDataPath = "/ALMERA3.github.io/data/Observable2020Survey.csv"; // CORRECTED PATH
const landTopojsonPath = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json";

async function initializeALMERAMap() {
  const container = document.getElementById("almera-members-map-container");
  if (!container) {
    console.error("Map container element #almera-members-map-container not found.");
    return;
  }

  // Get current width of the container for responsiveness
  const width = container.clientWidth;
  const height = 500; // Fixed height as per Observable notebook

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);

  const context = canvas.getContext("2d");

  // Fetch data concurrently
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

  // --- Map and Data Processing ---
  const colorScale = d3.scaleOrdinal()
    .domain(["EUROPE", "NORTH AND LATIN AMERICA", "ASIA PACIFIC", "AFRICA", "MIDDLE EAST"])
    .range(["#d10000", "#009d28", "#0083b4", "#9942b2", "#ddb100"]);

  const projection = d3.geoEqualEarth().fitSize([width, height], ({ type: "Sphere" }));
  const path = d3.geoPath(projection, context);

  // Tooltip element (created globally in HTML for easier positioning relative to body)
  const tooltip = d3.select("#map-page-tooltip"); // Use the ID created in HTML

  let selectedPoint = null; // To "pin" tooltip on click

  // Clustering function (from  notebook)
  function clusterPoints(points, radius) {
    const clusters = [];

    points.forEach(point => {
      let addedToCluster = false;

      clusters.forEach(cluster => {
        // Ensure point.x and point.y are valid numbers before calculation
        if (isNaN(point.x) || isNaN(point.y) || isNaN(cluster.x) || isNaN(cluster.y)) {
            return; // Skip if coordinates are invalid
        }
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

  // Function to render the map and dots
  function render(land) {
    context.clearRect(0, 0, width, height); // Clear full canvas

    // Draw ocean
    context.beginPath();
    path({ type: "Sphere" });
    context.fillStyle = "#ffffff"; // Ocean color
    context.fill();

    // Draw land
    context.beginPath();
    path(land);
    context.fillStyle = "#cccccc"; // Land color
    context.fill();

    // Prepare points with projected coordinates and necessary info
    const points = data.map(d => {
      // Ensure Long and Lat are numbers, and handle cases where projection might return null
      const coords = [+d.Long, +d.Lat];
      if (isNaN(coords[0]) || isNaN(coords[1])) {
          console.warn("Invalid coordinates for data point:", d);
          return null; // Skip invalid points
      }
      const projected = projection(coords);
      if (!projected) {
          console.warn("Could not project coordinates for data point:", d);
          return null; // Skip if projection fails
      }
      const [x, y] = projected;

      return {
        x,
        y,
        color: colorScale(d["1.4 Geographic Region"]?.trim().toUpperCase() || "UNKNOWN"),
        info: d["1.1 Name of Laboratory"] || "Laboratory Name Missing",
        city: d["City"] || "Unknown City",
        memberState: d["1.3 Member State"] || "No Member State"
      };
    }).filter(p => p !== null); // Remove null points (invalid coordinates)

    // Cluster points to avoid overlap
    const clusters = clusterPoints(points, 15); // 15px radius for clustering

    clusters.forEach(cluster => {
      if (cluster.points.length > 1) {
        // Draw a cluster circle
        context.beginPath();
        context.arc(cluster.x, cluster.y, 10, 0, 2 * Math.PI);
        context.fillStyle = "gray"; // Cluster color
        context.fill();
        context.strokeStyle = "white"; // Cluster border
        context.lineWidth = 1;
        context.stroke();

        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "bold 10px Inter, sans-serif"; // Font for cluster count
        context.fillText(cluster.points.length, cluster.x, cluster.y);
      } else {
        const point = cluster.points[0];
        context.beginPath();
        context.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        context.fillStyle = point.color;
        context.fill();
        context.strokeStyle = "white"; // Dot border
        context.lineWidth = 0.5;
        context.stroke();
      }
    });

    return points; // Return rendered points for event handling
  }

  // Initial render
  let renderedPoints = render(land50m);

  // --- Event Handlers (Mousemove and Click for Tooltip) ---
  d3.select(canvas)
    .on("mousemove", event => {
      if (selectedPoint) return; // If a point is clicked, keep its tooltip
      const [mouseX, mouseY] = d3.pointer(event);
      const hoveredPoint = renderedPoints.find(point => {
        // Consider both individual dots and clusters for hover
        const radius = (point.points && point.points.length > 1) ? 10 : 5; // Radius for individual dot vs cluster
        const dx = mouseX - point.x;
        const dy = mouseY - point.y;
        return Math.sqrt(dx * dx + dy * dy) <= radius;
      });

      if (hoveredPoint) {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`)
          .style("display", "block")
          .html(`
            <strong>${hoveredPoint.info}</strong><br>
            📍 ${hoveredPoint.city}<br>
            🌍 ${hoveredPoint.memberState}
          `);
      } else {
        tooltip.style("display", "none");
      }
    })
    .on("mouseout", () => {
      if (!selectedPoint) { // Hide only if no point is selected (clicked)
        tooltip.style("display", "none");
      }
    })
    .on("click", event => {
      const [mouseX, mouseY] = d3.pointer(event);
      const clickedPoint = renderedPoints.find(point => {
        const radius = (point.points && point.points.length > 1) ? 10 : 5;
        const dx = mouseX - point.x;
        const dy = mouseY - point.y;
        return Math.sqrt(dx * dx + dy * dy) <= radius;
      });

      if (clickedPoint) {
        if (selectedPoint === clickedPoint) { // If clicking the same point, deselect
          selectedPoint = null;
          tooltip.style("display", "none");
        } else { // Select new point
          selectedPoint = clickedPoint;
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`)
            .style("display", "block")
            .html(`
              <strong>${clickedPoint.info}</strong><br>
              📍 ${clickedPoint.city}<br>
              🌍 ${clickedPoint.memberState}
            `);
        }
      } else { // Clicked outside any point, deselect
        selectedPoint = null;
        tooltip.style("display", "none");
      }
    });


  // --- Zoom Functionality ---
  const zoom = d3.zoom()
    .scaleExtent([1, 5000]) // Adjust max zoom level
    .on("zoom", (event) => {
      const { transform } = event;
      // Update projection's translate and scale based on zoom transform
      projection.scale(transform.k * (width / (2 * Math.PI)))
                .translate([transform.x, transform.y]);
      renderedPoints = render(land50m); // Re-render points on zoom
    });

  d3.select(canvas)
    .call(zoom)
    .on("dblclick.zoom", null); // Disable default double-click zoom behavior

  // Handle window resizing to make the map responsive
  window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    canvas.width = newWidth;
    // Recalculate projection fit based on new width
    projection.fitSize([newWidth, height], { type: "Sphere" });
    renderedPoints = render(land50m); // Re-render the map and points
  });
}

// Initialize the map when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeALMERAMap);
