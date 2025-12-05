// Load CSV file
d3.csv("/data/2025_ALMERA_Capabilities_Survey.csv").then(data => {
    // ... (rest of the file remains the same)

    // Column to extract
    const column = "6.3 If the laboratory is accredited against ISO 17025, specify year of accreditation.";

    // --- Start of MODIFIED Data Processing ---

    // 1. Parse, clean, and filter data
    const yearCounts = d3.rollup(
        data
            .map(d => parseInt(d[column]))
            .filter(y => y >= 1900 && y <= new Date().getFullYear()),
        v => v.length,
        y => y
    );

    // 2. Convert Map to Array and sort by year
    const rawProcessedData = Array.from(yearCounts, ([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year);
    
    // 3. APPLY THE NEW GROUPING FUNCTION HERE
    const finalChartData = groupHistoricalYears(rawProcessedData);

    // --- End of MODIFIED Data Processing ---
    
    // Chart setup
    // ... (rest of setup is the same)
    
    // Scales: Use finalChartData for the domain
    const x = d3.scaleBand()
        .domain(finalChartData.map(d => d.year)) // NOW uses "Pre-2000" and year numbers
        .range([0, width])
        .padding(0.2); 

    const y = d3.scaleLinear()
        .domain([0, d3.max(finalChartData, d => d.count)]) // Use finalChartData
        .nice()
        .range([height, 0]);

    // Bars: Use finalChartData for binding
    svg.selectAll(".bar")
        .data(finalChartData)
        // ... (rest of bar code is the same)

    // Labels: Use finalChartData for binding
    svg.selectAll(".label")
        .data(finalChartData)
        // ... (rest of label code is the same)
    
    // ... (Axes and rest of rendering code is the same)
});
// You must include the function definition outside of the d3.csv().then() block
function groupHistoricalYears(data) {
    let pre2000Count = 0;
    const post2000Data = [];

    for (const d of data) {
        if (d.year < 2000) {
            pre2000Count += d.count;
        } else {
            post2000Data.push(d);
        }
    }

    const historicalGroup = { 
        year: "Pre-2000", 
        count: pre2000Count 
    };

    const finalData = [historicalGroup, ...post2000Data];
    
    return finalData;
}
