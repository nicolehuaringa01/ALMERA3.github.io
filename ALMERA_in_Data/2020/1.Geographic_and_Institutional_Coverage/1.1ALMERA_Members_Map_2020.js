const csvDataPath1 = "/ALMERA3.github.io/data/2020_ALMERA_Capabilities_Survey.csv";
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
    data = await d3.csv(csvDataPath1);
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

  const projection = d3.geoEqualEarth().fitSize([width, height], { type: "Sphere" });
  const path = d3.geoPath(projection, context);

  const tooltip = d3.select("#map-page-tooltip");
  let selectedPoint = null;
  let zoomTransform = d3.zoomIdentity; // keep track of zoom/pan

  // Convert data to points once
  const basePoints = data.map(d => {
    const coords = [+d.Long, +d.Lat];
    if (isNaN(coords[0]) || isNaN(coords[1])) return null;
    const projected = projection(coords);
    if (!projected) return null;
    const [x, y] = projected;
    return {
      x,
      y,
      color: colorScale(d["1.4 Geographic Region"]?.trim().toUpperCase() || "UNKNOWN"),
      info: d["1.1 Name of Laboratory"] || "Laboratory Name Missing",
      city: d["City"] || "Unknown City",
      memberState: d["1.3 Member State"] || "No Member State"
    };
  }).filter(p => p !== null);

  // Clustering function
  function clusterPoints(points, radius) {
    const clusters = [];
    points.forEach(point => {
      let added = false;
      for (const cluster of clusters) {
        const dx = point.x - cluster.x;
        const dy = point.y - cluster.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) {
          cluster.points.push(point);
          cluster.x = (cluster.x * (cluster.points.length - 1) + point.x) / cluster.points.length;
          cluster.y = (cluster.y * (cluster.points.length - 1) + point.y) / cluster.points.length;
          added = true;
          break;
        }
      }
      if (!added) {
        clusters.push({ x: point.x, y: point.y, points: [point] });
      }
    });
    return clusters;
  }

  function render() {
    context.save();
    context.clearRect(0, 0, width, height);
    context.translate(zoomTransform.x, zoomTransform.y);
    context.scale(zoomTransform.k, zoomTransform.k);

    // Draw graticule
    context.beginPath();
    d3.geoPath(projection, context)(d3.geoGraticule10());
    context.strokeStyle = "#e0e0e0";
    context.lineWidth = 0.5 / zoomTransform.k;
    context.stroke();

    // Land
    context.beginPath();
    path(land50m);
    context.fillStyle = "#cccccc";
    context.fill();

    // Cluster radius shrinks as you zoom in
    const clusterRadius = 15 / zoomTransform.k;
    const clusters = clusterPoints(basePoints, clusterRadius);

    clusters.forEach(cluster => {
      if (cluster.points.length > 1) {
        context.beginPath();
        context.arc(cluster.x, cluster.y, 10 / zoomTransform.k, 0, 2 * Math.PI);
        context.fillStyle = "gray";
        context.fill();
        context.strokeStyle = "white";
        context.lineWidth = 1 / zoomTransform.k;
        context.stroke();

        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = `${10 / zoomTransform.k}px sans-serif`;
        context.fillText(cluster.points.length, cluster.x, cluster.y);
      } else {
        const p = cluster.points[0];
        context.beginPath();
        context.arc(p.x, p.y, 5 / zoomTransform.k, 0, 2 * Math.PI);
        context.fillStyle = p.color;
        context.fill();
        context.strokeStyle = "white";
        context.lineWidth = 0.5 / zoomTransform.k;
        context.stroke();
      }
    });

    context.restore();
    return clusters;
  }

  let renderedClusters = render();

  // Tooltip interaction
d3.select(canvas)
  .on("mousemove", event => {
    if (selectedPoint) return;
    const [mx, my] = d3.pointer(event);
    const inv = zoomTransform.invert([mx, my]);

    const hovered = renderedClusters.find(c => {
      // Visible radius (changes with zoom)
      const visibleRadius = (c.points.length > 1 ? 10 : 5) / zoomTransform.k;
      // Add a fixed padding in screen space (not scaled by zoom)
      const hoverPadding = 6; 
      const dx = inv[0] - c.x;
      const dy = inv[1] - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Scale padding back into map space (so it's consistent regardless of zoom)
      const effectiveRadius = visibleRadius + hoverPadding / zoomTransform.k;

      return dist <= effectiveRadius;
    });

    if (hovered) {
      if (hovered.points.length === 1) {
        const p = hovered.points[0];
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`)
          .style("display", "block")
          .html(`
            <strong>${p.info}</strong><br>
            📍 ${p.city}<br>
            🌍 ${p.memberState}
          `);
      } else {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`)
          .style("display", "block")
          .html(`<strong>${hovered.points.length} laboratories</strong>`);
      }
    } else {
      tooltip.style("display", "none");
    }
  })
  .on("mouseout", () => {
    if (!selectedPoint) tooltip.style("display", "none");
  });

  // Zoom
  const zoom = d3.zoom()
    .scaleExtent([1, 32])
    .on("zoom", (event) => {
      zoomTransform = event.transform;
      renderedClusters = render();
    });

  d3.select(canvas).call(zoom).on("dblclick.zoom", null);

  // Resize
  window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    canvas.width = newWidth;
    projection.fitSize([newWidth, height], { type: "Sphere" });
    renderedClusters = render();
  });
}

document.addEventListener("DOMContentLoaded", initializeALMERAMap);
