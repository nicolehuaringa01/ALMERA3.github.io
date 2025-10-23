// 2.1_Full_Time_Trained_Professionals.js
// Uses d3.v7 and @observablehq/plot v0.6 (UMD). Make sure those scripts are loaded before this file.

(async function () {
  const csvDataPath = "/ALMERA3.github.io/data/2025_ALMERA_Capabilities_Survey.csv";
  const containerId = "human-resources-chart-container";

  // Ranges in the order you requested (left → right)
  const ranges = ["1–5", "6–10", "11–15", "16–20", "21+"];

  // Region color mapping requested
  const regionColors = {
    "NORTH AND LATIN AMERICA": "#009d28", // green
    "EUROPE": "#d10000",                  // red
    "ASIA PACIFIC": "#0083b4",            // blue
    "MIDDLE EAST": "#ddb100",             // yellow
    "AFRICA": "#9942b2"                   // purple
  };
  const regionOrder = Object.keys(regionColors); // for legend ordering

  // column names from your CSV
  const professionalCountColumn = "2.1 What is the number of full-time trained professionals and technicians in the laboratory?";
  const geographicRegionColumn = "1.4 Geographic Region";

  // --- guards ---
  if (typeof d3 === "undefined") {
    console.error("d3 not found. Make sure d3.v7 script is loaded before this file.");
    return;
  }
  if (typeof Plot === "undefined") {
    console.error("Plot not found. Make sure @observablehq/plot UMD script is loaded before this file.");
    return;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`#${containerId} not found in the DOM.`);
    return;
  }

  // Load CSV
  let raw;
  try {
    raw = await d3.csv(csvDataPath);
    console.log("CSV loaded:", raw.length, "rows");
  } catch (err) {
    console.error("Failed to load CSV:", err);
    container.innerHTML = "<p style='color:red'>Failed to load CSV. Check path and network.</p>";
    return;
  }

  // Process rows: compute for each region the total labs that answered question 2.1,
  // and for each (range, region) how many labs fall in that bucket.
  function parseNumberSafe(v) {
    if (v == null) return NaN;
    // Remove commas and trim
    return Number(String(v).replace(/,/g, "").trim());
  }

  // Normalize region strings (uppercase, trim)
  function normRegion(s) {
    if (!s && s !== "") return null;
    return String(s).trim().toUpperCase();
  }

  // Bins: map numeric n -> range label (or null)
  function binFor(n) {
    if (n >= 1 && n <= 5) return "1–5";
    if (n >= 6 && n <= 10) return "6–10";
    if (n >= 11 && n <= 15) return "11–15";
    if (n >= 16 && n <= 20) return "16–20";
    if (n >= 21) return "21+";
    return null;
  }

  // Compute region totals (total labs that answered the question, per region)
  const regionTotals = {};
  // Compute counts per (range, region)
  const counts = {}; // counts[range] = { region: count, ... }
  for (const r of ranges) counts[r] = {};

  for (const row of raw) {
    const n = parseNumberSafe(row[professionalCountColumn]);
    const regionRaw = row[geographicRegionColumn];
    const region = normRegion(regionRaw);

    // Only consider recognized region names (the 5)
    if (!region || !regionColors.hasOwnProperty(region)) continue;
    if (Number.isNaN(n)) continue; // skip blanks or invalid numbers

    // record region total
    regionTotals[region] = (regionTotals[region] || 0) + 1;

    // figure out which range this n falls into
    const rlabel = binFor(n);
    if (!rlabel) continue;

    counts[rlabel][region] = (counts[rlabel][region] || 0) + 1;
  }

  // Total labs that answered the question (sum of regionTotals)
  const totalLabsAnswered = Object.values(regionTotals).reduce((a, b) => a + b, 0);

  // Build data arrays for plotting
  // totalsPerRange: each element { range, total } (gray large bar)
  const totalsPerRange = ranges.map(range => {
    const sum = regionOrder.reduce((s, reg) => s + (counts[range][reg] || 0), 0);
    return { range, total: sum };
  });

  // chartData: each colored slim bar: { range, region, count }
  const chartData = [];
  for (const range of ranges) {
    for (const region of regionOrder) {
      chartData.push({
        range,
        region,
        count: counts[range][region] || 0
      });
    }
  }

  // If nothing to plot, show message
  if (totalLabsAnswered === 0 || chartData.every(d => d.count === 0)) {
    container.innerHTML = "<p style='text-align:center'>No data available for this chart.</p>";
    console.warn("No data after processing for 2.1 chart.");
    return;
  }

  // Create top info: total labs answered
  const infoDiv = document.createElement("div");
  infoDiv.style.margin = "8px 0 12px 4px";
  infoDiv.style.fontFamily = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
  infoDiv.style.fontSize = "14px";
  infoDiv.style.fontWeight = "600";
  infoDiv.textContent = `Total laboratories that answered Q2.1: ${totalLabsAnswered.toLocaleString()}`;
  container.appendChild(infoDiv);

  // Render function (so we can redraw responsively)
  function render() {
    container.querySelectorAll("svg, .plot").forEach(el => el.remove()); // clear old plot (Plot appends an SVG)

    const width = Math.max(container.clientWidth, 700);
    const height = 420;

    // Prepare a mapping for tooltips: regionTotals used to compute percentage
    const regionTotalsSafe = Object.assign({}, regionTotals);
    // avoid division by zero
    for (const r of regionOrder) regionTotalsSafe[r] = regionTotalsSafe[r] || 0;

    // Build marks:
    // 1) Gray background bars (totals per range). Plotted first so colored bars overlay.
    // 2) Colored bars: grouped/dodged by range using Plot.dodgeX
    // 3) Text labels above gray bars showing totals
    const grayBars = Plot.barY(totalsPerRange, {
      x: "range",
      y: "total",
      fill: "#e6e6e6",
      stroke: "#e6e6e6",
      title: d => `${d.total} labs`
    });

    // Colored grouped bars: use Plot.barY on chartData and then wrap in Plot.dodgeX([...])
    const coloredBar = Plot.barY(chartData, {
      x: "range",
      y: "count",
      fill: d => regionColors[d.region],
      // We'll set an explicit fill label for legend mapping:
      // Note: Plot's automatic legend won't appear with a function fill; instead we create a legend manually below.
      title: d => {
        const regTotal = regionTotalsSafe[d.region] || 0;
        const pct = regTotal === 0 ? 0 : (d.count / regTotal) * 100;
        return `Total labs: ${d.count}. (${pct.toFixed(1)}% of region)`;
      }
    });

    // Place coloredBar inside dodgeX marks array:
    const dodged = Plot.dodgeX([coloredBar], { // group bars within each range
      // order of the groups is controlled by regionOrder; we provide a sort callback by region index
      // but dodgeX will respect the x categories (ranges)
    });

    // Text labels above gray bars
    const totalLabels = Plot.text(totalsPerRange, {
      x: "range",
      y: d => d.total + Math.max(2, Math.ceil(d.total * 0.03)),
      text: d => `${d.total}`,
      textAnchor: "middle",
      fill: "#222",
      fontWeight: 700,
      fontSize: 12
    });

    // Create a custom legend element because we used a function for fill above.
    // We'll create a small DOM legend (keeps styling flexible)
    const legendDiv = document.createElement("div");
    legendDiv.style.display = "flex";
    legendDiv.style.gap = "12px";
    legendDiv.style.alignItems = "center";
    legendDiv.style.margin = "6px 0";
    legendDiv.style.fontFamily = "Inter, sans-serif";
    legendDiv.style.fontSize = "12px";

    for (const r of regionOrder) {
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.gap = "6px";

      const sw = document.createElement("span");
      sw.style.display = "inline-block";
      sw.style.width = "14px";
      sw.style.height = "14px";
      sw.style.borderRadius = "2px";
      sw.style.background = regionColors[r];
      sw.style.border = "1px solid rgba(0,0,0,0.05)";

      const label = document.createElement("span");
      label.textContent = r;
      label.style.color = "#222";

      item.appendChild(sw);
      item.appendChild(label);
      legendDiv.appendChild(item);
    }

    // Append legend before the plot
    container.appendChild(legendDiv);

    // Build the Plot
    const plot = Plot.plot({
      width,
      height,
      marginLeft: 80,
      marginRight: 24,
      marginBottom: 80,
      x: {
        label: "Number of Trained Professionals (Per Lab)",
        domain: ranges
      },
      y: {
        label: "Number of Laboratories",
        grid: true
      },
      // No automatic color legend because we used function fill; keep color config simple
      marks: [
        grayBars,
        dodged,
        totalLabels,
        Plot.ruleY([0])
      ],
      style: {
        fontFamily: "Inter, sans-serif",
        fontSize: "12px"
      }
    });

    container.appendChild(plot);

    // Tooltips: Plot's built-in title works for the bars; but because we used a function fill
    // the browser's title attribute is already set on each rect via Plot's title option. That provides hover tooltips.
    // If you want fancier tooltips, we could implement a custom tooltip layer; for now the title attribute is used.
  }

  // Initial render + responsive redraw
  render();
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(render, 220);
  });
})();
