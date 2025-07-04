document.addEventListener('DOMContentLoaded', function() {
    // Path to your CSV file
    const csvFilePath = 'data/Observable2020Survey.csv';
    const tableBody = d3.select('#table-body-content'); // Select the tbody by its ID

    // Use d3.csv to load the data
    d3.csv(csvFilePath).then(function(data) {
        // Log the data to console to inspect its structure and column names
        console.log("Loaded CSV data:", data);

        // Filter out any rows that might be empty or invalid if necessary
        // For example, if you have header-like rows or empty lines at the end
        const validData = data.filter(d => d["1.3 Member State"] && d["1.1 Name of Laboratory"]);

        // Sort the data alphabetically by Member State for better readability (optional)
        validData.sort((a, b) => {
            const memberStateA = a["1.3 Member State"] ? a["1.3 Member State"].toUpperCase() : "";
            const memberStateB = b["1.3 Member State"] ? b["1.3 Member State"].toUpperCase() : "";
            return memberStateA.localeCompare(memberStateB);
        });


        // Create a row for each object in the data array
        const rows = tableBody.selectAll('tr')
            .data(validData)
            .enter()
            .append('tr');

        // Append cells (td) to each row and populate with data
        rows.append('td')
            .attr('class', 'border border-gray-300 p-3 align-top')
            .text(d => d["1.3 Member State"] || ''); // Use || '' to handle potential undefined values

        rows.append('td')
            .attr('class', 'border border-gray-300 p-3 align-top')
            .html(d => {
                // Split by comma or <br> to format address, if desired.
                // Assuming "1.1 Name of Laboratory" might contain <br> or just be plain text.
                return d["1.1 Name of Laboratory"] ? d["1.1 Name of Laboratory"].replace(/,/g, '<br>') : '';
            });

        rows.append('td')
            .attr('class', 'border border-gray-300 p-3 align-top')
            .html(d => {
                // Replace commas with <br> for multi-line address display
                return d["1.2 Physical Address"] ? d["1.2 Physical Address"].replace(/,/g, '<br>') : '';
            });

    }).catch(function(error) {
        // Handle any errors during loading
        console.error("Error loading the CSV file:", error);
        tableBody.html('<tr><td colspan="3" class="text-center text-red-500 p-4">Error loading member data. Please try again later.</td></tr>');
    });
});
