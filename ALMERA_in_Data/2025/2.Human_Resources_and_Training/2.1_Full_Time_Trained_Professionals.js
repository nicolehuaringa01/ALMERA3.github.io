const csvDataPath1 = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";

async function initializeHumanResourcesChart() {
  const container = document.getElementById("human-resources-chart-container");
  if (!container) {
    console.error("Container not found");
    return;
  }

  let data;
  try {
    data = await d3.csv(csvDataPath1);
    console.log("CSV loaded:", data.length);
  } catch (err) {
    console.error("Error loading CSV:", err);
    container.textContent = "Failed to load CSV.";
    return;
  }

  // Process data
  const bins = [
    { label: "1–5", min: 1, max: 5 },
    { label: "6–10", min: 6, max: 10 },
    { label: "11–20", min: 11, max: 20 },
    { label: "21+", min: 21, max: Infinity }
  ];

  const regionColors = {
    "ASIA PACIFIC": "#0083b4",
    "AFRICA": "#9942b2",
    "EUROPE": "#d10000",
    "MIDDLE EAST": "#ddb100",
    "NORTH AND LATIN AMERICA": "#009d28"
  };

  const professionalCountColumn = "2.1 What is the number of full-time trained professionals and technicians in the laboratory?";
  const geographicRegionColumn = "1.4 Geographic Region";

  const binCounts = {};

  data.forEach(d => {
    const n = +d[professionalCountColumn];
    const region = d[geographicRegionColumn]?.trim().toUpperCase();

    if (isNaN(n) || !regionColors[region]) return;

    const bin = bins.find(b => n >= b.min && n <= b.max);
    if (bin) {
      const key = `${bin.label}||${region}`;
      binCounts[key] = (binCounts[key] || 0) + 1;
    }
  });

  const chartData = Object.entries(binCounts).map(([key, count]) => {
    const [range, region] = key.split("||");
    return { range, region, count };
  });

  console.log("Processed chartData:", chartData);

  // Plot
  const HumanResourcesPlot = Plot.plot({
    width: container.clientWidth,
    height: 500,
    marginLeft: 60,
    marginBottom: 60,
    x: {
      label: "Geographic Region",
    },
    y: {
      label: "Number of Laboratories",
      grid: true
    },
    color: {
      legend: true,
      label: "Professionals per Lab",
      domain: ["1–5", "6–10", "11–20", "21+"],
      range: ["#7f7f7f", "#0083b4", "#9942b2", "#d10000"]
    },
    marks: [
      Plot.dodgeX([
        Plot.barY(chartData, {
          x: "region",
          y: "count",
          fill: "range",
          title: d => `${d.range}: ${d.count} labs`
        })
      ]),
      Plot.ruleY([0])
    ]
  });

  container.innerHTML = "";
  container.appendChild(HumanResourcesPlot);
}

document.addEventListener("DOMContentLoaded", initializeHumanResourcesChart);
