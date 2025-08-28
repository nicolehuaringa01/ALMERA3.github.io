// Assuming your CSV has: LabID, Affiliation (with multiple affiliations possible per lab)

// Count affiliations
const affiliationCounts = d3.rollup(
  data.flatMap(d => d.Affiliation.split(";").map(a => a.trim())), 
  v => v.length,
  d => d
);

// Total labs (all in CSV)
const totalLabs = new Set(data.map(d => d.LabID)).size;

// Labs that answered at least one affiliation
const labsThatAnswered = new Set(
  data.filter(d => d.Affiliation && d.Affiliation.trim() !== "")
      .map(d => d.LabID)
).size;

// Total affiliations selected (can be > labsThatAnswered)
const totalAffiliationsCount = Array.from(affiliationCounts.values())
  .reduce((a, b) => a + b, 0);

// --- Chart setup ---
const margin = { top: 60, right: 30, bottom: 50, left: 120 };
const width = 700 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Scales
const x = d3.scaleBand()
  .domain(Array.from(affiliationCounts.keys()))
  .range([0, width])
  .padding(0.2);

const y = d3.scaleLinear()
  .domain([0, d3.max(Array.from(affiliationCounts.values())) * 1.2])
  .nice()
  .range([height, 0]);

// Bars
svg.selectAll("rect")
  .data(Array.from(affiliationCounts.entries()))
  .enter().append("rect")
  .attr("x", d => x(d[0]))
  .attr("y", d => y(d[1]))
  .attr("width", x.bandwidth())
  .attr("height", d => height - y(d[1]))
  .attr("fill", "#69b3a2");

// Axes
svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x));

svg.append("g")
  .call(d3.axisLeft(y));

// --- Red reference lines ---
// Thick line for all labs
svg.append("line")
  .attr("x1", 0)
  .attr("x2", width)
  .attr("y1", y(totalLabs))
  .attr("y2", y(totalLabs))
  .attr("stroke", "red")
  .attr("stroke-width", 3)
  .attr("stroke-dasharray", "5,3");

// Thinner line for labs that answered
svg.append("line")
  .attr("x1", 0)
  .attr("x2", width)
  .attr("y1", y(labsThatAnswered))
  .attr("y2", y(labsThatAnswered))
  .attr("stroke", "red")
  .attr("stroke-width", 1.5)
  .attr("stroke-dasharray", "2,2");

// --- Labels for totals ---
svg.append("text")
  .attr("x", 0)
  .attr("y", -20)
  .attr("text-anchor", "start")
  .attr("font-size", "12px")
  .attr("font-weight", "bold")
  .text(`Total responses: ${totalAffiliationsCount.toLocaleString("en-US")}`);

svg.append("text")
  .attr("x", 0)
  .attr("y", -5)
  .attr("text-anchor", "start")
  .attr("font-size", "12px")
  .text(`Total laboratories that answered: ${labsThatAnswered.toLocaleString("en-US")}`);

svg.append("text")
  .attr("x", 0)
  .attr("y", 10)
  .attr("text-anchor", "start")
  .attr("font-size", "12px")
  .text(`Total laboratories in network: ${totalLabs.toLocaleString("en-US")}`);

