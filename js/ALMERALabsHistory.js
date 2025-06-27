// js/ALMERALabsHistory.js

const csvDataPath = "data/ALMERA_Country_Lab_History.csv";

async function initializeALMERA_Labs_HistoryChart() {
    const container = document.getElementById("ALMERA_Labs_History-chart-container");
    if (!container) {
        console.error("ALMERA_Labs_History chart container element #ALMERA_Labs_History-chart-container not found.");
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Error: Chart container not found in HTML for ALMERA_Labs_History chart.';
        document.body.appendChild(errorDiv);
        return;
    }

    let data;
    try {
        data = await d3.csv(csvDataPath);
        console.log("ALMERA_Labs_History Chart CSV data loaded successfully. Number of records:", data.length);
        if (data.length === 0) {
            console.warn("CSV data is empty. No chart to display.");
            container.innerHTML = "<p style='text-align: center;'>CSV data is empty. No chart to display.</p>";
            return;
        }

        // Convert string values to numbers
        data.forEach(d => {
            d.Value_2025 = +d.Value_2025; // Convert to number
            d.Value_2013 = +d.Value_2013; // Convert to number
        });

        // Sort data by the 'Value_2025' column in descending order
        // You can change 'Value_2025' to 'Value_2013' or any other sorting logic
        data.sort((a, b) => d3.descending(a.Value_2025, b.Value_2025));

        console.log("Processed ALMERA_Labs_History Chart data (first 5 rows):", data.slice(0, 5));

    } catch (error) {
        console.error("Error loading ALMERA_Labs_History Chart CSV data:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Failed to load ALMERA_Labs_History chart data. Please check the console for details and ensure the CSV path is correct and columns exist.</p>";
        return;
    }

    // --- Chart Rendering Logic ---

    const renderChart = (currentWidth) => {
        container.innerHTML = ''; // Clear previous chart on resize

        const margin = { top: 30, right: 60, bottom: 40, left: 120 }; // Adjusted left margin for country names
        const innerWidth = currentWidth - margin.left - margin.right;
        const innerHeight = data.length * 25; // Height based on number of countries and spacing

        // Create SVG container
        const svg = d3.select(container).append("svg")
            .attr("width", currentWidth)
            .attr("height", innerHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // X-scale
        const xScale = d3.scaleLinear()
            .domain([0, 100]) // Percentages from 0 to 100
            .range([0, innerWidth]);

        // Y-scale (Band scale for countries)
        const yScale = d3.scaleBand()
            .domain(data.map(d => d.Country))
            .range([0, innerHeight])
            .padding(0.5);

        // Add X-axis
        svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}%`)) // Show ticks at 5 intervals, add %
            .selectAll("text")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "10px");

        // Add X-axis label
        svg.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom - 5)
            .attr("text-anchor", "middle")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "12px")
            .text("% Favorable Views");

        // Add Y-axis (Country names)
        svg.append("g")
            .call(d3.axisLeft(yScale).tickSizeOuter(0))
            .selectAll("text")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "11px");

        // Lines connecting the two points (ALMERA_Labs_Historys)
        svg.selectAll(".ALMERA_Labs_History-line")
            .data(data)
            .enter().append("line")
            .attr("class", "ALMERA_Labs_History-line")
            .attr("x1", d => xScale(d.Value_2025))
            .attr("y1", d => yScale(d.Country) + yScale.bandwidth() / 2)
            .attr("x2", d => xScale(d.Value_2013))
            .attr("y2", d => yScale(d.Country) + yScale.bandwidth() / 2)
            .attr("stroke", "#ccc") // Light gray line
            .attr("stroke-width", 1);

        // Circles for 2025 (e.g., orange)
        svg.selectAll(".circle-2025")
            .data(data)
            .enter().append("circle")
            .attr("class", "circle-2025")
            .attr("cx", d => xScale(d.Value_2025))
            .attr("cy", d => yScale(d.Country) + yScale.bandwidth() / 2)
            .attr("r", 4) // Radius of the circle
            .attr("fill", "#ff9900"); // Orange for 2025

        // Circles for 2013 (e.g., blue)
        svg.selectAll(".circle-2013")
            .data(data)
            .enter().append("circle")
            .attr("class", "circle-2013")
            .attr("cx", d => xScale(d.Value_2013))
            .attr("cy", d => yScale(d.Country) + yScale.bandwidth() / 2)
            .attr("r", 4)
            .attr("fill", "#007bff"); // Blue for 2013

        // Text labels for 2025 values (orange)
        svg.selectAll(".text-2025")
            .data(data)
            .enter().append("text")
            .attr("class", "text-2025")
            .attr("x", d => xScale(d.Value_2025))
            .attr("y", d => yScale(d.Country) + yScale.bandwidth() / 2)
            .attr("dx", -10) // Offset to the left of the circle
            .attr("dy", "0.35em") // Vertically center
            .attr("text-anchor", "end") // Anchor text to the end (right) of the specified x
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "10px")
            .style("fill", "#333") // Dark text
            .text(d => d.Value_2025);

        // Text labels for 2013 values (blue)
        svg.selectAll(".text-2013")
            .data(data)
            .enter().append("text")
            .attr("class", "text-2013")
            .attr("x", d => xScale(d.Value_2013))
            .attr("y", d => yScale(d.Country) + yScale.bandwidth() / 2)
            .attr("dx", 10) // Offset to the right of the circle
            .attr("dy", "0.35em")
            .attr("text-anchor", "start") // Anchor text to the start (left) of the specified x
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "10px")
            .style("fill", "#333")
            .text(d => d.Value_2013);

        // Add a legend (similar to your image)
        const legendData = [
            { label: "2025", color: "#ff9900" },
            { label: "2013", color: "#007bff" }
        ];

        const legend = svg.append("g")
            .attr("transform", `translate(${innerWidth - 100}, -15)`) // Position top right
            .attr("font-family", "Inter, sans-serif")
            .attr("font-size", 10)
            .selectAll("g")
            .data(legendData)
            .enter().append("g")
            .attr("transform", (d, i) => `translate(${i * 50}, 0)`); // Space out horizontally

        legend.append("rect")
            .attr("x", 0)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", d => d.color);

        legend.append("text")
            .attr("x", 15)
            .attr("y", 5)
            .attr("dy", "0.35em")
            .text(d => d.label);

        console.log("ALMERA_Labs_History Chart appended to DOM.");
    };

    // Initial render
    renderChart(container.clientWidth);

    // Handle responsiveness
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            renderChart(container.clientWidth);
        }, 200); // Debounce
    });
}

document.addEventListener("DOMContentLoaded", initializeALMERA_Labs_HistoryChart);
