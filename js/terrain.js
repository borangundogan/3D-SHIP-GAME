// Terrain generation for 3D Ship War Game
class MountainGenerator {
    constructor(scene, count = 20) {
        this.scene = scene;
        this.count = count; // Increased from 12 to 20 mountains
        this.mountains = [];
        this.mountainColors = [
            0x8B4513, // Brown (base)
            0x696969, // Dim Gray (base)
            0x556B2F, // Dark Olive Green (base)
            0x2F4F4F  // Dark Slate Gray (base)
        ];
        
        // Snow colors (white with slight variations)
        this.snowColors = [
            0xFFFFFF, // Pure white
            0xF0F0F0, // Slightly off-white
            0xE8E8E8, // Light gray
            0xF5F5F5  // Snow white
        ];
        
        // Map dimensions for sector-based placement
        this.mapRadius = 2000; // Increased from 2200 to 3000 for larger map
        this.sectorCount = 12; // Increased from 8 to 12 sectors for more even distribution
        
        // Collision detection properties
        this.collisionEnabled = true; // Flag to enable/disable collision detection
        this.collisionBoundingBoxes = []; // Array to store bounding boxes for collision detection
    }
    
    generate() {
        // Generate mountains across the map using sector-based distribution
        // This ensures mountains are spread evenly around the player
        
        // Calculate mountains per sector (at least 1 per sector)
        const mountainsPerSector = Math.max(1, Math.floor(this.count / this.sectorCount));
        let remainingMountains = this.count - (mountainsPerSector * this.sectorCount);
        
        // Create mountains in each sector
        for (let sector = 0; sector < this.sectorCount; sector++) {
            // Calculate sector angle range
            const sectorAngleStart = (sector / this.sectorCount) * Math.PI * 2;
            const sectorAngleEnd = ((sector + 1) / this.sectorCount) * Math.PI * 2;
            
            // Place the guaranteed mountains per sector
            for (let i = 0; i < mountainsPerSector; i++) {
                this.createMountainInSector(sectorAngleStart, sectorAngleEnd);
            }
            
            // Distribute any remaining mountains randomly
            if (remainingMountains > 0) {
                this.createMountainInSector(sectorAngleStart, sectorAngleEnd);
                remainingMountains--;
            }
        }
        
        // Add additional mountains in the forward direction (Z-axis)
        // This ensures there are always mountains ahead of the player
        this.createForwardMountains();
    }
    
    createForwardMountains() {
        // Add 5-8 mountains specifically in the forward direction (positive Z-axis)
        // with varying distances to create depth
        const forwardMountainCount = 5 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < forwardMountainCount; i++) {
            // Create mountains in a forward-facing arc (between -45° and 45° from forward)
            const angle = (Math.random() * 0.5 - 0.25) * Math.PI; // -45° to 45° arc
            
            // Vary distance from center, ensuring some are very far ahead
            let distance;
            if (i < 2) {
                // First couple mountains are closer (1000-1500 units)
                distance = 1000 + Math.random() * 500;
            } else if (i < 4) {
                // Next couple are mid-range (1500-2200 units)
                distance = 1500 + Math.random() * 700;
            } else {
                // Last ones are far (2200-3000 units)
                distance = 2200 + Math.random() * 800;
            }
            
            // Calculate position (forward is positive Z)
            const x = Math.sin(angle) * distance;
            const z = Math.cos(angle) * distance; // This will be mostly positive (forward)
            
            // Create a larger mountain for better visibility at distance
            const baseRadius = 80 + Math.random() * 200;
            const height = 200 + Math.random() * 500;
            const segments = 16 + Math.floor(Math.random() * 16);
            
            this.createMountainAt(x, z, baseRadius, height, segments);
        }
    }
    
    createMountainAt(x, z, baseRadius, height, segments) {
        // Create mountain geometry
        const mountainGeometry = this.createMountainGeometry(baseRadius, height, segments);
        
        // Create mountain group to hold base and snow cap
        const mountainGroup = new THREE.Group();
        mountainGroup.position.set(x, -20, z); // Start deeper below water for more dramatic emergence
        
        // Random mountain base color
        const baseColorIndex = Math.floor(Math.random() * this.mountainColors.length);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: this.mountainColors[baseColorIndex],
            flatShading: true,
            shininess: 10
        });
        
        // Create base mountain mesh
        const baseMountain = new THREE.Mesh(mountainGeometry, baseMaterial);
        mountainGroup.add(baseMountain);
        
        // Create snow cap (slightly smaller cone on top)
        const snowCapHeight = height * (0.3 + Math.random() * 0.4); // Snow covers 30-70% of mountain height
        const snowCapRadius = baseRadius * 0.95; // Slightly smaller than the base
        const snowCapGeometry = this.createSnowCapGeometry(snowCapRadius, snowCapHeight, segments);
        
        // Random snow color
        const snowColorIndex = Math.floor(Math.random() * this.snowColors.length);
        const snowMaterial = new THREE.MeshPhongMaterial({
            color: this.snowColors[snowColorIndex],
            flatShading: true,
            shininess: 50 // More shiny for snow
        });
        
        // Create snow cap mesh
        const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
        snowCap.position.y = height * 0.5 - snowCapHeight * 0.5; // Position at top of mountain
        mountainGroup.add(snowCap);
        
        // Add to scene
        this.scene.add(mountainGroup);
        
        // Store reference for animation
        this.mountains.push({
            mesh: mountainGroup,
            targetY: 0, // Final position at water level
            speed: 0.05 + Math.random() * 0.4, // More varied rise speeds
            rising: true
        });
        
        // Add some smaller mountains/rocks around the main one
        // Only add surrounding rocks to some mountains (80% chance)
        if (Math.random() < 0.8) {
            this.addSurroundingRocks(x, z, baseRadius);
        }
    }
    
    createMountainInSector(angleStart, angleEnd) {
        // Create a mountain within the specified sector angle range
        const angle = angleStart + (Math.random() * (angleEnd - angleStart));
        
        // Vary distance from center (inner, middle, and outer regions)
        // This creates depth and prevents mountains from forming a ring
        const distanceZone = Math.random();
        let distance;
        
        if (distanceZone < 0.3) {
            // Inner zone (30% chance) - closer mountains
            distance = 300 + Math.random() * 700;
        } else if (distanceZone < 0.7) {
            // Middle zone (40% chance) - mid-range mountains
            distance = 1000 + Math.random() * 800;
        } else {
            // Outer zone (30% chance) - distant mountains
            distance = 1800 + Math.random() * 1200;
        }
        
        const x = Math.sin(angle) * distance;
        const z = Math.cos(angle) * distance;
        
        // Random mountain size with more variation
        const baseRadius = 40 + Math.random() * 180; // More varied sizes
        const height = 100 + Math.random() * 400; // Taller mountains
        const segments = 16 + Math.floor(Math.random() * 16); // Between 16 and 32 segments
        
        this.createMountainAt(x, z, baseRadius, height, segments);
    }
    
    createMountainGeometry(radius, height, segments) {
        // Create a cone geometry for the mountain
        const geometry = new THREE.ConeGeometry(radius, height, segments, 1);
        
        // Modify vertices to make it more mountain-like
        const vertices = geometry.attributes.position;
        
        for (let i = 0; i < vertices.count; i++) {
            const x = vertices.getX(i);
            const y = vertices.getY(i);
            const z = vertices.getZ(i);
            
            // Skip the top vertex
            if (y === height / 2) continue;
            
            // Add more pronounced noise to the sides
            const noise = (Math.random() - 0.5) * (radius * 0.3);
            
            // More noise at the bottom, less at the top
            const noiseScale = 1 - (y + height / 2) / height;
            
            // Add ridges and valleys (sine wave variation based on angle)
            const angle = Math.atan2(z, x);
            const ridgeNoise = Math.sin(angle * segments * 0.25) * radius * 0.1 * noiseScale;
            
            vertices.setX(i, x + noise * noiseScale + ridgeNoise);
            vertices.setZ(i, z + noise * noiseScale + ridgeNoise);
        }
        
        // Update normals
        geometry.computeVertexNormals();
        
        return geometry;
    }
    
    createSnowCapGeometry(radius, height, segments) {
        // Create a cone geometry for the snow cap
        const geometry = new THREE.ConeGeometry(radius, height, segments, 1);
        
        // Modify vertices to make it match the mountain but with smoother snow
        const vertices = geometry.attributes.position;
        
        for (let i = 0; i < vertices.count; i++) {
            const x = vertices.getX(i);
            const y = vertices.getY(i);
            const z = vertices.getZ(i);
            
            // Skip the top vertex
            if (y === height / 2) continue;
            
            // Add less noise for snow (smoother)
            const noise = (Math.random() - 0.5) * (radius * 0.15);
            
            // More noise at the bottom, less at the top
            const noiseScale = 1 - (y + height / 2) / height;
            
            // Add subtle ridges (less pronounced than the base mountain)
            const angle = Math.atan2(z, x);
            const ridgeNoise = Math.sin(angle * segments * 0.25) * radius * 0.05 * noiseScale;
            
            vertices.setX(i, x + noise * noiseScale + ridgeNoise);
            vertices.setZ(i, z + noise * noiseScale + ridgeNoise);
        }
        
        // Update normals
        geometry.computeVertexNormals();
        
        return geometry;
    }
    
    addSurroundingRocks(centerX, centerZ, baseRadius) {
        // Add 2-5 smaller rocks around the main mountain
        const rockCount = 2 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < rockCount; i++) {
            // Position around the main mountain
            const rockDistance = baseRadius * (0.8 + Math.random() * 1.5); // Increased spread
            const rockAngle = Math.random() * Math.PI * 2;
            const rockX = centerX + Math.sin(rockAngle) * rockDistance;
            const rockZ = centerZ + Math.cos(rockAngle) * rockDistance;
            
            // Random rock size (smaller than the mountain)
            const rockRadius = baseRadius * (0.1 + Math.random() * 0.3);
            const rockHeight = rockRadius * (1 + Math.random() * 2);
            
            // Create rock group
            const rockGroup = new THREE.Group();
            rockGroup.position.set(rockX, -10, rockZ); // Start below water
            rockGroup.rotation.y = Math.random() * Math.PI * 2; // Random rotation
            
            // Create rock geometry
            const rockGeometry = new THREE.ConeGeometry(rockRadius, rockHeight, 8, 1);
            
            // Random rock color (similar to mountain colors but with variation)
            const colorIndex = Math.floor(Math.random() * this.mountainColors.length);
            let rockColor = this.mountainColors[colorIndex];
            
            // Add slight variation to the color
            const variation = 0.1 + Math.random() * 0.2; // 10-30% variation
            rockColor = this.adjustColor(rockColor, variation);
            
            const rockMaterial = new THREE.MeshPhongMaterial({
                color: rockColor,
                flatShading: true,
                shininess: 10
            });
            
            // Create rock mesh
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rockGroup.add(rock);
            
            // Add snow cap to some rocks (50% chance)
            if (Math.random() < 0.5) {
                const snowCapHeight = rockHeight * (0.2 + Math.random() * 0.3); // Snow covers 20-50% of rock height
                const snowCapRadius = rockRadius * 0.95; // Slightly smaller than the base
                const snowCapGeometry = new THREE.ConeGeometry(snowCapRadius, snowCapHeight, 8, 1);
                
                // Random snow color
                const snowColorIndex = Math.floor(Math.random() * this.snowColors.length);
                const snowMaterial = new THREE.MeshPhongMaterial({
                    color: this.snowColors[snowColorIndex],
                    flatShading: true,
                    shininess: 50
                });
                
                // Create snow cap mesh
                const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
                snowCap.position.y = rockHeight * 0.5 - snowCapHeight * 0.5; // Position at top of rock
                rockGroup.add(snowCap);
            }
            
            // Add to scene
            this.scene.add(rockGroup);
            
            // Store reference for animation
            this.mountains.push({
                mesh: rockGroup,
                targetY: 0, // Final position at water level
                speed: 0.05 + Math.random() * 0.2, // Slower rise speed than mountains
                rising: true
            });
        }
    }
    
    adjustColor(color, variation) {
        // Convert hex color to RGB
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        // Apply variation
        const factor = 1 - variation + Math.random() * variation * 2;
        
        // Clamp values between 0-255
        const newR = Math.min(255, Math.max(0, Math.floor(r * factor)));
        const newG = Math.min(255, Math.max(0, Math.floor(g * factor)));
        const newB = Math.min(255, Math.max(0, Math.floor(b * factor)));
        
        // Convert back to hex
        return (newR << 16) | (newG << 8) | newB;
    }
    
    // Create a standalone rock formation without a main mountain
    createStandaloneRocks() {
        // Use sector-based placement for standalone rocks too
        const sector = Math.floor(Math.random() * this.sectorCount);
        const sectorAngleStart = (sector / this.sectorCount) * Math.PI * 2;
        const sectorAngleEnd = ((sector + 1) / this.sectorCount) * Math.PI * 2;
        const angle = sectorAngleStart + (Math.random() * (sectorAngleEnd - sectorAngleStart));
        
        // Vary distance from center (inner, middle, and outer regions)
        const distanceZone = Math.random();
        let distance;
        
        if (distanceZone < 0.3) {
            // Inner zone
            distance = 300 + Math.random() * 700;
        } else if (distanceZone < 0.7) {
            // Middle zone
            distance = 1000 + Math.random() * 800;
        } else {
            // Outer zone
            distance = 1800 + Math.random() * 1200;
        }
        
        const centerX = Math.sin(angle) * distance;
        const centerZ = Math.cos(angle) * distance;
        
        // Add 3-6 rocks in a cluster
        const rockCount = 3 + Math.floor(Math.random() * 4);
        const clusterRadius = 30 + Math.random() * 70;
        
        for (let i = 0; i < rockCount; i++) {
            // Position within the cluster
            const rockDistance = Math.random() * clusterRadius;
            const rockAngle = Math.random() * Math.PI * 2;
            const rockX = centerX + Math.sin(rockAngle) * rockDistance;
            const rockZ = centerZ + Math.cos(rockAngle) * rockDistance;
            
            // Random rock size
            const rockRadius = 10 + Math.random() * 30;
            const rockHeight = rockRadius * (1 + Math.random() * 2);
            
            // Create rock group
            const rockGroup = new THREE.Group();
            rockGroup.position.set(rockX, -15, rockZ);
            rockGroup.rotation.y = Math.random() * Math.PI * 2;
            
            // Create rock geometry
            const rockGeometry = new THREE.ConeGeometry(rockRadius, rockHeight, 8, 1);
            
            // Random rock color
            const colorIndex = Math.floor(Math.random() * this.mountainColors.length);
            let rockColor = this.mountainColors[colorIndex];
            
            // Add variation to the color
            const variation = 0.1 + Math.random() * 0.2;
            rockColor = this.adjustColor(rockColor, variation);
            
            const rockMaterial = new THREE.MeshPhongMaterial({
                color: rockColor,
                flatShading: true,
                shininess: 10
            });
            
            // Create rock mesh
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rockGroup.add(rock);
            
            // Add snow cap to some rocks (40% chance)
            if (Math.random() < 0.4) {
                const snowCapHeight = rockHeight * (0.2 + Math.random() * 0.3);
                const snowCapRadius = rockRadius * 0.95;
                const snowCapGeometry = new THREE.ConeGeometry(snowCapRadius, snowCapHeight, 8, 1);
                
                // Random snow color
                const snowColorIndex = Math.floor(Math.random() * this.snowColors.length);
                const snowMaterial = new THREE.MeshPhongMaterial({
                    color: this.snowColors[snowColorIndex],
                    flatShading: true,
                    shininess: 50
                });
                
                // Create snow cap mesh
                const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
                snowCap.position.y = rockHeight * 0.5 - snowCapHeight * 0.5;
                rockGroup.add(snowCap);
            }
            
            // Add to scene
            this.scene.add(rockGroup);
            
            // Store reference for animation
            this.mountains.push({
                mesh: rockGroup,
                targetY: 0,
                speed: 0.05 + Math.random() * 0.15,
                rising: true
            });
        }
    }
    
    // Check if a ship collides with any mountain
    checkShipCollision(ship) {
        if (!this.collisionEnabled || !ship || !ship.boundingBox) return false;
        
        // Only check mountains that have finished rising
        for (let i = 0; i < this.mountains.length; i++) {
            const mountain = this.mountains[i];
            
            // Skip mountains that are still rising
            if (mountain.rising) continue;
            
            // Create or update bounding box for this mountain if needed
            if (!mountain.boundingBox) {
                // Create a more precise bounding box that's smaller than the visual mountain
                // This helps prevent collisions from triggering too early
                const tempBox = new THREE.Box3().setFromObject(mountain.mesh);
                
                // Get the dimensions of the mountain
                const size = new THREE.Vector3();
                tempBox.getSize(size);
                
                // Create a center point
                const center = new THREE.Vector3();
                tempBox.getCenter(center);
                
                // Create a smaller bounding box (70% of original size)
                // This makes the collision area smaller than the visual mountain
                const shrinkFactor = 0.40;
                const shrunkSize = size.multiplyScalar(shrinkFactor);
                
                // Adjust the height to only cover the base of the mountain, not the snow cap
                // This prevents collisions with the snow part of the mountain
                const heightReduction = 0.6; // Only use 60% of the height, focusing on the base
                
                // Create the new bounding box
                mountain.boundingBox = new THREE.Box3(
                    new THREE.Vector3(
                        center.x - shrunkSize.x / 2,
                        center.y - shrunkSize.y / 2, // Keep the bottom of the box
                        center.z - shrunkSize.z / 2
                    ),
                    new THREE.Vector3(
                        center.x + shrunkSize.x / 2,
                        center.y - shrunkSize.y / 2 + (shrunkSize.y * heightReduction), // Reduce the height
                        center.z + shrunkSize.z / 2
                    )
                );
                
                // Store the original visual bounds for debugging
                mountain.visualBounds = tempBox;
            } else {
                // Get the current visual bounds
                const tempBox = new THREE.Box3().setFromObject(mountain.mesh);
                
                // Get the dimensions of the mountain
                const size = new THREE.Vector3();
                tempBox.getSize(size);
                
                // Create a center point
                const center = new THREE.Vector3();
                tempBox.getCenter(center);
                
                // Update the collision box to be smaller than the visual mountain
                const shrinkFactor = 0.45;
                const shrunkSize = size.multiplyScalar(shrinkFactor);
                
                // Adjust the height to only cover the base of the mountain, not the snow cap
                const heightReduction = 0.6; // Only use 60% of the height, focusing on the base
                
                mountain.boundingBox.set(
                    new THREE.Vector3(
                        center.x - shrunkSize.x / 2,
                        center.y - shrunkSize.y / 2, // Keep the bottom of the box
                        center.z - shrunkSize.z / 2
                    ),
                    new THREE.Vector3(
                        center.x + shrunkSize.x / 2,
                        center.y - shrunkSize.y / 2 + (shrunkSize.y * heightReduction), // Reduce the height
                        center.z + shrunkSize.z / 2
                    )
                );
                
                // Store the original visual bounds for debugging
                mountain.visualBounds = tempBox;
            }
            
            // Check for collision with the smaller bounding box
            if (ship.boundingBox.intersectsBox(mountain.boundingBox)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Get all mountains for collision detection
    getMountains() {
        return this.mountains;
    }
    
    update(delta) {
        // Animate mountains rising from the sea
        for (let i = 0; i < this.mountains.length; i++) {
            const mountain = this.mountains[i];
            
            if (mountain.rising) {
                const mesh = mountain.mesh;
                
                // Move mountain up
                mesh.position.y += mountain.speed;
                
                // Check if reached target height
                if (mesh.position.y >= mountain.targetY) {
                    mesh.position.y = mountain.targetY;
                    mountain.rising = false;
                    
                    // Create bounding box for collision detection once mountain has risen
                    mountain.boundingBox = new THREE.Box3().setFromObject(mountain.mesh);
                }
            }
        }
    }
}

// Make available globally
window.MountainGenerator = MountainGenerator; 