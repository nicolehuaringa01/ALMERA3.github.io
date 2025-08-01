document.addEventListener('DOMContentLoaded', () => {
    const csvFilePath = '../../data/Past_Annual_ALMERA_Coordination_Meetings.csv'; // Your specified CSV path
    const tableBodyD3 = d3.select('#table-body-content'); // D3 selection for table body
    const tableBodyNative = document.getElementById('table-body-content'); // Native selection for innerHTML
    const searchInput = document.getElementById('table-search');
    const tableHeaders = document.querySelectorAll('.meeting-table th.sortable-header');

    let originalData = []; // To store the full dataset from CSV
    let currentSortColumn = null;
    let currentSortDirection = 'asc'; // 'asc' or 'desc'

    // Function to fetch and load data using D3.js
    async function loadTableData() {
        try {
            const data = await d3.csv(csvFilePath);
            console.log("Loaded CSV data:", data); // CRITICAL: Check this output!

            // Filter out any rows that might be empty or invalid (e.g., missing essential data)
            // Use the specific column names from your CSV
            originalData = data.filter(d => d["Year"] && (d["Meeting #"] && (d["Location"] && (d["Participants"] && (d["Member States"] || d["Dates"]));

            // Initial sort by Member State for better readability
            originalData.sort((a, b) => {
                const memberStateA = (a["1.3 Member State"] || "").toUpperCase();
                const memberStateB = (b["1.3 Member State"] || "").toUpperCase();
                return memberStateA.localeCompare(memberStateB);
            });

            currentSortColumn = 'state'; // Set initial sort column
            currentSortDirection = 'asc'; // Set initial sort direction

            // Add the 'asc' class to the initial sorted header
            const initialStateHeader = document.querySelector('.meeting-table th[data-sort="state"]');
            if (initialStateHeader) {
                initialStateHeader.classList.add('asc');
            }

            renderTable(originalData); // Initial render with sorted data

        } catch (error) {
            console.error("Error loading the CSV file:", error);
            // Use native tableBodyNative for innerHTML assignments
            tableBodyNative.innerHTML = '<tr><td colspan="3" class="text-center text-red-500 p-4">Error loading member data. Please try again later.</td></tr>';
        }
    }

    // Function to render table rows based on provided data
    function renderTable(dataToRender) {
        tableBodyNative.innerHTML = ''; // Clear existing rows using native JS for performance
        if (dataToRender.length === 0) {
            tableBodyNative.innerHTML = '<tr><td colspan="3" class="text-center text-gray-600 py-4">No matching laboratories found.</td></tr>';
            return;
        }
    
    // Initial data load when the page loads
    loadTableData();
});
