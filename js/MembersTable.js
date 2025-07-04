document.addEventListener('DOMContentLoaded', function() {
    const csvFilePath = 'data/Observable2020Survey.csv';
    const tableBody = d3.select('#table-body-content');

    d3.csv(csvFilePath).then(function(data) {
        console.log("Loaded CSV data:", data); // CRITICAL: Check this output!

        // Filter out any rows that might be empty or invalid (e.g., missing essential data)
        const validData = data.filter(d => d["1.3 Member State"] && (d["1.1 Name of Laboratory"] || d["1.2 Physical Address"]));

        // Sort the data alphabetically by Member State for better readability
        validData.sort((a, b) => {
            const memberStateA = (a["1.3 Member State"] || "").toUpperCase();
            const memberStateB = (b["1.3 Member State"] || "").toUpperCase();
            return memberStateA.localeCompare(memberStateB);
        });

        // Create a row for each object in the validData array
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
                let labName = d["1.1 Name of Laboratory"] || '';
                // Replace actual newline characters (\n) with HTML <br> tags.
                // This will also catch \r\n (Windows style) as \n after D3.js parses it.
                return labName.replace(/\n/g, '<br>');
            });

        rows.append('td')
            .attr('class', 'border border-gray-300 p-3 align-top')
            .html(d => {
                let address = d["1.2 Physical Address"] || '';
                // Replace actual newline characters (\n) with HTML <br> tags for addresses.
                return address.replace(/\n/g, '<br>');
            });

    }).catch(function(error) {
        // Handle any errors during loading
        console.error("Error loading the CSV file:", error);
        tableBody.html('<tr><td colspan="3" class="text-center text-red-500 p-4">Error loading member data. Please try again later.</td></tr>');
    });
});
