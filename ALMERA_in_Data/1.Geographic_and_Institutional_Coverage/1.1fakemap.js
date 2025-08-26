const csvDataPath1 = "/ALMERA3.github.io/data/Observable2020Survey.csv";
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

  const projection = d3.geoEqualEarth().fitSize([width, height], ({ type: "Sphere" }));
  const path = d3.geoPath(projection, context);

  const tooltip = d3.select("#map-page-tooltip");

  let selectedPoint = null;

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
        clusters.push({ x: point.x, y: point.y, points: [point] });
      }
    });
    return clusters;
  }

  function render(land) {
    context.clearRect(0, 0, width, height);

    // Draw ocean background
    context.beginPath();
    path({ type: "Sphere" });
    context.fillStyle = "#e6f2ff";
    context.fill();

    // Graticule
    context.beginPath();
    d3.geoPath(projection, context)(d3.geoGraticule10());
    context.strokeStyle = "#e0e0e0";
    context.lineWidth = 0.5;
    context.stroke();

    // Land
    context.beginPath();
    path(land);
    context.fillStyle = "#cccccc";
    context.fill();

    const points = data.map(d => {
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

    const clusters = clusterPoints(points, 15);

    clusters.forEach(cluster => {
      if (cluster.points.length > 1) {
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
        context.font = "bold 10px sans-serif";
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

    return clusters; // return clusters instead of points
  }

  let renderedClusters = render(land50m);

  d3.select(canvas)
    .on("mousemove", event => {
      if (selectedPoint) return;
      const [mouseX, mouseY] = d3.pointer(event);
      const hoveredCluster = renderedClusters.find(c => {
        const radius = (c.points.length > 1) ? 10 : 5;
        const dx = mouseX - c.x;
        const dy = mouseY - c.y;
        return Math.sqrt(dx * dx + dy * dy) <= radius;
      });
      if (hoveredCluster) {
        if (hoveredCluster.points.length === 1) {
          const p = hoveredCluster.points[0];
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
            .html(`<strong>${hoveredCluster.points.length} laboratories</strong>`);
        }
      } else {
        tooltip.style("display", "none");
      }
    })
    .on("mouseout", () => {
      if (!selectedPoint) tooltip.style("display", "none");
    })
    .on("click", event => {
      const [mouseX, mouseY] = d3.pointer(event);
      const clickedCluster = renderedClusters.find(c => {
        const radius = (c.points.length > 1) ? 10 : 5;
        const dx = mouseX - c.x;
        const dy = mouseY - c.y;
        return Math.sqrt(dx * dx + dy * dy) <= radius;
      });
      if (clickedCluster) {
        if (selectedPoint === clickedCluster) {
          selectedPoint = null;
          tooltip.style("display", "none");
        } else {
          selectedPoint = clickedCluster;
          if (clickedCluster.points.length === 1) {
            const p = clickedCluster.points[0];
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
              .html(`<strong>${clickedCluster.points.length} laboratories</strong>`);
          }
        }
      } else {
        selectedPoint = null;
        tooltip.style("display", "none");
      }
    });

  // Zoom/pan using context transforms instead of mutating projection
  const zoom = d3.zoom()
    .scaleExtent([1, 20])
    .on("zoom", (event) => {
      const transform = event.transform;
      context.save();
      context.clearRect(0, 0, width, height);
      context.translate(transform.x, transform.y);
      context.scale(transform.k, transform.k);
      renderedClusters = render(land50m);
      context.restore();
    });

  d3.select(canvas)
    .call(zoom)
    .on("dblclick.zoom", null);

  window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    canvas.width = newWidth;
    projection.fitSize([newWidth, height], { type: "Sphere" });
    renderedClusters = render(land50m);
  });
}

document.addEventListener("DOMContentLoaded", initializeALMERAMap);
