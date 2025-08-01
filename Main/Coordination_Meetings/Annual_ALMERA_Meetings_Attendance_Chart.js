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
    const processedData = rawData.map(d => {
        const year = +d[yearColumn]; // Convert Year to a number
        // Convert Participants to a number. Handle cases where it might be '-' or empty.
        const participants = d[participantsColumn] === '—' || d[participantsColumn] === '' ? null : +d[participantsColumn];

        // Only return valid entries for plotting
        if (!isNaN(year) && participants !== null && !isNaN(participants)) {
            return {
                year: year,
                participants: participants
            };
        }
        return null; // Return null for invalid rows
    }).filter(d => d !== null); // Filter out the null entries

    console.log("Processed data for attendance chart:", processedData);

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
        const height = 300; // Fixed height for the chart
        const marginTop = 30;
        const marginRight = 20;
        const marginBottom = 50;
        const marginLeft = 60;

        // Create the bar chart using Observable Plot
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
                nice: true // Make ticks "nice" numbers
            },
            y: {
                label: "Number of Participants",
                domain: [0, d3.max(processedData, d => d.participants) * 1.1], // Start from 0, extend slightly above max
                nice: true // Make ticks "nice" numbers
            },
            color: {
                range: ["#4285F4"], // A nice blue color for the bars
                legend: false // No legend needed for a single color
            },
            marks: [
                // Create bar marks for each year's participants
                Plot.barY(processedData, {
                    x: "year",
                    y: "participants",
                    fill: "#4285F4", // Bar color
                    title: d => `Year: ${d.year}\nParticipants: ${d.participants}` // Tooltip on hover
                }),
                // Add text labels on top of each bar
                Plot.text(processedData, {
                    x: "year",
                    y: "participants",
                    text: d => d.participants, // Display participant count
                    dy: -10, // Offset text slightly above the bar
                    fill: "black", // Text color
                    fontWeight: "bold"
                }),
                Plot.axisX(), // X-axis with years
                Plot.axisY() // Y-axis with participant count
            ],
            style: {
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                background: "#f9f9f9", // Light background for the chart area
                borderRadius: "8px",
                padding: "10px"
            }
        });

        // Append the generated chart (SVG element) to the container
        chartContainer.appendChild(chart);
        console.log("Annual Meetings Attendance chart appended to DOM.");
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
