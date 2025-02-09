import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import React from "react";
import { useFixedFrameUpdate } from "../hook/useFixedFrameUpdate";


const HitExplosionParticle = ({ id, count = 100, spread = 1, size = 1, speedFactor = 2 }: {
    id: string;
    count?: number;
    spread?: number;
    size?: number;
    speedFactor?: number;
}) => {

    // Shader Material
    const ExplosionShaderMaterial = {
        uniforms: {
            uTime: { value: 0 },
            uSize: { value: 1.0 },
            uOpacity: { value: 1.0 },
            uSpread: { value: 5.0 },
        },
        vertexShader: `
      uniform float uTime;
      uniform float uSpread;
  
      attribute float aScale;
      attribute vec3 aRandomDirection;
      attribute float aSpeed;

      varying float vAlpha;
  
        void main() {
            // Calculate new position based on time, direction, and speed
            vec3 newPosition = position + aRandomDirection * uSpread * uTime * aSpeed;

            // Scale size over time
            float scale = aScale * (1.0 - uTime * 0.78);
            vAlpha = 1.0 - uTime;
            // Set the final position and size
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            gl_PointSize = scale * 10.0; // Adjust size multiplier for screen resolution
        }
    `,
        fragmentShader: `
      uniform float uOpacity;
      varying float vAlpha;
  
      void main() {
        // Create a smooth circular gradient for the particle
        float distanceToCenter = length(gl_PointCoord - vec2(0.5));
        float alpha = smoothstep(0.5, 0.0, distanceToCenter);
        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * vAlpha * uOpacity);
      }
    `,
    };

    const pointsRef = useRef<any>(null);
    const materialRef = useRef<any>(null);

    // Generate random positions and directions for particles
    const particles = useMemo(() => {
        const positions = [];
        const randomDirections = [];
        const scales = [];
        const speeds = []
        for (let i = 0; i < count; i++) {
            positions.push(0, 0, 0); // Start at the center

            // Generate random direction in 2D plane (XY plane)
            const angle = Math.random() * Math.PI * 2; // Random angle in radians
            const x = Math.cos(angle); // X component
            const y = Math.sin(angle); // Y component
            const z = 0; // Z component fixed to 0 for flat plane

            randomDirections.push(x, y, z);
            scales.push(Math.random()); // Random scale for each particle

            // Generate random speed for each particle
            speeds.push(1 + Math.random() * 2);
        }

        return {
            positions: new Float32Array(positions),
            randomDirections: new Float32Array(randomDirections),
            scales: new Float32Array(scales),
            speeds: new Float32Array(speeds), // Include speeds
        };
    }, [count, spread, size]);

    // Update time uniform
    useFixedFrameUpdate((state, delta) => {
        if (pointsRef.current.visible) {
            if (materialRef.current.uniforms.uTime.value > 1) {
                pointsRef.current.visible = false;
            } else {
                materialRef.current.uniforms.uTime.value += delta * speedFactor
            }
        }
    });

    useEffect(() => {
        const startHitExplosionParticleToken = PubSub.subscribe(id, (msg: string, data: { position: THREE.Vector3 }) => {
            pointsRef.current.visible = true;
            pointsRef.current.position.copy(data.position)
            materialRef.current.uniforms.uTime.value = 0
        })
        return () => {
            PubSub.unsubscribe(startHitExplosionParticleToken)
        }
    }, [])

    return (<points rotation={[-Math.PI / 2, 0, 0]} visible={false} ref={pointsRef}>
        <bufferGeometry>
            {/* Particle positions */}
            <bufferAttribute
                name="attributes-position"
                attach="attributes-position"
                args={[particles.positions, 3]} // Pass array and item size
            />
            {/* Random directions */}
            <bufferAttribute
                name="attributes-aRandomDirection"
                attach="attributes-aRandomDirection"
                args={[particles.randomDirections, 3]} // Pass array and item size
            />
            {/* Scales */}
            <bufferAttribute
                name="attributes-aScale"
                attach="attributes-aScale"
                args={[particles.scales, 1]} // Pass array and item size
            />
            {/* Speeds */}
            <bufferAttribute
                name="attributes-aSpeed"
                attach="attributes-aSpeed"
                args={[particles.speeds, 1]} // 每个粒子只有一个速度值
            />
        </bufferGeometry>
        <shaderMaterial
            ref={materialRef}
            args={[ExplosionShaderMaterial]}
            uniforms-uSize-value={size}
            uniforms-uSpread-value={spread}
            uniforms-uOpacity-value={1.0}
            transparent
        />
    </points>
    );
};


export const HitExplosionParticleEffects = () => {

    const groupRef = useRef<any>(null);
    const HIT_EXPLOSION_PARTICLE_COUNT = 10
    const HIT_EXPLOSION_SMALL_PARTICLE_COUNT = 10
    const hitExplosionParticleIndex = useRef<number>(0)
    const hitExplosionSmallParticleIndex = useRef<number>(0)

    useEffect(() => {
        const hitExplosionParticleToken = PubSub.subscribe('hitExplosionParticle', (msg: string, data: { position: THREE.Vector3 }) => {
            PubSub.publish(`startHitExplosionParticle_${hitExplosionParticleIndex.current}`, {
                position: data.position
            });
            hitExplosionParticleIndex.current = (hitExplosionParticleIndex.current + 1) % HIT_EXPLOSION_PARTICLE_COUNT
        })
        const hitExplosionSmallParticleToken = PubSub.subscribe('hitExplosionSmallParticle', (msg: string, data: { position: THREE.Vector3 }) => {
            PubSub.publish(`startHitExplosionSmallParticle_${hitExplosionSmallParticleIndex.current}`, {
                position: data.position
            });
            hitExplosionSmallParticleIndex.current = (hitExplosionSmallParticleIndex.current + 1) % HIT_EXPLOSION_SMALL_PARTICLE_COUNT
        })
        return () => {
            PubSub.unsubscribe(hitExplosionParticleToken)
            PubSub.unsubscribe(hitExplosionSmallParticleToken)
        }
    }, [])

    return (
        <group ref={groupRef}>
            {Array.from({ length: HIT_EXPLOSION_PARTICLE_COUNT }).map((_, index) => (
                <HitExplosionParticle id={`startHitExplosionParticle_${index}`} key={index} count={20} spread={0.18} size={0.3} />
            ))}
            {Array.from({ length: HIT_EXPLOSION_PARTICLE_COUNT }).map((_, index) => (
                <HitExplosionParticle id={`startHitExplosionSmallParticle_${index}`} key={index} count={20} spread={0.07} size={0.07} />
            ))}
        </group>
    );
}