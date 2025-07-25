document.addEventListener('DOMContentLoaded', () => {
    const csvFilePath = 'data/Observable2020Survey.csv'; // Your specified CSV path
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
            originalData = data.filter(d => d["1.3 Member State"] && (d["1.1 Name of Laboratory"] || d["1.2 Physical Address"]));

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

        dataToRender.forEach(row => {
            const tr = document.createElement('tr');
            // Use specific column names and handle newlines as in your original D3 code
            const memberState = row["1.3 Member State"] || '';
            const laboratory = (row["1.1 Name of Laboratory"] || '').replace(/\n/g, '<br>');
            const address = (row["1.2 Physical Address"] || '').replace(/\n/g, '<br>');

            tr.innerHTML = `
                <td class="border border-gray-300 p-3 align-top">${memberState}</td>
                <td class="border border-gray-300 p-3 align-top">${laboratory}</td>
                <td class="border border-gray-300 p-3 align-top">${address}</td>
            `;
            tableBodyNative.appendChild(tr);
        });
    }

    // --- Search/Filter Functionality ---
    if (searchInput) { // Ensure searchInput exists before adding listener
        searchInput.addEventListener('keyup', () => {
            const searchTerm = searchInput.value.toLowerCase();
            let filteredData = originalData.filter(row => {
                // Search across Member State, Laboratory, and Address columns
                // Use specific column names
                return (row["1.3 Member State"] && row["1.3 Member State"].toLowerCase().includes(searchTerm)) ||
                       (row["1.1 Name of Laboratory"] && row["1.1 Name of Laboratory"].toLowerCase().includes(searchTerm)) ||
                       (row["1.2 Physical Address"] && row["1.2 Physical Address"].toLowerCase().includes(searchTerm));
            });

            // After filtering, re-apply current sort
            if (currentSortColumn) {
                sortData(filteredData, currentSortColumn, currentSortDirection);
            } else {
                renderTable(filteredData);
            }
        });
    }


    // --- Sorting Functionality ---
    tableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort; // e.g., 'state', 'lab', 'address'
            let direction = 'asc';

            // If clicking the same column, toggle direction
            if (currentSortColumn === column) {
                direction = currentSortDirection === 'asc' ? 'desc' : 'asc';
            }

            // Update header classes for visual indicator
            tableHeaders.forEach(h => h.classList.remove('asc', 'desc')); // Clear all
            header.classList.add(direction); // Add to clicked

            currentSortColumn = column;
            currentSortDirection = direction;

            // Get the data that's currently visible (filtered by search if any)
            const dataToSort = searchInput && searchInput.value ? // Check if searchInput exists and has value
                originalData.filter(row =>
                    (row["1.3 Member State"] && row["1.3 Member State"].toLowerCase().includes(searchInput.value.toLowerCase())) ||
                    (row["1.1 Name of Laboratory"] && row["1.1 Name of Laboratory"].toLowerCase().includes(searchInput.value.toLowerCase())) ||
                    (row["1.2 Physical Address"] && row["1.2 Physical Address"].toLowerCase().includes(searchInput.value.toLowerCase()))
                ) :
                [...originalData]; // Use a copy of original data if no search

            sortData(dataToSort, column, direction);
        });
    });

    function sortData(data, column, direction) {
        data.sort((a, b) => {
            let valA, valB;

            // Map data-sort attribute to actual CSV column names from Observable2020Survey.csv
            if (column === 'state') {
                valA = a["1.3 Member State"] || '';
                valB = b["1.3 Member State"] || '';
            } else if (column === 'lab') {
                valA = a["1.1 Name of Laboratory"] || '';
                valB = b["1.1 Name of Laboratory"] || '';
            } else if (column === 'address') {
                valA = a["1.2 Physical Address"] || '';
                valB = b["1.2 Physical Address"] || '';
            } else {
                return 0; // Should not happen if data-sort attributes are correctly set
            }

            // Case-insensitive string comparison
            const comparison = valA.localeCompare(valB, undefined, { sensitivity: 'base' });

            return direction === 'asc' ? comparison : -comparison;
        });
        renderTable(data);
    }

    // Initial data load when the page loads
    loadTableData();
});
