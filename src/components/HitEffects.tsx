import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { BatchedMesh } from 'three';
import * as THREE from 'three';
import { euler, vec3 } from '@react-three/rapier';
import PubSub from 'pubsub-js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2';
import { HitEffectExpandingRingEffects } from './HitEffectExpandingRingEffects';
import { createLine } from '../modules/createLine';

export const HitEffects = () => {

    const COUNT = 5
    const batchedMeshRef = useRef<BatchedMesh>(null);
    const animationsIndexRef = useRef<number>(-1);
    const animationsRef = useRef<{
        position: THREE.Vector3;
        enabled: boolean;
        animationIndex: number
    }[]>([]);
    const emptyMatrix4 = new THREE.Matrix4();
    const emptyQuaternion = new THREE.Quaternion();
    const emptyEuler = new THREE.Euler();
    const scale = 1.3

    const planeWidth = 0.02;
    const planeHeight = 0.13;
    const emissiveIntensity = 0.047;

    // 使用 useMemo 缓存几何体和材质
    const planeGeometry = useMemo(() => new THREE.PlaneGeometry(planeWidth, planeHeight), [planeWidth, planeHeight]);
    const planeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: 'white',
        emissive: 'lightblue',
        emissiveIntensity: emissiveIntensity,
    }), [emissiveIntensity]);

    const ringGeometry = useMemo(() => new THREE.RingGeometry(0.040, 0.056, 32), []);
    const ringMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: 'white',
        emissive: 'lightblue',
        emissiveIntensity: emissiveIntensity + 0.005,
    }), [emissiveIntensity]);

    // 创建平面（用于 planeGeometry 的网格）
    const createPlane = (position: THREE.Vector3, rotation: THREE.Euler, planeSize: number) => {
        const geometry = new THREE.PlaneGeometry(planeSize, planeSize);
        const material = new THREE.MeshStandardMaterial({
            color: 'white',
            emissive: 'lightblue',
            emissiveIntensity: emissiveIntensity,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.rotation.copy(rotation);
        return mesh;
    };

    const addDashedLine = (position: THREE.Vector3, rotation: THREE.Euler, length: number, dashSize: number, gapSize: number, lineWidth: number) => {
        const line = createLine([[-length, 0, 0], [length, 0, 0]], 'white', true, dashSize, gapSize, lineWidth);
        line.position.copy(position);
        line.rotation.copy(rotation);
        return line;
    };

    const addLine = (start: THREE.Vector3, end: THREE.Vector3, lineWidth: number) => {
        const line = createLine([start.toArray(), end.toArray()], 'white', false);
        line.material.linewidth = lineWidth;
        return line
    };

    const phase1 = (id: string): THREE.Group => {
        // 创建一个原生的 THREE.Group 对象
        const group = new THREE.Group();
        group.name = id;
        group.visible = false

        // 创建 InstancedMesh
        const instancedMesh = new THREE.InstancedMesh(planeGeometry, planeMaterial, 4);
        emptyMatrix4.compose(
            vec3({ x: 0, y: 0, z: 0.056 }), // 位置
            emptyQuaternion.setFromEuler(emptyEuler.clone().set(Math.PI / -2, 0, 0)), // 旋转
            vec3({ x: 1, y: 1, z: 1 }) // 缩放
        );
        instancedMesh.setMatrixAt(0, emptyMatrix4.setPosition(0.058, 0, 0));
        instancedMesh.setMatrixAt(1, emptyMatrix4.setPosition(-0.058, 0, 0));
        emptyMatrix4.compose(
            vec3({ x: 0, y: 0, z: 0.056 }), // 位置
            emptyQuaternion.setFromEuler(emptyEuler.clone().set(Math.PI / -2, 0, Math.PI / 2)), // 旋转
            vec3({ x: 1, y: 1, z: 1 }) // 缩放
        );
        instancedMesh.setMatrixAt(2, emptyMatrix4);
        instancedMesh.setMatrixAt(3, emptyMatrix4.setPosition(0, 0, -0.056));
        instancedMesh.instanceMatrix.needsUpdate = true;

        // 创建 Mesh
        const mesh = new THREE.Mesh(ringGeometry, ringMaterial);
        mesh.rotation.x = Math.PI / -2;

        // 将对象添加到组中
        group.add(instancedMesh);
        group.add(mesh);

        group.scale.set(scale, scale, scale);
        return group;
    };

    const phase2 = (id: string): THREE.Group => {
        const lineLength = 0.026;
        const planeSize = 0.013;

        // 创建一个原生的 THREE.Group 对象
        const group = new THREE.Group();
        group.name = id;
        group.visible = false;


        // 创建并添加线条和网格到组中
        const addLineAndPlane = (linePosition: THREE.Vector3, lineRotation: THREE.Euler, planePosition: THREE.Vector3, planeRotation: THREE.Euler) => {
            const line = createLine([[-lineLength, 0, 0], [lineLength, 0, 0]], 'white', true);
            line.position.copy(linePosition);
            line.rotation.copy(lineRotation);
            group.add(line);

            const plane = createPlane(planePosition, planeRotation, planeSize);
            group.add(plane);
        };

        addLineAndPlane(
            vec3({ x: 0, y: 0, z: 0.056 }),
            euler({ x: Math.PI / -2, y: 0, z: 0 }),
            vec3({ x: -0.03, y: 0, z: 0.056 }),
            euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 })
        );

        addLineAndPlane(
            vec3({ x: 0, y: 0, z: -0.056 }),
            euler({ x: Math.PI / -2, y: 0, z: 0 }),
            vec3({ x: 0.03, y: 0, z: -0.056 }),
            euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 })
        );

        addLineAndPlane(
            vec3({ x: 0.062, y: 0, z: 0 }),
            euler({ x: Math.PI / -2, y: 0, z: Math.PI / 2 }),
            vec3({ x: 0.062, y: 0, z: -0.027 }),
            euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 })
        );

        addLineAndPlane(
            vec3({ x: -0.062, y: 0, z: 0 }),
            euler({ x: Math.PI / -2, y: 0, z: Math.PI / 2 }),
            vec3({ x: -0.062, y: 0, z: 0.027 }),
            euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 })
        );

        group.add(createPlane(vec3({ x: 0.041, y: 0, z: 0 }), euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 }), planeSize));
        group.add(createPlane(vec3({ x: -0.041, y: 0, z: 0 }), euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 }), planeSize));
        group.add(createPlane(vec3({ x: 0, y: 0, z: 0.041 }), euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 }), planeSize));
        group.add(createPlane(vec3({ x: 0, y: 0, z: -0.041 }), euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 }), planeSize));

        group.scale.set(scale, scale, scale);
        return group;
    };


    const phase3 = (id: string): THREE.Group => {
        const lineLength = 0.07;
        const smallLineLength = 0.03;
        const lineWidth = 4;
        const group = new THREE.Group();
        group.name = id;
        group.visible = false;
        group.add(addDashedLine(
            vec3({ x: 0.06, y: 0, z: 0.05 }),
            euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 }),
            lineLength,
            0.03,
            0.015,
            lineWidth
        ))
        group.add(addDashedLine(
            vec3({ x: -0.06, y: 0, z: -0.058 }),
            euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 }),
            lineLength,
            0.03,
            0.015,
            lineWidth
        ))
        group.add(addDashedLine(
            vec3({ x: -0.017, y: 0, z: -0.016 }),
            euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 }),
            smallLineLength,
            0.01,
            0.03,
            lineWidth
        ))
        group.add(addDashedLine(
            vec3({ x: 0.017, y: 0, z: 0.016 }),
            euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 }),
            smallLineLength,
            0.01,
            0.03,
            lineWidth
        ))
        group.scale.set(scale, scale, scale);
        return group;
    };

    const phase4 = (id: string) => {
        return phase3(id)
    }

    const phase5 = (id: string): THREE.Group => {
        const range = 0.08;
        const lineWidth = 1;
        const group = new THREE.Group();
        group.visible = false;
        group.name = id
        const points = [
            vec3({ x: range, y: 0, z: -range }),  // Bottom right
            vec3({ x: -range, y: 0, z: -range }), // Bottom left
            vec3({ x: -range, y: 0, z: range }),  // Top left
            vec3({ x: range, y: 0, z: range }),    // Top right
        ];
        group.add(addLine(points[0], points[1], lineWidth));
        group.add(addLine(points[1], points[2], lineWidth));
        group.add(addLine(points[2], points[3], lineWidth));
        group.add(addLine(points[3], points[0], lineWidth));
        const addPlane = (position: THREE.Vector3) => {
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(0.04, 0.04),
                new THREE.MeshStandardMaterial({ color: 'white', opacity: 0.1, transparent: true })
            );
            mesh.position.copy(position);
            mesh.rotation.copy(euler({ x: Math.PI / -2, y: 0, z: 0 }));
            group.add(mesh);
        };

        // 添加平面
        addPlane(vec3({ x: range - 0.02, y: 0, z: range - 0.02 }));
        addPlane(vec3({ x: range - 0.14, y: 0, z: range - 0.02 }));
        addPlane(vec3({ x: range - 0.02, y: 0, z: range - 0.14 }));
        addPlane(vec3({ x: -range + 0.02, y: 0, z: -range + 0.02 }));

        group.scale.set(scale, scale, scale);
        return group;
    };

    const phase6 = (id: string): THREE.Group => {
        const range = 0.08;

        const group = new THREE.Group();
        group.name = id;
        group.visible = false;

        // 创建并添加平面到组中
        const addPlane = (position: THREE.Vector3, width: number, height: number, opacity: number) => {
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(width, height),
                new THREE.MeshStandardMaterial({ color: 'white', opacity: opacity, transparent: true })
            );
            mesh.position.copy(position);
            mesh.rotation.copy(euler({ x: Math.PI / -2, y: 0, z: 0 }));
            group.add(mesh);
        };

        // 添加平面
        addPlane(vec3({ x: range - 0.02, y: 0, z: range - 0.02 }), 0.04, 0.04, 0.1);
        addPlane(vec3({ x: range - 0.14, y: 0, z: range - 0.02 }), 0.04, 0.04, 0.1);
        addPlane(vec3({ x: range - 0.02, y: 0, z: range - 0.14 }), 0.04, 0.04, 0.1);
        addPlane(vec3({ x: -range + 0.02, y: 0, z: -range + 0.02 }), 0.04, 0.04, 0.1);
        addPlane(vec3({ x: -range + 0.08, y: 0, z: -range + 0.02 }), 0.08, 0.04, 1);
        addPlane(vec3({ x: -range + 0.02, y: 0, z: -range + 0.08 }), 0.04, 0.08, 1);
        addPlane(vec3({ x: range - 0.08, y: 0, z: range - 0.02 }), 0.08, 0.04, 1);
        addPlane(vec3({ x: range - 0.02, y: 0, z: range - 0.08 }), 0.04, 0.08, 1);

        group.scale.set(scale, scale, scale);
        return group;
    };


    const phase7 = (id: string): THREE.Group => {
        const lineLength = 0.085;
        const lineWidth = 12;
        const dashSize = 0.07;
        const gapSize = 0.035;
        const group = new THREE.Group();
        group.visible = false;
        group.name = id;
        group.add(addDashedLine(vec3({ x: -0.055, y: 0, z: 0.045 }), euler({ x: Math.PI / -2, y: 0, z: Math.PI / -4 }), lineLength, dashSize, gapSize, lineWidth));
        group.add(addDashedLine(vec3({ x: -0.015, y: 0, z: 0.012 }), euler({ x: Math.PI / -2, y: 0, z: Math.PI / -4 }), lineLength, dashSize, gapSize, lineWidth));
        group.add(addDashedLine(vec3({ x: 0.018, y: 0, z: -0.02 }), euler({ x: Math.PI / -2, y: 0, z: Math.PI / -4 }), lineLength, dashSize, gapSize, lineWidth));
        group.add(addDashedLine(vec3({ x: 0.055, y: 0, z: -0.055 }), euler({ x: Math.PI / -2, y: 0, z: Math.PI / -4 }), lineLength, dashSize, gapSize, lineWidth));
        group.scale.set(scale, scale, scale);
        return group;
    };

    const phase8 = (id: string): THREE.Group => {
        const lineLength = 0.08;
        const lineWidth = 15;
        const group = new THREE.Group();
        group.name = id;
        group.visible = false;
        group.add(addDashedLine(vec3({ x: 0.055, y: 0, z: 0.045 }), euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 }), lineLength, 0.012, 0.015, lineWidth));
        group.add(addDashedLine(vec3({ x: -0.055, y: 0, z: -0.055 }), euler({ x: Math.PI / -2, y: 0, z: Math.PI / 4 }), lineLength, 0.012, 0.015, lineWidth));
        group.scale.set(scale, scale, scale);
        return group;
    };


    useFrame((scene, delta) => {
        if (batchedMeshRef.current == null) return
        animationsRef.current.forEach((animation, index) => {
            if (animation.enabled) {
                animation.animationIndex++;
                //update position
                batchedMeshRef.current!.getObjectByName(`${phase1.name}-${index}`)!.position.copy(animation.position)
                batchedMeshRef.current!.getObjectByName(`${phase2.name}-${index}`)!.position.copy(animation.position)
                batchedMeshRef.current!.getObjectByName(`${phase3.name}-${index}`)!.position.copy(animation.position)
                batchedMeshRef.current!.getObjectByName(`${phase4.name}-${index}`)!.position.copy(animation.position)
                batchedMeshRef.current!.getObjectByName(`${phase5.name}-${index}`)!.position.copy(animation.position)
                batchedMeshRef.current!.getObjectByName(`${phase6.name}-${index}`)!.position.copy(animation.position)
                batchedMeshRef.current!.getObjectByName(`${phase7.name}-${index}`)!.position.copy(animation.position)
                batchedMeshRef.current!.getObjectByName(`${phase8.name}-${index}`)!.position.copy(animation.position)
                if (animation.animationIndex == 1) {
                    batchedMeshRef.current!.getObjectByName(`${phase1.name}-${index}`)!.visible = true
                } else if (animation.animationIndex == 2) {
                    batchedMeshRef.current!.getObjectByName(`${phase1.name}-${index}`)!.visible = false
                    batchedMeshRef.current!.getObjectByName(`${phase2.name}-${index}`)!.visible = true
                } else if (animation.animationIndex == 3) {
                    batchedMeshRef.current!.getObjectByName(`${phase2.name}-${index}`)!.visible = false
                    batchedMeshRef.current!.getObjectByName(`${phase3.name}-${index}`)!.visible = true
                } else if (animation.animationIndex == 4) {
                    batchedMeshRef.current!.getObjectByName(`${phase3.name}-${index}`)!.visible = false
                    batchedMeshRef.current!.getObjectByName(`${phase4.name}-${index}`)!.visible = true
                } else if (animation.animationIndex == 5) {
                    batchedMeshRef.current!.getObjectByName(`${phase4.name}-${index}`)!.visible = false
                    batchedMeshRef.current!.getObjectByName(`${phase5.name}-${index}`)!.visible = true
                } else if (animation.animationIndex == 6) {
                    batchedMeshRef.current!.getObjectByName(`${phase5.name}-${index}`)!.visible = false
                    batchedMeshRef.current!.getObjectByName(`${phase6.name}-${index}`)!.visible = true
                } else if (animation.animationIndex == 7) {
                    batchedMeshRef.current!.getObjectByName(`${phase6.name}-${index}`)!.visible = false
                    batchedMeshRef.current!.getObjectByName(`${phase7.name}-${index}`)!.visible = true
                } else if (animation.animationIndex == 8) {
                    batchedMeshRef.current!.getObjectByName(`${phase7.name}-${index}`)!.visible = false
                    batchedMeshRef.current!.getObjectByName(`${phase8.name}-${index}`)!.visible = true
                } else {
                    batchedMeshRef.current!.getObjectByName(`${phase8.name}-${index}`)!.visible = false
                    animation.enabled = false
                    animation.animationIndex = 0
                }
            }
        })
    });

    useEffect(() => {
        const startHitAnimationToken = PubSub.subscribe('startHitAnimation', (msg: string, data: THREE.Vector3) => {
            if (animationsIndexRef.current < COUNT - 1) {
                animationsIndexRef.current += 1
                animationsRef.current[animationsIndexRef.current].position = vec3({ x: data.x, y: data.y, z: data.z })
                animationsRef.current[animationsIndexRef.current].enabled = true
            } else {
                animationsIndexRef.current = -1
                animationsRef.current[0].position = vec3({ x: data.x, y: data.y, z: data.z })
                animationsRef.current[0].enabled = true
            }

        })
        //reset first
        batchedMeshRef.current?.clear()
        for (let i = 0; i < COUNT; i++) {
            animationsRef.current.push({
                position: vec3(),
                enabled: false,
                animationIndex: 0
            })
            batchedMeshRef.current?.add(phase1(`${phase1.name}-${i}`))
            batchedMeshRef.current?.add(phase2(`${phase2.name}-${i}`))
            batchedMeshRef.current?.add(phase3(`${phase3.name}-${i}`))
            batchedMeshRef.current?.add(phase4(`${phase4.name}-${i}`))
            batchedMeshRef.current?.add(phase5(`${phase5.name}-${i}`))
            batchedMeshRef.current?.add(phase6(`${phase6.name}-${i}`))
            batchedMeshRef.current?.add(phase7(`${phase7.name}-${i}`))
            batchedMeshRef.current?.add(phase8(`${phase8.name}-${i}`))
        }
        return () => {
            PubSub.unsubscribe(startHitAnimationToken)
        }
    }, [])



    return (
        <>
            <group ref={batchedMeshRef} position={[0, 0, 0]} />
            <HitEffectExpandingRingEffects />
        </>
    );
};
