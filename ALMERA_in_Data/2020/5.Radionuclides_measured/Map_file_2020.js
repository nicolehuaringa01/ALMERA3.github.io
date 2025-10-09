// ALMERA3.github.io/ALMERA_in_Data/2020/5.Radionuclides_measured/Map_file_2020.js

// Config
const width = 900;
const height = 450;
const sphere = { type: "Sphere" };

// Canvas + context
const canvas = d3.select("#map-canvas")
  .attr("width", width)
  .attr("height", height)
  .node();

const context = canvas.getContext("2d");

// Tooltip
const tooltip = d3.select("#tooltip");

// Search bar
const searchBar = d3.select("#search-bar");

// Projection + path
const projection = d3.geoEqualEarth().fitSize([width, height], sphere);
const path = d3.geoPath(projection, context);

// Color scale
const colorScale = d3.scaleOrdinal()
  .domain(["EUROPE", "NORTH AND LATIN AMERICA", "ASIA PACIFIC", "AFRICA", "MIDDLE EAST"])
  .range(["red", "blue", "green", "orange", "purple"]);

// Track selected point
let selectedPoint = null;

// Data containers
let data = [];
let filteredData = [];
let points = [];

// --- Clustering function ---
function clusterPoints(points, radius) {
  const clusters = [];
  points.forEach(point => {
    let added = false;
    for (const cluster of clusters) {
      const dx = point.x - cluster.x;
      const dy = point.y - cluster.y;
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
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

// --- Render function ---
function render(land) {
  context.clearRect(0, 0, width, height);

  // Background sphere
  context.beginPath();
  path(sphere);
  context.fillStyle = "#fff";
  context.fill();

  // Land
  context.beginPath();
  path(land);
  context.fillStyle = "#66a5d2";
  context.fill();

  // Points
  const pts = filteredData.map(d => {
    const [x, y] = projection([+d.Long, +d.Lat]) || [];
    return {
      x, y,
      color: colorScale(d["Geographic Region"] || "black"),
      info: d["Laboratory Name"] || "Laboratory Missing",
      city: d["City"] || "Unknown City",
      memberState: d["Member State"] || "No member state",
      contact: d["Contact Person"] || "No contact available",
      telephone: d["Telephone"] || "No telephone available",
      email: d["Email"] || "No email available",
      address: d["Physical Address"] || "No address available",
      update: d["Latest Update"] || "Unknown update",
      radionuclides: d["Radionuclides"] || "No info on file"
    };
  });

  const clusters = clusterPoints(pts, 15);

  clusters.forEach(cluster => {
    if (cluster.points.length > 1) {
      // Cluster circle
      context.beginPath();
      context.arc(cluster.x, cluster.y, 10, 0, 2 * Math.PI);
      context.fillStyle = "gray";
      context.fill();
      context.fillStyle = "white";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = "12px Arial";
      context.fillText(cluster.points.length, cluster.x, cluster.y);
    } else {
      const point = cluster.points[0];
      context.beginPath();
      context.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      context.fillStyle = point.color;
      context.fill();
    }
  });

  return pts;
}

// --- Event listeners ---
d3.select(canvas)
  .on("mousemove", event => {
    if (selectedPoint) return;
    const [mouseX, mouseY] = d3.pointer(event);
    const hovered = points.find(p => {
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      return Math.sqrt(dx * dx + dy * dy) <= 5;
    });
    if (hovered) {
      tooltip
        .style("left", `${event.offsetX + 15}px`)
        .style("top", `${event.offsetY - 20}px`)
        .style("display", "block")
        .html(`
          <strong>${hovered.info}</strong><br>
          🏢 ${hovered.address}<br>
          📍 ${hovered.city}<br>
          🌍 ${hovered.memberState}<br>
          🧑‍💼 ${hovered.contact}<br>
          📧 ${hovered.email}<br>
          📞 ${hovered.telephone}<br>
          🔄 ${new Date(hovered.update).toLocaleDateString()}<br>
        `);
    } else {
      tooltip.style("display", "none");
    }
  })
  .on("click", event => {
    const [mouseX, mouseY] = d3.pointer(event);
    const clicked = points.find(p => {
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      return Math.sqrt(dx * dx + dy * dy) <= 5;
    });
    if (clicked) {
      selectedPoint = clicked;
      tooltip
        .style("left", `${event.offsetX + 15}px`)
        .style("top", `${event.offsetY - 20}px`)
        .style("display", "block")
        .html(`
          <strong>${clicked.info}</strong><br>
          🏢 ${clicked.address}<br>
          📍 ${clicked.city}<br>
          🌍 ${clicked.memberState}<br>
          🧑‍💼 ${clicked.contact}<br>
          📧 ${clicked.email}<br>
          📞 ${clicked.telephone}<br>
          🔄 ${new Date(clicked.update).toLocaleDateString()}<br>
          Radionuclides:<br> ${clicked.radionuclides.split(';').join('<br>')}
        `);
    } else {
      selectedPoint = null;
      tooltip.style("display", "none");
    }
  });

// --- Zoom ---
const zoom = d3.zoom()
  .scaleExtent([1, 250])
  .on("zoom", event => {
    const t = event.transform;
    projection
      .translate([t.x, t.y])
      .scale(t.k * 300);
    points = render(land50);
  });

d3.select(canvas)
  .call(zoom)
  .on("dblclick.zoom", null);

// --- Search bar filtering ---
searchBar.on("input", function () {
  const query = this.value.toLowerCase();
  filteredData = data.filter(d =>
    (d["Member State"] && d["Member State"].toLowerCase().includes(query)) ||
    (d["Laboratory Name"] && d["Laboratory Name"].toLowerCase().includes(query)) ||
    (d["Geographic Region"] && d["Geographic Region"].toLowerCase().includes(query)) ||
    (d["Contact Person"] && d["Contact Person"].toLowerCase().includes(query)) ||
    (d["City"] && d["City"].toLowerCase().includes(query)) ||
    (d["Radionuclides"] && d["Radionuclides"].toLowerCase().includes(query))
  );
  points = render(land50);
});

// --- Load data and initialize ---
let land50;

Promise.all([
  d3.json("land-50m.json"),
  d3.csv("/ALMERA3.github.io/data/2020_ALMERA_Capabilities_Survey.csv")
]).then(([landJson, csv]) => {
  land50 = topojson.feature(landJson, landJson.objects.countries);
  data = csv;
  filteredData = data;
  points = render(land50);
});
