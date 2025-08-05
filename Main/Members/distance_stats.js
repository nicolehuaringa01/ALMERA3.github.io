/** distance_stats.js */

document.addEventListener('DOMContentLoaded', () => {
    // Haversine formula to calculate the distance between two points on Earth (in kilometers)
    // using their latitudes and longitudes.
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180; // Convert degrees to radians
        const dLon = (lon2 - lon1) * Math.PI / 180; // Convert degrees to radians
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return distance;
    }

    // Function to fetch and process the ALMERA labs data
    async function processAlmeraLabs() {
        try {
            // Path to your CSV file. Adjust this path if your CSV is located elsewhere.
            // Assuming 'members.html' is in a subfolder and 'data' is at the project root.
            const csvFilePath = '../../data/Observable2020Survey.csv';

            const response = await fetch(csvFilePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();

            // Parse the CSV data using PapaParse
            Papa.parse(csvText, {
                header: true, // Treat the first row as headers
                skipEmptyLines: true, // Ignore empty rows
                complete: function(results) {
                    // Filter out rows that don't have valid Lat/Long coordinates
                    const labs = results.data.filter(d =>
                        d.Lat && d.Long && !isNaN(parseFloat(d.Lat)) && !isNaN(parseFloat(d.Long))
                    ).map(d => ({
                        lat: parseFloat(d.Lat),
                        long: parseFloat(d.Long),
                        country: d['1.3 Member State'] ? d['1.3 Member State'].trim() : 'Unknown',
                        name: d['1.1 Name of Laboratory'] ? d['1.1 Name of Laboratory'].trim() : 'Unnamed Lab',
                        city: d.City ? d.City.trim() : 'Unknown City'
                    }));

                    if (labs.length < 2) {
                        console.warn('Not enough labs with valid coordinates to calculate distances.');
                        document.getElementById('stat-total-labs').textContent = labs.length;
                        document.getElementById('stat-avg-distance').textContent = 'N/A';
                        document.getElementById('stat-shortest-distance').textContent = 'N/A';
                        document.getElementById('stat-longest-distance').textContent = 'N/A';
                        document.getElementById('stat-most-labs-country').textContent = 'N/A';
                        return;
                    }

                    let totalDistance = 0;
                    let distanceCount = 0;
                    let shortestDistance = Infinity;
                    let longestDistance = 0;
                    let shortestPair = null;
                    let longestPair = null;

                    // Calculate pairwise distances between all labs
                    for (let i = 0; i < labs.length; i++) {
                        for (let j = i + 1; j < labs.length; j++) {
                            const lab1 = labs[i];
                            const lab2 = labs[j];

                            const distance = haversineDistance(
                                lab1.lat, lab1.long,
                                lab2.lat, lab2.long
                            );

                            totalDistance += distance;
                            distanceCount++;

                            if (distance < shortestDistance) {
                                shortestDistance = distance;
                                shortestPair = { lab1: lab1, lab2: lab2, distance: distance };
                            }
                            if (distance > longestDistance) {
                                longestDistance = distance;
                                longestPair = { lab1: lab1, lab2: lab2, distance: distance };
                            }
                        }
                    }

                    const averageDistance = distanceCount > 0 ? totalDistance / distanceCount : 0;

                    // Calculate country with the most labs
                    const countryLabCounts = {};
                    labs.forEach(lab => {
                        countryLabCounts[lab.country] = (countryLabCounts[lab.country] || 0) + 1;
                    });

                    let mostLabsCountry = 'N/A';
                    let maxLabs = 0;
                    for (const country in countryLabCounts) {
                        if (countryLabCounts[country] > maxLabs) {
                            maxLabs = countryLabCounts[country];
                            mostLabsCountry = `${country} (${maxLabs} labs)`;
                        }
                    }

                    // Display the statistics in the HTML
                    document.getElementById('stat-total-labs').textContent = labs.length;
                    document.getElementById('stat-avg-distance').textContent = `${averageDistance.toFixed(2)} km`;
                    document.getElementById('stat-shortest-distance').textContent = shortestPair
                        ? `${shortestPair.distance.toFixed(2)} km (between ${shortestPair.lab1.name}, ${shortestPair.lab1.country} and ${shortestPair.lab2.name}, ${shortestPair.lab2.country})`
                        : 'N/A';
                    document.getElementById('stat-longest-distance').textContent = longestPair
                        ? `${longestPair.distance.toFixed(2)} km (between ${longestPair.lab1.name}, ${longestPair.lab1.country} and ${longestPair.lab2.name}, ${longestPair.lab2.country})`
                        : 'N/A';
                    document.getElementById('stat-most-labs-country').textContent = mostLabsCountry;

                    console.log('ALMERA Network Statistics:');
                    console.log(`Total Labs Processed: ${labs.length}`);
                    console.log(`Average Distance: ${averageDistance.toFixed(2)} km`);
                    if (shortestPair) {
                        console.log(`Shortest Distance: ${shortestPair.distance.toFixed(2)} km between ${shortestPair.lab1.name} (${shortestPair.lab1.country}) and ${shortestPair.lab2.name} (${shortestPair.lab2.country})`);
                    }
                    if (longestPair) {
                        console.log(`Longest Distance: ${longestPair.distance.toFixed(2)} km between ${longestPair.lab1.name} (${longestPair.lab1.country}) and ${longestPair.lab2.name} (${longestPair.lab2.country})`);
                    }
                    console.log(`Country with Most Labs: ${mostLabsCountry}`);
                },
                error: function(err, file, inputElem, reason) {
                    console.error('Error parsing CSV:', err, reason);
                    document.getElementById('stat-total-labs').textContent = 'Error';
                    document.getElementById('stat-avg-distance').textContent = 'Error';
                    document.getElementById('stat-shortest-distance').textContent = 'Error';
                    document.getElementById('stat-longest-distance').textContent = 'Error';
                    document.getElementById('stat-most-labs-country').textContent = 'Error';
                }
            });
        } catch (error) {
            console.error('Failed to fetch or process CSV:', error);
            document.getElementById('stat-total-labs').textContent = 'Error';
            document.getElementById('stat-avg-distance').textContent = 'Error';
            document.getElementById('stat-shortest-distance').textContent = 'Error';
            document.getElementById('stat-longest-distance').textContent = 'Error';
            document.getElementById('stat-most-labs-country').textContent = 'Error';
        }
    }

    // Run the processing function when the DOM is ready
    processAlmeraLabs();
});
