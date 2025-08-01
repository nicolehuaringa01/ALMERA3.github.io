// Main/Coordination_Meetings/Annual_ALMERA_Meeting.js

document.addEventListener('DOMContentLoaded', () => {
    // Correct path to your CSV file
    const csvFilePath = '../../data/Past_Annual_ALMERA_Coordination_Meetings.csv';
    // Select the tbody element for the "Past Annual Coordination Meetings" table
    const tableBodyNative = document.querySelector('table.meeting-table tbody');

    // Function to fetch and load data using D3.js
    async function loadTableData() {
        try {
            const data = await d3.csv(csvFilePath);
            console.log("Loaded CSV data:", data); // Check this output in your browser's console

            // Define the exact column names from your CSV that you want to display
            const desiredColumns = [
                "Year",
                "Meeting #",
                "Location",
                "Participants",
                "Member States",
                "Dates"
            ];

            // Filter out any rows that might be empty or invalid based on essential columns
            // This ensures only complete rows are processed
            const cleanedData = data.filter(d =>
                desiredColumns.every(col => d[col] !== undefined && d[col] !== null && d[col].trim() !== '')
            );

            renderTable(cleanedData, desiredColumns); // Render the table with cleaned data

        } catch (error) {
            console.error("Error loading the CSV file:", error);
            // Display an error message in the table body if data loading fails
            tableBodyNative.innerHTML = '<tr><td colspan="6" class="text-center text-red-500 p-4">Error loading meeting data. Please check the console for details.</td></tr>';
        }
    }

    // Function to render table rows based on provided data and desired columns
    function renderTable(dataToRender, columns) {
        tableBodyNative.innerHTML = ''; // Clear existing rows (including your hardcoded example rows)

        if (dataToRender.length === 0) {
            tableBodyNative.innerHTML = '<tr><td colspan="6" class="text-center text-gray-600 py-4">No past annual coordination meetings found.</td></tr>';
            return;
        }

        // Create table rows for each data item
        dataToRender.forEach(d => {
            const row = tableBodyNative.insertRow(); // Insert a new row
            columns.forEach(col => {
                const cell = row.insertCell(); // Insert a new cell for each column
                cell.textContent = d[col] || ''; // Set cell text, default to empty string if data is missing
            });
        });
        console.log("Table rendered successfully.");
    }

    // Initial data load when the page loads
    loadTableData();
});
