import React, { useRef, useEffect, useState, useContext, use } from 'react';
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
    const boxMinSize = 0.017;
    const boxMaxSize = 0.026;
    const spawnRange = 0.08
    const targetRange = 0.3
    const particlesIndex = useRef<number>(-1);
    const createParticle = (position: THREE.Vector3) => {
        const randomStartPosition = vec3({
            x: position.x + (Math.random() - 0.5) * spawnRange,
            y: position.y + (Math.random() - 0.5) * spawnRange / 8,
            z: position.z + (Math.random() - 0.5) * spawnRange
        })
        const randomTargetPosition = vec3({
            x: position.x + (Math.random() - 0.5) * targetRange,
            y: position.y + (Math.random() - 0.5) * targetRange / 8,
            z: position.z + (Math.random() - 0.5) * targetRange
        })
        //set id to visible true
        particlesIndex.current = particlesIndex.current + 1
        if (particlesIndex.current >= PARTICLES_COUNT) {
            particlesIndex.current = 0
        }
        if (playerEffectsGroupRef.current) {
            const group = playerEffectsGroupRef.current.getObjectByName(particlesIndex.current.toString())
            if (group) {
                particles.current[particlesIndex.current].enabled = true
                particles.current[particlesIndex.current].position = randomStartPosition
                particles.current[particlesIndex.current].targetPosition = randomTargetPosition
                group.visible = true
                group.position.set(randomStartPosition.x, randomStartPosition.y, randomStartPosition.z)
            }
        }
    };

    const rotationSpeed = 0.075
    useFixedFrameUpdate((state, delta) => {
        if (playerEffectsGroupRef.current) {
            particles.current.forEach((particle) => {
                if (particle.enabled && playerEffectsGroupRef.current) {
                    const mesh = playerEffectsGroupRef.current.getObjectByName(`${particle.id}`)
                    if (mesh) {
                        mesh.position.lerp(vec3({
                            x: particle.targetPosition.x,
                            y: particle.targetPosition.y,
                            z: particle.targetPosition.z
                        }), 0.01);
                        mesh.rotation.y += Math.random() * rotationSpeed;
                        if (mesh.children.length > 0) {
                            //寻找Material然后更新透明度
                            const material = (mesh.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial
                            if (material) {
                                material.opacity -= 0.018
                                if (material.opacity <= -0.02) {
                                    particle.enabled = false
                                    mesh.visible = false
                                    material.opacity = 1
                                }
                            }
                        }
                    }

                }
            });
        }
    });

    const initParticles = () => {
        for (let i = 0; i < PARTICLES_COUNT; i++) {
            const randomSize = boxMinSize + (boxMaxSize - boxMinSize) * Math.random();
            const type = Math.random() > 0.5 ? "white" : "black";
            particles.current.push({
                id: i,
                enabled: false,
                position: vec3({ x: 0, y: 0, z: 0 }),
                targetPosition: vec3({ x: 0, y: 0, z: 0 }),
                boxSize: randomSize,
                type: type
            })
            if (playerEffectsGroupRef.current) {
                playerEffectsGroupRef.current.add(
                    PlayerEffectsBoxParticle({
                        id: `${i}`,
                        type: type,
                        position: vec3({ x: 0, y: 0, z: 0 }),
                        boxSize: [randomSize, randomSize, randomSize]
                    }))
            }
        }
    }

    useEffect(() => {
        const spawnPlayerMovementParticlesToken = PubSub.subscribe('spawnPlayerMovementParticles', (msg: any, data: { position: THREE.Vector3 }) => {
            //每次随机生成1/2个粒子
            const count = 1 + Math.floor(Math.random() * 3)
            for (let i = 0; i < count; i++) {
                createParticle(data.position);
            }
        })
        if (playerEffectsGroupRef.current) {
            playerEffectsGroupRef.current.clear()
            initParticles()
        }
        return () => {
            PubSub.unsubscribe(spawnPlayerMovementParticlesToken);
        }

    }, [])

    return (
        <>
            <group ref={playerEffectsGroupRef}>
            </group>
        </>
    );
}

