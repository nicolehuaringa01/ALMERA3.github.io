/**
 * distance_stats.js
 *
 * This script calculates and displays various statistics about the ALMERA network laboratories, including:
 * - Total number of labs processed.
 * - Average Closest Neighbor Distance: The average of the shortest distances from each lab to its closest neighbor.
 * - Shortest Distance Between Any Two Labs: The absolute shortest distance found in the entire network.
 * - The "Most Remote" Lab: The lab whose *closest* neighbor is the furthest away (Point Nemo analogy).
 * - The Country with the Most Labs.
 *
 * It expects a CSV file with 'Lat', 'Long', and '1.3 Member State' columns.
 */

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
            // Updated path to your CSV file as per your request.
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
                        document.getElementById('stat-most-remote-lab').textContent = 'N/A';
                        document.getElementById('stat-most-labs-country').textContent = 'N/A';
                        return;
                    }

                    let shortestOverallDistance = Infinity;
                    let shortestOverallPair = null;

                    let mostRemoteLab = null; // This will store the lab that is "most remote"
                    let maxMinDistance = 0; // This will store the largest minimum distance found

                    let sumOfClosestNeighborDistances = 0; // New variable for the new average
                    let countOfLabsWithNeighbors = 0;

                    // Calculate pairwise distances and find the most remote lab (based on closest neighbor)
                    for (let i = 0; i < labs.length; i++) {
                        const currentLab = labs[i];
                        let minDistanceToAnyOtherLab = Infinity;
                        let closestNeighbor = null;

                        for (let j = 0; j < labs.length; j++) {
                            if (i === j) continue; // Don't calculate distance to itself

                            const otherLab = labs[j];
                            const distance = haversineDistance(
                                currentLab.lat, currentLab.long,
                                otherLab.lat, otherLab.long
                            );

                            // For finding the overall shortest distance between any two labs
                            if (i < j) { // Only count each pair once for overall shortest
                                if (distance < shortestOverallDistance) {
                                    shortestOverallDistance = distance;
                                    shortestOverallPair = { lab1: currentLab, lab2: otherLab, distance: distance };
                                }
                            }

                            // For finding the closest neighbor to the currentLab
                            if (distance < minDistanceToAnyOtherLab) {
                                minDistanceToAnyOtherLab = distance;
                                closestNeighbor = otherLab;
                            }
                        }

                        // After checking all other labs for currentLab
                        if (closestNeighbor) { // Ensure a closest neighbor was found (i.e., more than 1 lab exists)
                            sumOfClosestNeighborDistances += minDistanceToAnyOtherLab;
                            countOfLabsWithNeighbors++;

                            // Check for the most remote lab (based on its closest neighbor)
                            if (minDistanceToAnyOtherLab > maxMinDistance) {
                                maxMinDistance = minDistanceToAnyOtherLab;
                                mostRemoteLab = {
                                    lab: currentLab,
                                    closestNeighbor: closestNeighbor,
                                    minDistance: minDistanceToAnyOtherLab
                                };
                            }
                        }
                    }

                    // Calculate the new average: average of the shortest distances to a neighbor
                    const averageClosestNeighborDistance = countOfLabsWithNeighbors > 0
                        ? sumOfClosestNeighborDistances / countOfLabsWithNeighbors
                        : 0;

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
                    document.getElementById('stat-avg-distance').textContent = `${averageClosestNeighborDistance.toFixed(2)} km`;
                    document.getElementById('stat-shortest-distance').textContent = shortestOverallPair
                        ? `${shortestOverallPair.distance.toFixed(2)} km (between ${shortestOverallPair.lab1.name}, ${shortestOverallPair.lab1.country} and ${shortestOverallPair.lab2.name}, ${shortestOverallPair.lab2.country})`
                        : 'N/A';
                    document.getElementById('stat-most-remote-lab').textContent = mostRemoteLab
                        ? `${mostRemoteLab.lab.name}, ${mostRemoteLab.lab.country} (Closest lab: ${mostRemoteLab.closestNeighbor.name}, ${mostRemoteLab.closestNeighbor.country} at ${mostRemoteLab.minDistance.toFixed(2)} km)`
                        : 'N/A';
                    document.getElementById('stat-most-labs-country').textContent = mostLabsCountry;

                    console.log('ALMERA Network Statistics:');
                    console.log(`Total Labs Processed: ${labs.length}`);
                    console.log(`Average Closest Neighbor Distance: ${averageClosestNeighborDistance.toFixed(2)} km (Average gap between a lab and its nearest neighbor)`);
                    if (shortestOverallPair) {
                        console.log(`Shortest Distance Between Any Two Labs: ${shortestOverallPair.distance.toFixed(2)} km between ${shortestOverallPair.lab1.name} (${shortestOverallPair.lab1.country}) and ${shortestOverallPair.lab2.name} (${shortestOverallPair.lab2.country})`);
                    }
                    if (mostRemoteLab) {
                        console.log(`Most Remote Lab (Point Nemo style): ${mostRemoteLab.lab.name} (${mostRemoteLab.lab.country}). Its closest neighbor is ${mostRemoteLab.closestNeighbor.name} (${mostRemoteLab.closestNeighbor.country}) at ${mostRemoteLab.minDistance.toFixed(2)} km.`);
                    }
                    console.log(`Country with Most Labs: ${mostLabsCountry}`);
                },
                error: function(err, file, inputElem, reason) {
                    console.error('Error parsing CSV:', err, reason);
                    document.getElementById('stat-total-labs').textContent = 'Error';
                    document.getElementById('stat-avg-distance').textContent = 'Error';
                    document.getElementById('stat-shortest-distance').textContent = 'Error';
                    document.getElementById('stat-most-remote-lab').textContent = 'Error';
                    document.getElementById('stat-most-labs-country').textContent = 'Error';
                }
            });
        } catch (error) {
            console.error('Failed to fetch or process CSV:', error);
            document.getElementById('stat-total-labs').textContent = 'Error';
            document.getElementById('stat-avg-distance').textContent = 'Error';
            document.getElementById('stat-shortest-distance').textContent = 'Error';
            document.getElementById('stat-most-remote-lab').textContent = 'Error';
            document.getElementById('stat-most-labs-country').textContent = 'Error';
        }
    }

    // Run the processing function when the DOM is ready
    processAlmeraLabs();
});

