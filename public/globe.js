// Fetch hacker data from the JSON file
fetch('./public/data/final_hacker_data.json')
    .then(response => response.json())
    .then(hackerData => {
        console.log('Hacker Data:', hackerData);

        // Assign random lat/long for hacker1 and hacker2
        hackerData.forEach((hacker) => {
            hacker.hacker1_latLong = getRandomLatLong();
            hacker.hacker2_latLong = getRandomLatLong();
        });

        // Plot each hacker on the globe
        hackerData.forEach((hacker) => {
            // Plot hacker1
            const hacker1City = latLongToVector3(hacker.hacker1_latLong.lat, hacker.hacker1_latLong.long, 5, 0.1);
            const hacker1DotGeometry = new THREE.SphereGeometry(0.05, 32, 32);
            const hacker1DotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });  // Red for hacker1
            const hacker1Dot = new THREE.Mesh(hacker1DotGeometry, hacker1DotMaterial);
            hacker1Dot.position.copy(hacker1City);
            scene.add(hacker1Dot);

            // Plot hacker2
            const hacker2City = latLongToVector3(hacker.hacker2_latLong.lat, hacker.hacker2_latLong.long, 5, 0.1);
            const hacker2DotGeometry = new THREE.SphereGeometry(0.05, 32, 32);
            const hacker2DotMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });  // Blue for hacker2
            const hacker2Dot = new THREE.Mesh(hacker2DotGeometry, hacker2DotMaterial);
            hacker2Dot.position.copy(hacker2City);
            scene.add(hacker2Dot);

            // Draw connection (arch) between hacker1 and hacker2
            createArch(hacker1City, hacker2City, 1);  // Arch height is 1
        });
    })
    .catch(err => console.log('Error loading data:', err));

// Helper function to randomly generate lat/long
function getRandomLatLong() {
    const lat = (Math.random() * 180) - 90;  // Latitude: -90 to +90
    const long = (Math.random() * 360) - 180;  // Longitude: -180 to +180
    return { lat, long };
}

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('globe-container').appendChild(renderer.domElement);

// Create the globe
const geometry = new THREE.SphereGeometry(5, 32, 32);
const material = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load('path/to/world_map_texture.jpg')
});
const globe = new THREE.Mesh(geometry, material);
scene.add(globe);

// Helper function to convert lat/long to 3D vector for plotting on the globe
function latLongToVector3(lat, lon, radius, height) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -((radius + height) * Math.sin(phi) * Math.cos(theta));
    const y = (radius + height) * Math.cos(phi);
    const z = (radius + height) * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

// Function to create an arch between two points (start, end)
function createArch(start, end, height) {
    const midPoint = start.clone().lerp(end, 0.5);
    midPoint.setLength(midPoint.length() + height);  // Raise midpoint for arch

    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);

    // Create a tube along the curve
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.02, 8, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });  // Green for the arch
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(tube);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.001;  // Rotate the globe slowly
    renderer.render(scene, camera);
}
animate();