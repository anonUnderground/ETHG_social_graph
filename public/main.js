fetch('../data/final_hacker_data.json')
    .then(response => response.json())
    .then(data => {
        console.log('Raw Data loaded:', data); // Log raw data

        // Assuming data is already in the correct structure
        const rows = data;

        console.log('Processed Data:', rows); // Log the processed data

        // Extract the min and max connection counts dynamically from hacker1_count
        const hacker1Counts = rows.map(row => row.hacker1_count);
        const minConnections = Math.min(...hacker1Counts);
        const maxConnections = Math.max(...hacker1Counts);

        console.log('Min Connections:', minConnections);
        console.log('Max Connections:', maxConnections);

        // Process the data
        const nodes = {};
        const edges = [];

        // Function to map connection_count to size
        const getNodeSize = (connection_count) => {
            const minSize = 1;  // Minimum node size
            const maxSize = 30;  // Maximum node size

            // Normalize the size between min and max, then scale up
            return Math.max(minSize, (connection_count - minConnections) / (maxConnections - minConnections) * (maxSize - minSize) + minSize) * 5;
        };

        // Create nodes and edges from the dataset
        rows.forEach((entry) => {
            const hacker1 = entry.hacker1;
            const hacker2 = entry.hacker2;
            const hacker1_count = entry.hacker1_count; // count for hacker1
            const hacker2_count = entry.hacker2_count; // count for hacker2

            // Add nodes for hacker1 if not already present
            if (hacker1 && !nodes[hacker1]) {
                nodes[hacker1] = {
                    id: hacker1,
                    label: hacker1,  // Keep hacker ID as label
                    size: getNodeSize(hacker1_count), // Set dynamic size based on hacker1_count
                    title: `Connections: ${hacker1_count}`, // Display the hacker1_count in the middle
                    font: {
                        multi: true,
                        size: 14,
                        color: '#ffffff',
                        face: 'Arial',
                        vadjust: -20 // Adjust vertical alignment
                    }
                };
            }

            // Add nodes for hacker2 if not already present
            if (hacker2 && hacker2 !== null && !nodes[hacker2]) {
                nodes[hacker2] = {
                    id: hacker2,
                    label: hacker2,  // Keep hacker ID as label
                    size: getNodeSize(hacker2_count), // Set dynamic size based on hacker2_count
                    title: `Connections: ${hacker2_count}`, // Display the hacker2_count in the middle
                    font: {
                        multi: true,
                        size: 14,
                        color: '#ffffff',
                        face: 'Arial',
                        vadjust: -20 // Adjust vertical alignment
                    }
                };
            }

            // Create an edge if hacker2 exists (ignoring None or null values)
            if (hacker2 && hacker2 !== null) {
                edges.push({ from: hacker1, to: hacker2 });
            }
        });

        // Convert nodes object to an array
        const nodesArray = Object.values(nodes);

        // Create a network
        const container = document.getElementById('network');
        const dataNetwork = {
            nodes: new vis.DataSet(nodesArray),
            edges: new vis.DataSet(edges)
        };
        const options = {
            nodes: {
                shape: 'dot',
                font: {
                    size: 14,
                    color: '#ffffff',
                    face: 'Arial',
                    multi: true,  // Enables multi-line text (for labels and counts)
                    vadjust: 0  // Adjust the vertical alignment
                },
                borderWidth: 2
            },
            edges: {
                width: 2,
                color: 'gray'
            },
            physics: {
                enabled: true,
                solver: 'forceAtlas2Based',
                stabilization: {
                    enabled: false,
                    iterations: 150
                },
                minVelocity: 0.5,
                maxVelocity: 50,
                timestep: 0.35
            }
        };

        // Initialize the network
        const network = new vis.Network(container, dataNetwork, options);

        // ====== Leaderboard Logic =======
        const uniqueHacker1 = Array.from(new Set(rows.map(row => row.hacker1)))
            .map(hacker1 => {
                return rows.find(row => row.hacker1 === hacker1);
            });

        const top5Hackers = uniqueHacker1
            .sort((a, b) => b.hacker1_count - a.hacker1_count)
            .slice(0, 5);

        // Populate leaderboard
        const leaderboard = document.getElementById('leaderboard');
        leaderboard.innerHTML = ''; // Clear leaderboard

        top5Hackers.forEach((hacker, index) => {
            const listItem = document.createElement('li');
            listItem.id = `leaderboard-item-${index}`; // Add ID for each item
            listItem.innerHTML = `${index + 1}. ${hacker.hacker1} - Connections: ${hacker.hacker1_count}`;
            leaderboard.appendChild(listItem);
        });

        let currentHackerIndex = 0;

        function zoomToNode(nodeId, zoomFactor, duration, onComplete) {
            const position = network.getPositions([nodeId])[nodeId];

            // Smooth zoom effect
            network.moveTo({
                position,
                scale: zoomFactor,
                animation: {
                    duration: duration,
                    easingFunction: "easeInOutQuad"
                }
            });

            if (onComplete) {
                setTimeout(onComplete, duration); // Trigger onComplete after zoom
            }
        }

        function moveNodeSmoothly(nodeId, startPos, endPos, duration, onComplete) {
            const startTime = performance.now();

            function step(timestamp) {
                const elapsed = timestamp - startTime;
                const t = Math.min(elapsed / duration, 1); // Time progression from 0 to 1

                const x = startPos.x + (endPos.x - startPos.x) * t;
                const y = startPos.y + (endPos.y - startPos.y) * t;

                network.moveNode(nodeId, x, y);

                if (t < 1) {
                    requestAnimationFrame(step);
                } else if (onComplete) {
                    onComplete();
                }
            }

            requestAnimationFrame(step);
        }

        function cycleTopNodes() {
            const currentHacker = top5Hackers[currentHackerIndex];
            const hackerId = currentHacker.hacker1;

            // Highlight and select the node
            network.selectNodes([hackerId]);

            // Highlight the corresponding leaderboard item
            const allItems = document.querySelectorAll('#leaderboard li');
            allItems.forEach(item => item.classList.remove('highlight'));
            const currentLeaderboardItem = document.getElementById(`leaderboard-item-${currentHackerIndex}`);
            currentLeaderboardItem.classList.add('highlight');

            // Get current position of the node
            const position = network.getPositions([hackerId])[hackerId];
            const distance = Math.floor(Math.random() * 300) + 500;
            const directionX = (Math.random() < 0.5 ? -1 : 1) * distance;
            const directionY = (Math.random() < 0.5 ? -1 : 1) * distance;

            const newPosition = {
                x: position.x + directionX,
                y: position.y + directionY
            };

            // Zoom in, wait 3 seconds, zoom out, then start moving the node
            zoomToNode(hackerId, 1.25, 3000, () => {
                // Zoom back out to normal (0.25)
                zoomToNode(hackerId, 0.25, 3000, () => {
                    // Move the node after zooming out
                    moveNodeSmoothly(hackerId, position, newPosition, 6000, () => {
                        currentHackerIndex = (currentHackerIndex + 1) % top5Hackers.length;
                    });
                });
            });
        }

        // Cycle through the top nodes every 12 seconds
        setInterval(cycleTopNodes, 15000);

    })
    .catch(err => console.log('Error loading data: ', err));