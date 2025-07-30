// Function to fetch and parse the CSV and update the response count
async function loadAndCountResponses() {
    const csvFilePath = '../../../data/Observable2020Survey.csv'; // Relative path to your CSV
    const responseCountElement = document.getElementById('response-count');

    // Optional: Display a loading message initially
    if (responseCountElement) {
        responseCountElement.textContent = "Loading...";
    }

    try {
        const response = await fetch(csvFilePath);
        if (!response.ok) {
            throw new Error(`Failed to load data: Server responded with status ${response.status}`);
        }
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true, // Assuming the first row is a header and should not be counted as a response
            skipEmptyLines: true,
            complete: function(results) {
                const rowCount = results.data ? results.data.length : 0; // Ensure data is not null or undefined
                if (responseCountElement) {
                    responseCountElement.textContent = rowCount; // Update the content
                }
            },
            error: function(err) {
                console.error("Error parsing CSV:", err);
                if (responseCountElement) {
                    responseCountElement.textContent = "Error parsing data.";
                }
            }
        });

    } catch (error) {
        console.error('Could not fetch the CSV file:', error);
        if (responseCountElement) {
            responseCountElement.textContent = "Error loading data.";
        }
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', loadAndCountResponses);
