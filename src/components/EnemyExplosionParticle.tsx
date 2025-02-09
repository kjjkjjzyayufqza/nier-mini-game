import * as THREE from 'three';
import { useRef, useMemo, useEffect, useCallback } from 'react';
import PubSub from 'pubsub-js';
import { v4 as uuidv4 } from 'uuid';
import { useFixedFrameUpdate } from '../hook/useFixedFrameUpdate';

const EnemyExplosionParticle = ({
    id,
    count = 500,
    spread = 0.5,
    size = 0.5,
    speedFactor = 2,
    containerSize = { x: 0.5, y: 0.1 },
    particleSize = { min: 0.1, max: 0.5 },
    uPhaseTime = 0.04
}: {
    id: string;
    count?: number;
    spread?: number;
    size?: number;
    speedFactor?: number;
    containerSize?: { x: number; y: number };
    particleSize?: { min: number; max: number };
    uPhaseTime?: number;
}) => {
    const ExplosionShaderMaterial = {
        uniforms: {
            uTime: { value: 0 },
            uSize: { value: size },
            uOpacity: { value: 1.0 },
            uSpread: { value: spread }, // 使用传入的 spread 参数
            uPhaseTime: { value: uPhaseTime }, // 控制停顿时间
        },
        vertexShader: `
          uniform float uTime;
          uniform float uSpread;
          uniform float uPhaseTime;
    
          attribute float aScale;
          attribute vec3 aRandomDirection;
          attribute vec3 aInitialPosition; // 每个粒子的初始位置
          attribute float aSpeed;
    
          varying float vAlpha;
    
          void main() {
            vec3 newPosition;

            if (uTime < uPhaseTime) {
              newPosition = aInitialPosition; // 保持初始位置
            }
            else {
              float expandTime = uTime - uPhaseTime; // 扩散时间
              newPosition = aInitialPosition + aRandomDirection * expandTime * uSpread * aSpeed;
            }

            // Scale size over time
            float scale = aScale * (1.0 - uTime * 0.5); // 调整缩放逻辑
            vAlpha = 1.5 - uTime; // 粒子透明度随时间减少

            // Set the final position and size
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            gl_PointSize = scale * 10.0; // 调整粒子大小
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



    const generateParticles = useCallback(
        (x: number, y: number, particleSizeMin: number, particleSizeMax: number) => {
            const positions = [];
            const randomDirections = [];
            const initialPositions = []; // 初始位置：椭圆形分布
            const scales = [];
            const speeds = [];
            for (let i = 0; i < count; i++) {
                // 椭圆分布的初始位置
                const angle = Math.random() * Math.PI * 2; // 随机角度 (0 到 2π)
                const radius = Math.random(); // 随机半径，范围 [0, 1) -> 控制粒子分布密度
                const initX = Math.cos(angle) * radius * x * 0.5; // 椭圆横轴 (x 为横轴长度)
                const initY = Math.sin(angle) * radius * y * 0.5; // 椭圆纵轴 (y 为纵轴长度)
                const initZ = 0; // 平面固定在 Z = 0

                initialPositions.push(initX, initY, initZ);
                positions.push(initX, initY, initZ); // 初始位置与初始分布相同

                // Generate random direction in 2D plane (XY plane)
                const dirAngle = Math.random() * Math.PI * 2; // 随机方向角
                const dirX = Math.cos(dirAngle); // X 方向分量
                const dirY = Math.sin(dirAngle); // Y 方向分量
                const dirZ = 0; // Z 方向固定为 0

                randomDirections.push(dirX, dirY, dirZ);
                scales.push(particleSizeMin + Math.random() * particleSizeMax); // 每个粒子随机缩放比例

                // Generate random speed for each particle
                speeds.push(1 + Math.random() * 2); // 每个粒子的随机速度
            }

            return {
                positions: new Float32Array(positions),
                initialPositions: new Float32Array(initialPositions), // 初始位置
                randomDirections: new Float32Array(randomDirections),
                scales: new Float32Array(scales),
                speeds: new Float32Array(speeds), // 包括速度
            };
        },
        [count]
    );

    const pointRef = useRef<any>(null);
    const shaderMaterialRef = useRef<any>(null);
    // 初始化粒子
    const particles = useMemo(() => generateParticles(containerSize.x, containerSize.y, particleSize.min, particleSize.max), [generateParticles]);

    // 更新粒子属性
    const updateParticles = (x: number, y: number, particleSizeMin: number, particleSizeMax: number) => {
        const newParticles = generateParticles(x, y, particleSizeMin, particleSizeMax);

        // 更新 bufferGeometry 的属性
        pointRef.current.geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(newParticles.positions, 3)
        );
        pointRef.current.geometry.setAttribute(
            "aInitialPosition",
            new THREE.BufferAttribute(newParticles.initialPositions, 3)
        );
        pointRef.current.geometry.setAttribute(
            "aRandomDirection",
            new THREE.BufferAttribute(newParticles.randomDirections, 3)
        );
        pointRef.current.geometry.setAttribute(
            "aScale",
            new THREE.BufferAttribute(newParticles.scales, 1)
        );
        pointRef.current.geometry.setAttribute(
            "aSpeed",
            new THREE.BufferAttribute(newParticles.speeds, 1)
        );
    };

    useFixedFrameUpdate((state, delta) => {
        if (pointRef.current.visible) {
            if (shaderMaterialRef.current.uniforms.uTime.value > 1) {
                pointRef.current.visible = false;
            } else {
                shaderMaterialRef.current.uniforms.uTime.value += delta * speedFactor;
            }
        }
    });

    useEffect(() => {
        const particleUpdateToken = PubSub.subscribe(id, (msg: string, data: { x: number, y: number, particleSizeMin: number, particleSizeMax: number }) => {
            updateParticles(data.x, data.y, data.particleSizeMin, data.particleSizeMax);
        });
        return () => {
            PubSub.unsubscribe(particleUpdateToken);
        };
    }, [])

    return <points rotation={[-Math.PI / 2, 0, 0]} visible={false} ref={pointRef}>
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
            {/* Initial positions */}
            <bufferAttribute
                name="attributes-aInitialPosition"
                attach="attributes-aInitialPosition"
                args={[particles.initialPositions, 3]} // 初始位置
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
            ref={shaderMaterialRef}
            args={[ExplosionShaderMaterial]}
            transparent
        />
    </points>
};

export const EnemyExplosionEffects = () => {
    const effectGroupRef = useRef<any>(null);
    const effectIndex = useRef<number>(0);
    const EFFECT_COUNT = 5;


    useEffect(() => {
        const startEnemyExplosionParticleToken = PubSub.subscribe(
            "startEnemyExplosionParticle",
            (msg: string, data: { position: THREE.Vector3, x: number, y: number }) => {
                effectGroupRef.current.children[effectIndex.current].visible = true;
                effectGroupRef.current.children[effectIndex.current].position.copy(data.position);
                effectGroupRef.current.children[effectIndex.current].children[0].visible = true;
                effectGroupRef.current.children[effectIndex.current].children[1].visible = true;
                effectGroupRef.current.children[effectIndex.current].children[0].material.uniforms.uTime.value = 0;
                effectGroupRef.current.children[effectIndex.current].children[1].material.uniforms.uTime.value = 0;
                PubSub.publish(`updateEnemyExplosionParticle_${effectIndex.current}`, {
                    x: data.x,
                    y: data.y,
                    particleSizeMin: 0,
                    particleSizeMax: 1,
                });
                PubSub.publish(`updateEnemyFlashParticle_${effectIndex.current}`, {
                    x: data.x,
                    y: data.y,
                    particleSizeMin: 5,
                    particleSizeMax: 5,
                })
                effectIndex.current = (effectIndex.current + 1) % EFFECT_COUNT;
            }
        );
        return () => {
            PubSub.unsubscribe(startEnemyExplosionParticleToken);
        };
    }, []);

    return <group ref={effectGroupRef}>
        {Array.from({ length: EFFECT_COUNT }).map((_, index) => (
            <group key={uuidv4()} visible={false}>
                <EnemyExplosionParticle id={`updateEnemyExplosionParticle_${index}`} />
                <EnemyExplosionParticle id={`updateEnemyFlashParticle_${index}`}
                    uPhaseTime={10}
                    speedFactor={20}
                    particleSize={{
                        min: 5,
                        max: 5
                    }} />
            </group>
        ))}
    </group>
}