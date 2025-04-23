import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { vec3 } from '@react-three/rapier';
import { PlayerEffectsBoxParticle } from './PlayerEffectsBoxParticle';
import { useFixedFrameUpdate } from '../hook/useFixedFrameUpdate';

interface ParticlesProps {
    id: number;
    enabled: boolean;
    position: THREE.Vector3;
    targetPosition: THREE.Vector3;
    boxSize: number;
    type: "white" | "black";
}

export const PlayerMoveEffects = () => {
    const playerEffectsGroupRef = useRef<THREE.Group>(null);
    const particles = useRef<ParticlesProps[]>([]);
    const PARTICLES_COUNT = 20;
    // Constants for particle properties
    const BOX_MIN_SIZE = 0.017;
    const BOX_MAX_SIZE = 0.026;
    const SPAWN_RANGE = 0.08;
    const SPAWN_RANGE_Y = SPAWN_RANGE / 8;
    const TARGET_RANGE = 0.3;
    const TARGET_RANGE_Y = TARGET_RANGE / 8;
    const ROTATION_SPEED = 0.075;
    const OPACITY_DECAY = 0.018;
    const LERP_FACTOR = 0.01;
    
    const particlesIndex = useRef<number>(-1);
    // Reusable Vector3 objects to reduce garbage collection
    const tempVec3Start = new THREE.Vector3();
    const tempVec3Target = new THREE.Vector3();
    // Create a particle at the given position
    const createParticle = (position: THREE.Vector3) => {
        // Increment and wrap the particle index
        particlesIndex.current = (particlesIndex.current + 1) % PARTICLES_COUNT;
        
        // Get group early to avoid unnecessary computation if not available
        const group = playerEffectsGroupRef.current?.getObjectByName(particlesIndex.current.toString());
        if (!group) return;
        
        // Calculate random start and target positions using reusable vectors
        tempVec3Start.set(
            position.x + (Math.random() - 0.5) * SPAWN_RANGE,
            position.y + (Math.random() - 0.5) * SPAWN_RANGE_Y,
            position.z + (Math.random() - 0.5) * SPAWN_RANGE
        );
        
        tempVec3Target.set(
            position.x + (Math.random() - 0.5) * TARGET_RANGE,
            position.y + (Math.random() - 0.5) * TARGET_RANGE_Y,
            position.z + (Math.random() - 0.5) * TARGET_RANGE
        );
        
        // Update particle properties
        const particle = particles.current[particlesIndex.current];
        particle.enabled = true;
        particle.position.copy(tempVec3Start);
        particle.targetPosition.copy(tempVec3Target);
        
        // Update group properties
        group.visible = true;
        group.position.copy(tempVec3Start);
    };

    useFixedFrameUpdate((state, delta) => {
        const group = playerEffectsGroupRef.current;
        if (!group) return;
        
        particles.current.forEach((particle) => {
            if (!particle.enabled) return;
            
            const mesh = group.getObjectByName(`${particle.id}`);
            if (!mesh) return;
            
            // Update position using lerp
            mesh.position.lerp(particle.targetPosition, LERP_FACTOR);
            
            // Apply random rotation
            mesh.rotation.y += Math.random() * ROTATION_SPEED;
            
            // Update opacity
            if (mesh.children.length > 0) {
                const material = (mesh.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
                if (material) {
                    material.opacity -= OPACITY_DECAY;
                    
                    // Reset particle when opacity is low enough
                    if (material.opacity <= -0.02) {
                        particle.enabled = false;
                        mesh.visible = false;
                        material.opacity = 1;
                    }
                }
            }
        });
    });

    // Initialize particle pool
    const initParticles = () => {
        const group = playerEffectsGroupRef.current;
        if (!group) return;
        
        // Preallocate vector3 objects for particles
        const zeroVec = new THREE.Vector3(0, 0, 0);
        
        for (let i = 0; i < PARTICLES_COUNT; i++) {
            const randomSize = BOX_MIN_SIZE + (BOX_MAX_SIZE - BOX_MIN_SIZE) * Math.random();
            const type = Math.random() > 0.5 ? "white" : "black";
            
            // Create particle with reusable vector3 objects
            particles.current.push({
                id: i,
                enabled: false,
                position: new THREE.Vector3(),
                targetPosition: new THREE.Vector3(),
                boxSize: randomSize,
                type: type
            });
            
            // Add particle to group
            group.add(
                PlayerEffectsBoxParticle({
                    id: `${i}`,
                    type: type,
                    position: zeroVec,
                    boxSize: [randomSize, randomSize, randomSize]
                })
            );
        }
    }

    useEffect(() => {
        // Subscribe to particle spawn events
        const spawnPlayerMovementParticlesToken = PubSub.subscribe(
            'spawnPlayerMovementParticles', 
            (msg: any, data: { position: THREE.Vector3 }) => {
                // Generate 1-3 particles per event
                const count = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < count; i++) {
                    createParticle(data.position);
                }
            }
        );
        
        // Initialize particle system
        if (playerEffectsGroupRef.current) {
            playerEffectsGroupRef.current.clear();
            initParticles();
        }
        
        // Cleanup on component unmount
        return () => {
            PubSub.unsubscribe(spawnPlayerMovementParticlesToken);
        };
    }, []);

    return (
        <>
            <group ref={playerEffectsGroupRef}>
            </group>
        </>
    );
}
