document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('table-body-content');
    const searchInput = document.getElementById('table-search');
    const tableHeaders = document.querySelectorAll('.meeting-table th.sortable-header');
    let originalData = []; // To store the full dataset
    let currentSortColumn = null;
    let currentSortDirection = 'asc'; // 'asc' or 'desc'

    // Function to fetch and load data
    async function loadTableData() {
        try {
            const response = await fetch('data/ALMERA_Members_Table.csv'); // Make sure this path is correct
            const csvText = await response.text();

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    originalData = results.data;
                    renderTable(originalData); // Initial render with all data
                },
                error: (error) => {
                    console.error('Error parsing CSV:', error);
                    tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-red-500">Error loading data.</td></tr>';
                }
            });
        } catch (error) {
            console.error('Error fetching CSV:', error);
            tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-red-500">Error fetching data. Please check file path.</td></tr>';
        }
    }

    // Function to render table rows based on provided data
    function renderTable(dataToRender) {
        tableBody.innerHTML = ''; // Clear existing rows
        if (dataToRender.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-gray-600 py-4">No matching laboratories found.</td></tr>';
            return;
        }

        dataToRender.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row['Member State'] || ''}</td>
                <td>${row['Laboratory'] || ''}</td>
                <td>${row['Address'] || ''}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // --- Search/Filter Functionality ---
    searchInput.addEventListener('keyup', () => {
        const searchTerm = searchInput.value.toLowerCase();
        let filteredData = originalData.filter(row => {
            // Search across Member State, Laboratory, and Address columns
            return (row['Member State'] && row['Member State'].toLowerCase().includes(searchTerm)) ||
                   (row['Laboratory'] && row['Laboratory'].toLowerCase().includes(searchTerm)) ||
                   (row['Address'] && row['Address'].toLowerCase().includes(searchTerm));
        });

        // After filtering, re-apply current sort
        if (currentSortColumn) {
            sortData(filteredData, currentSortColumn, currentSortDirection);
        } else {
            renderTable(filteredData);
        }
    });

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
            tableHeaders.forEach(h => h.classList.remove('asc', 'desc'));
            header.classList.add(direction);

            currentSortColumn = column;
            currentSortDirection = direction;

            // Get current data (might be filtered)
            const currentTableRows = Array.from(tableBody.children).map(row => {
                // Reconstruct data from displayed row for sorting.
                // This is less efficient if you have large data and filter often.
                // A better approach for very large datasets would be to sort `originalData` or `filteredData` directly
                // and then re-render that. We are doing that now.
                return {
                    'Member State': row.children[0].textContent,
                    'Laboratory': row.children[1].textContent,
                    'Address': row.children[2].textContent
                };
            });

            // Get the data that's currently visible (filtered by search if any)
            const dataToSort = searchInput.value ?
                originalData.filter(row =>
                    (row['Member State'] && row['Member State'].toLowerCase().includes(searchInput.value.toLowerCase())) ||
                    (row['Laboratory'] && row['Laboratory'].toLowerCase().includes(searchInput.value.toLowerCase())) ||
                    (row['Address'] && row['Address'].toLowerCase().includes(searchInput.value.toLowerCase()))
                ) :
                [...originalData]; // Use a copy of original data if no search

            sortData(dataToSort, column, direction);
        });
    });

    function sortData(data, column, direction) {
        data.sort((a, b) => {
            let valA, valB;

            // Map data-sort attribute to actual CSV column names
            if (column === 'state') {
                valA = a['Member State'] || '';
                valB = b['Member State'] || '';
            } else if (column === 'lab') {
                valA = a['Laboratory'] || '';
                valB = b['Laboratory'] || '';
            } else if (column === 'address') {
                valA = a['Address'] || '';
                valB = b['Address'] || '';
            } else {
                return 0;
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
