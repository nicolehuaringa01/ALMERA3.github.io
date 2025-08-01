// Main/Coordination_Meetings/Annual_ALMERA_Meetings_Attendance_Line_Chart.js

document.addEventListener('DOMContentLoaded', async () => {
    // Define the path to your CSV file
    const csvFilePath2 = '../../data/Past_Annual_ALMERA_Coordination_Meetings.csv';

    // Select the container element where the chart will be rendered
    const chartContainer = document.getElementById('annual-attendance-chart-container');

    // Check if the chart container exists in the HTML
    if (!chartContainer) {
        console.error("Chart container element #annual-attendance-chart-container not found.");
        // Display an error message directly on the page if the container is missing
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Error: Chart container not found in HTML for Annual Meetings Attendance chart.';
        document.body.appendChild(errorDiv);
        return; // Stop execution if the container is not found
    }

    let rawData;
    try {
        // Load the CSV data using D3.js
        rawData = await d3.csv(csvFilePath2);
        console.log("Raw CSV data loaded for attendance chart:", rawData);
    } catch (error) {
        console.error("Error loading CSV data for attendance chart:", error);
        // Display an error message in the container if CSV loading fails
        chartContainer.innerHTML = "<p style='color: red; text-align: center;'>Failed to load attendance data. Please check the console for details and ensure the CSV path is correct.</p>";
        return; // Stop execution if data cannot be loaded
    }

    // Define the column names we need from the CSV
    const yearColumn = "Year";
    const participantsColumn = "Participants";

    // Process the data: filter out invalid entries and convert types
    // Sort data by year to ensure the line chart is drawn correctly
    const processedData = rawData.map(d => {
        const year = +d[yearColumn.trim()]; // Convert Year to a number, trim potential whitespace
        // Convert Participants to a number. Handle cases where it might be '—' or empty.
        const participants = (d[participantsColumn.trim()] === '—' || d[participantsColumn.trim()] === '') ? null : +d[participantsColumn.trim()];

        // Only return valid entries for plotting
        if (!isNaN(year) && participants !== null && !isNaN(participants)) {
            return {
                year: year,
                participants: participants
            };
        }
        return null; // Return null for invalid rows
    }).filter(d => d !== null) // Filter out the null entries
      .sort((a, b) => a.year - b.year); // Sort by year for correct line progression

    console.log("Processed and sorted data for attendance chart:", processedData);

    // Check if there's any valid data to display
    if (processedData.length === 0) {
        console.warn("No valid data found for Annual Meetings Attendance chart after processing.");
        chartContainer.innerHTML = "<p style='text-align: center; color: #666;'>No attendance data to display for the chart.</p>";
        return; // Stop if no valid data
    }

    // Function to render the chart, allowing for redraw on resize
    const renderChart = (currentWidth) => {
        chartContainer.innerHTML = ''; // Clear existing chart to redraw

        // Define chart dimensions
        const height = 350; // Adjusted height for better visualization
        const marginTop = 40; // More space for title
        const marginRight = 20;
        const marginBottom = 60; // More space for x-axis label and ticks
        const marginLeft = 70; // More space for y-axis label and ticks

        // Create the line chart using Observable Plot
        const chart = Plot.plot({
            width: currentWidth,
            height: height,
            marginTop: marginTop,
            marginRight: marginRight,
            marginBottom: marginBottom,
            marginLeft: marginLeft,
            x: {
                label: "Year",
                tickFormat: "d", // Format years as integers
                domain: [d3.min(processedData, d => d.year) - 1, d3.max(processedData, d => d.year) + 1], // Extend domain slightly
                nice: true, // Make ticks "nice" numbers
                // Custom tick generation to ensure all years are shown if possible, or a reasonable subset
                ticks: processedData.map(d => d.year)
            },
            y: {
                label: "Number of Participants",
                domain: [0, d3.max(processedData, d => d.participants) * 1.15], // Start from 0, extend slightly above max for dots and labels
                nice: true // Make ticks "nice" numbers
            },
            marks: [
                // Line mark
                Plot.line(processedData, {
                    x: "year",
                    y: "participants",
                    stroke: "black", // Black line as in example
                    strokeWidth: 3 // Thicker line
                }),
                // Dot marks for each data point
                Plot.dot(processedData, {
                    x: "year",
                    y: "participants",
                    r: 6, // Radius of dots
                    fill: "black", // Black dots as in example
                    title: d => `Year: ${d.year}\nParticipants: ${d.participants}` // Tooltip
                }),
                Plot.axisX({
                    tickSize: 6, // Length of tick marks
                    tickPadding: 10 // Padding between tick marks and labels
                }),
                Plot.axisY({
                    tickSize: 6,
                    tickPadding: 10
                })
            ],
            style: {
                fontFamily: "Inter, sans-serif",
                fontSize: "14px", // Slightly larger font for readability
                background: "#f9f9f9", // Light background for the chart area
                borderRadius: "8px",
                padding: "15px", // More padding around the chart
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)" // Subtle shadow
            },
            // Add a title to the plot
            caption: "Annual Meeting Attendance Over Years"
        });

        // Append the generated chart (SVG element) to the container
        chartContainer.appendChild(chart);
        console.log("Annual Meetings Attendance Line Chart appended to DOM.");
    };

    // Initial render of the chart
    renderChart(chartContainer.clientWidth);

    // Handle responsiveness: redraw chart on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            renderChart(chartContainer.clientWidth);
        }, 200); // Debounce resize events for performance
    });
});
