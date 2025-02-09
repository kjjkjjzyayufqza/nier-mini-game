import React, { useEffect, useMemo, useRef } from 'react'
import { createLine } from '../modules/createLine';
import * as THREE from 'three';
import { vec3 } from '@react-three/rapier';
import { HitEffectExpandingRing } from './HitEffectExpandingRingEffects';
import { useFixedFrameUpdate } from '../hook/useFixedFrameUpdate';

const PlayerDeathExplosionFlashEffect = () => {
    const meshRef = useRef<any>(null);
    const instanceCount = 100; // 实例数量
    const radius = 0.1; // 圆形外环的半径
    const tempObject = new THREE.Object3D(); // 用于临时设置实例的变换\
    const instances = useRef<{
        position: THREE.Vector3;
        scale: THREE.Vector3;
        direction: THREE.Vector3;
        speed: number;
    }[]>([]); // 存储每个实例的方向和速度
    const effectsTime = useRef<number>(0);

    useEffect(() => {
        if (meshRef.current) {
            const newInstances = [];
            for (let i = 0; i < instanceCount; i++) {
                // 计算圆周上的位置
                const angle = (i / instanceCount) * Math.PI * 2; // 角度均匀分布
                const x = Math.cos(angle) * radius;
                const y = 0;
                const z = Math.sin(angle) * radius;

                // 设置实例对象的位置
                tempObject.position.set(x, y, z);

                // 计算切线方向（圆周方向的单位向量）
                const tangentX = -Math.sin(angle); // 切线的 x 分量
                const tangentZ = Math.cos(angle);  // 切线的 z 分量

                // 根据切线方向设置旋转
                const rotationY = Math.atan2(tangentX, tangentZ); // 计算绕 Y 轴的旋转角度
                tempObject.rotation.set(0, rotationY, 0); // 手动设置旋转角度

                const quaternion = tempObject.quaternion; // 获取旋转的四元数
                const modelForward = vec3({ x: 1, y: 0, z: 0 }); // 模型的本地前方向X
                modelForward.applyQuaternion(quaternion); // 将本地前方向转换到全局方向

                // 设置实例的缩放比例
                const scaleX = THREE.MathUtils.lerp(0.4, 0.1, Math.random()); // 随机缩放x轴
                tempObject.scale.set(scaleX, 0.002, 0.002);

                // 更新实例的变换矩阵
                tempObject.updateMatrix();

                // 将变换矩阵应用到实例化网格中
                meshRef.current.setMatrixAt(i, tempObject.matrix);

                // 存储方向和速度
                newInstances.push({
                    position: tempObject.position.clone(), // 位置
                    scale: tempObject.scale.clone(), // 缩放
                    direction: modelForward.normalize(), // 切线方向
                    speed: THREE.MathUtils.lerp(30, 5, Math.random()), // 每个实例的随机速度
                });
            }

            // 更新方向和速度数组
            instances.current = newInstances;

            // 通知实例化网格更新
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [instanceCount, radius]);

    useFixedFrameUpdate((state, delta) => {
        if (meshRef.current && meshRef.current.visible) {
            effectsTime.current += delta;
            for (let i = 0; i < instanceCount; i++) {
                const dir = instances.current[i];
                const { direction, speed, scale } = dir;

                // 获取当前实例的位置
                meshRef.current.getMatrixAt(i, tempObject.matrix);
                tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

                if (effectsTime.current > 1) {
                    // reset
                    tempObject.position.copy(dir.position);
                    tempObject.scale.copy(scale);
                    tempObject.updateMatrix();
                    meshRef.current.setMatrixAt(i, tempObject.matrix);
                    continue; // 跳过本次循环的后续逻辑
                }

                if (effectsTime.current > 0.03) {
                    // 更新位置和缩放
                    tempObject.position.add(direction.clone().multiplyScalar(speed * delta));
                    tempObject.scale.set(scale.x + 0.2, 0.012, 0.012);
                    tempObject.updateMatrix();
                    meshRef.current.setMatrixAt(i, tempObject.matrix);
                } else if (effectsTime.current > 0.02) {
                    // 更新位置
                    tempObject.position.add(direction.clone().multiplyScalar(speed * delta));
                    tempObject.updateMatrix();
                    meshRef.current.setMatrixAt(i, tempObject.matrix);
                }
            }
            if (effectsTime.current > 1) {
                // reset
                effectsTime.current = 0
                meshRef.current.visible = false;
            }

            // 通知实例化网格更新
            meshRef.current.instanceMatrix.needsUpdate = true;

        }
    });

    useEffect(() => {
        const startPlayerDeathExplosionFlashEffectToken = PubSub.subscribe('startPlayerDeathExplosionFlashEffect', (msg: string, data: { position: THREE.Vector3 }) => {
            effectsTime.current = 0;
            meshRef.current.visible = true;
            meshRef.current.position.copy(data.position);
        });
        return () => {
            PubSub.unsubscribe(startPlayerDeathExplosionFlashEffectToken);
        };
    })

    return (
        <instancedMesh
            ref={meshRef}
            visible={false}
            args={[undefined, undefined, instanceCount]} // 几何体、材质、实例数量
        >
            <octahedronGeometry args={[1, 0]} /> {/* 八面体几何体 */}
            <meshStandardMaterial
                color="#ff0000"
                emissive={'#ff0000'}
                emissiveIntensity={3}
                depthWrite={false} />
        </instancedMesh>
    );
}

const PlayerDeathMaskEffect = () => {
    // 引用 Plane 的材质
    const shaderMaterialRef = useRef<any>(null);
    const meshRef = useRef<any>(null);
    const scaleY = useRef<number>(1); // X 轴缩放比例

    // 动态时间控制
    const timeRef = useRef(0);

    // 顶点着色器
    const vertexShader = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv; // 传递 UV 坐标到片段着色器
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `;

    // 片段着色器
    const fragmentShader = `
uniform float uTime; // 时间
uniform vec3 uColor; // 颜色

varying vec2 vUv;

void main() {
    // 时间控制透明度
    float fade = 0.5 - uTime * 0.5;
    fade = max(fade, 0.0); // 确保透明度不会低于 0

    // 边缘模糊效果
    float edgeFade = smoothstep(0.0, 0.1, vUv.x) * // 左边缘
                     smoothstep(0.0, 0.1, vUv.y) * // 下边缘
                     smoothstep(0.0, 0.1, 1.0 - vUv.x) * // 右边缘
                     smoothstep(0.0, 0.1, vUv.y);  // 上边缘

    // 将边缘模糊效果与时间衰减结合
    float finalFade = fade * edgeFade;

    // 最终颜色
    vec3 color = uColor;

    // 输出颜色和透明度
    gl_FragColor = vec4(color, finalFade); // 将透明度正确应用到 alpha 通道
}

    `;

    // 因为这里会重新渲染，所以使用 useRef 来保存材质
    shaderMaterialRef.current = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 }, // 时间
            uColor: { value: new THREE.Color('red') }, // 颜色
        },
        vertexShader,
        fragmentShader,
        transparent: true, // 开启透明度
        depthWrite: false, // 关闭深度写入
    })

    useFixedFrameUpdate((state, delta) => {
        if (shaderMaterialRef.current && meshRef.current && meshRef.current.visible) {
            // 增加时间
            timeRef.current += delta;

            // 将时间传递给着色器
            shaderMaterialRef.current.uniforms.uTime.value = timeRef.current;
            scaleY.current = THREE.MathUtils.lerp(1, 0.1, timeRef.current / 2); // 逐渐缩小 X 轴
            meshRef.current.scale.set(1, scaleY.current, 1); // 设置 X 轴缩放

            // 当透明度接近 0 时重置时间 (可选)
            if (timeRef.current > 1) {
                timeRef.current = 0; // 重置时间
                meshRef.current.visible = false; // 隐藏网格
            }
        }
    });

    useEffect(() => {
        const startPlayerDeathMaskEffectToken = PubSub.subscribe('startPlayerDeathMaskEffect', (msg: string, data: { position: THREE.Vector3 }) => {
            meshRef.current.position.copy(data.position);
            meshRef.current.visible = true;
        })
        return () => {
            PubSub.unsubscribe(startPlayerDeathMaskEffectToken);
        }
    }, [])

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} ref={meshRef} visible={false}>
            <planeGeometry args={[10, 0.04]} /> {/* 平面几何体 */}
            <primitive object={shaderMaterialRef.current} />
        </mesh>
    );
};

const PlayerDeathExplosionBoxEffect = () => {
    const meshRef = useRef<any>(null);
    const instanceCount = 50;
    const radius = 0.1; // 圆形外环的半径
    const tempObject = new THREE.Object3D(); // 用于临时设置实例的变换\
    const instances = useRef<{
        position: THREE.Vector3;
        direction: THREE.Vector3;
        speed: number;
    }[]>([]); // 存储每个实例的方向和速度
    const effectsTime = useRef<number>(0);

    useEffect(() => {
        if (meshRef.current) {
            const newInstances = [];
            for (let i = 0; i < instanceCount; i++) {
                // 计算圆周上的位置
                const angle = (i / instanceCount) * Math.PI * 2; // 角度均匀分布
                const x = Math.cos(angle) * radius;
                const y = 0;
                const z = Math.sin(angle) * radius;

                // 设置实例对象的位置
                tempObject.position.set(x, y, z);

                // 计算切线方向（圆周方向的单位向量）
                const tangentX = -Math.sin(angle); // 切线的 x 分量
                const tangentZ = Math.cos(angle);  // 切线的 z 分量

                // 根据切线方向设置旋转
                const rotationY = Math.atan2(tangentX, tangentZ); // 计算绕 Y 轴的旋转角度
                tempObject.rotation.set(0, rotationY, 0); // 手动设置旋转角度

                const quaternion = tempObject.quaternion; // 获取旋转的四元数
                const modelForward = vec3({ x: 1, y: 0, z: 0 }); // 模型的本地前方向X
                modelForward.applyQuaternion(quaternion); // 将本地前方向转换到全局方向
                tempObject.rotation.set(0, 0, 0);

                // 设置实例的缩放比例
                const scale = THREE.MathUtils.lerp(1, 0.4, Math.random()); // 随机缩放x轴
                tempObject.scale.set(scale, scale, scale);

                // 更新实例的变换矩阵
                tempObject.updateMatrix();

                // 将变换矩阵应用到实例化网格中
                meshRef.current.setMatrixAt(i, tempObject.matrix);

                // 存储方向和速度
                newInstances.push({
                    position: tempObject.position.clone(), // 位置
                    scale: tempObject.scale.clone(), // 缩放
                    direction: modelForward.normalize(), // 切线方向
                    speed: THREE.MathUtils.lerp(1, 0.1, Math.random()), // 每个实例的随机速度
                });
            }

            // 更新方向和速度数组
            instances.current = newInstances;

            // 通知实例化网格更新
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [instanceCount, radius]);

    useFixedFrameUpdate((state, delta) => {
        if (meshRef.current && meshRef.current.visible) {
            effectsTime.current += delta;
            const material = meshRef.current.material;
            if (effectsTime.current <= 1) {
                material.opacity = THREE.MathUtils.lerp(0.5, 0.0, effectsTime.current / 1); // 逐渐减少透明度
            } else {
                material.opacity = 0.0; // 确保完全透明
            }

            for (let i = 0; i < instanceCount; i++) {
                const dir = instances.current[i];
                const { direction, speed } = dir;

                // 获取当前实例的位置
                meshRef.current.getMatrixAt(i, tempObject.matrix);
                tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

                if (effectsTime.current > 1) {
                    // reset
                    tempObject.position.copy(dir.position);
                    tempObject.updateMatrix();
                    meshRef.current.setMatrixAt(i, tempObject.matrix);
                    continue; // 跳过本次循环的后续逻辑
                }
                tempObject.position.add(direction.clone().multiplyScalar(speed * delta));
                tempObject.updateMatrix();
                meshRef.current.setMatrixAt(i, tempObject.matrix);
            }
            if (effectsTime.current > 1) {
                // reset
                effectsTime.current = 0
                meshRef.current.visible = false;
            }

            // 通知实例化网格更新
            meshRef.current.instanceMatrix.needsUpdate = true;

        }
    });

    useEffect(() => {
        const startPlayerDeathExplosionBoxEffectToken = PubSub.subscribe('startPlayerDeathExplosionBoxEffect', (msg: string, data: { position: THREE.Vector3 }) => {
            effectsTime.current = 0;
            meshRef.current.visible = true;
            meshRef.current.position.copy(data.position);
        })
        return () => {
            PubSub.unsubscribe(startPlayerDeathExplosionBoxEffectToken);
        }
    }, [])

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, instanceCount]} // 几何体、材质、实例数量
            visible={false}
        >
            <boxGeometry args={[0.1, 0.1, 0.1]} /> {/* 八面体几何体 */}
            <meshStandardMaterial
                color="#171717"
                depthWrite={false}
                transparent
                opacity={0.5}
            />
        </instancedMesh>
    );
}


export const PlayerDeathEffect = () => {
    const playerDeathEffectRef = useRef<any>(null);

    useEffect(() => {
        const startPlayerDeathEffectToken = PubSub.subscribe('startPlayerDeathEffect', (msg: string, data: { position: THREE.Vector3 }) => {
            playerDeathEffectRef.current.visible = true;
            PubSub.publish('startPlayerDeathExplosionFlashEffect', { position: data.position });
            PubSub.publish('startPlayerDeathMaskEffect', { position: data.position });
            setTimeout(() => {
                PubSub.publish('playerOnDeathEffectBlackRingAnimation', { position: data.position })
                PubSub.publish('playerOnDeathEffectWhiteRingAnimation', { position: data.position })
            }, 80)
            setTimeout(() => {
                PubSub.publish('startPlayerDeathExplosionBoxEffect', { position: data.position });
            }, 200)
        })
        return () => {
            PubSub.unsubscribe(startPlayerDeathEffectToken)
        }
    }, [])

    return <group visible={false} ref={playerDeathEffectRef}>
        <PlayerDeathExplosionFlashEffect />
        <PlayerDeathMaskEffect />
        <PlayerDeathExplosionBoxEffect />
        <HitEffectExpandingRing
            id={'playerOnDeathEffectBlackRingAnimation'}
            planeSize={6}
            color={'#000000'}
            opacity={1}
            outerRadiusValue={0.002}
            innerRadiusValue={0.002}
        />
        <HitEffectExpandingRing
            id={'playerOnDeathEffectWhiteRingAnimation'}
            planeSize={1}
            maxRadius={0.5}
            color={'#ffffff'}
            opacity={1}
            outerRadiusValue={0.006}
            innerRadiusValue={0.006}
            expandSpeed={6}
        />
    </group>
};