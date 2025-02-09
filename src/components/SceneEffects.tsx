import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { euler, vec3 } from '@react-three/rapier';
import { useFixedFrameUpdate } from '../hook/useFixedFrameUpdate';

export const SceneEffects = () => {
  const [COUNT, setCOUNT] = useState(0); // 粒子数量
  const particles = useRef<{
    position: THREE.Vector3;
    targetPosition: THREE.Vector3;
    opacity: number;
    maxDuration: number;
    lifeTime: number;
    rotation: THREE.Euler;
  }[]>([]);
  const visiblePage = useRef<boolean>(true);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null); // 使用 InstancedMesh 渲染粒子
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  // 初始化粒子
  const initParticles = (count: number) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const position = vec3({
        x: (Math.random() - 0.5) * 5,
        y: -1,
        z: (Math.random() - 0.5) * 5
      });

      const range = 2;
      const randomTargetPosition = position
        .clone()
        .set(
          position.x + (Math.random() - 0.5) * range,
          position.y + (Math.random() - 0.5) * range,
          position.z + (Math.random() - 0.5) * range
        );

      list.push({
        position,
        targetPosition: randomTargetPosition,
        opacity: 0,
        lifeTime: 0,
        maxDuration: 2 + Math.random() * 10,
        rotation: euler({ x: Math.PI / -2, y: 0, z: 0 }),
      });
    }
    return list;
  };

  // 初始化粒子组
  useEffect(() => {
    particles.current = initParticles(COUNT);

    // 初始化 InstancedMesh 的矩阵和材质
    if (instancedMeshRef.current) {
      const opacityArray = new Float32Array(COUNT);
      for (let i = 0; i < COUNT; i++) {
        const particle = particles.current[i];
        matrix.setPosition(particle.position);
        matrix.makeRotationFromEuler(particle.rotation);
        instancedMeshRef.current.setMatrixAt(i, matrix);

        // 初始化透明度
        opacityArray[i] = particle.opacity;
      }

      // 添加透明度缓冲属性
      instancedMeshRef.current.geometry.setAttribute(
        'instanceOpacity',
        new THREE.InstancedBufferAttribute(opacityArray, 1)
      );
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  // 动态监听 COUNT 的变化
  useEffect(() => {
    if (instancedMeshRef.current) {
      const currentCount = particles.current.length;

      if (COUNT > currentCount) {
        const newParticles = initParticles(COUNT - currentCount);
        particles.current.push(...newParticles);

        const opacityArray = new Float32Array(COUNT);
        for (let i = 0; i < COUNT; i++) {
          const particle = particles.current[i];
          matrix.setPosition(particle.position);
          matrix.makeRotationFromEuler(particle.rotation);
          instancedMeshRef.current.setMatrixAt(i, matrix);

          // 初始化透明度
          opacityArray[i] = particle.opacity;
        }

        // 更新透明度缓冲属性
        instancedMeshRef.current.geometry.setAttribute(
          'instanceOpacity',
          new THREE.InstancedBufferAttribute(opacityArray, 1)
        );
      } else if (COUNT < currentCount) {
        particles.current = particles.current.slice(0, COUNT);

        const opacityArray = new Float32Array(COUNT);
        for (let i = 0; i < COUNT; i++) {
          opacityArray[i] = particles.current[i].opacity;
        }

        // 更新透明度缓冲属性
        instancedMeshRef.current.geometry.setAttribute(
          'instanceOpacity',
          new THREE.InstancedBufferAttribute(opacityArray, 1)
        );
      }

      instancedMeshRef.current.count = COUNT;
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [COUNT]);

  // 页面可见性监听
  useEffect(() => {
    const handleVisibilityChange = () => {
      visiblePage.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const updateSceneEffectCountToken = PubSub.subscribe(
      'updateSceneEffectCount',
      (msg: string, data: number) => {
        setCOUNT(data);
      }
    );

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      PubSub.unsubscribe(updateSceneEffectCountToken);
    };
  }, []);

  // 动画帧更新
  useFixedFrameUpdate((state, delta) => {
    if (instancedMeshRef.current && visiblePage.current) {
      const opacityArray = instancedMeshRef.current.geometry.attributes.instanceOpacity?.array as Float32Array;
      if (!opacityArray) return;

      particles.current.forEach((particle, i) => {
        // 更新粒子位置
        particle.position.lerp(particle.targetPosition, 0.0005);

        // 更新透明度
        if (particle.lifeTime >= particle.maxDuration) {
          particle.opacity -= Math.max(Math.random(), 0.5) * delta;

          if (particle.opacity <= 0) {
            // 重置粒子位置和目标
            const position = vec3({
              x: (Math.random() - 0.5) * 5,
              y: -1,
              z: (Math.random() - 0.5) * 5
            });

            const range = 2;
            const randomTargetPosition = position
              .clone()
              .set(
                position.x + (Math.random() - 0.5) * range,
                position.y + (Math.random() - 0.5) * range,
                position.z + (Math.random() - 0.5) * range
              );

            particle.position = position;
            particle.targetPosition = randomTargetPosition;
            particle.opacity = 0;
            particle.lifeTime = 0;
          }
        } else {
          particle.opacity += Math.min(Math.random(), 0.02);
          particle.lifeTime += delta;
        }

        // 更新 InstancedMesh 的矩阵
        matrix.setPosition(particle.position);
        instancedMeshRef.current?.setMatrixAt(i, matrix);

        // 更新透明度属性
        opacityArray[i] = particle.opacity / particle.maxDuration;
      });

      instancedMeshRef.current.geometry.attributes.instanceOpacity.needsUpdate = true;
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[new THREE.PlaneGeometry(0.0055, 0.0055), new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color('#FFFEF9') },
          emissive: { value: new THREE.Color('#45423A') },
        },
        vertexShader: `
          attribute float instanceOpacity;
          varying float vOpacity;
          void main() {
            vOpacity = instanceOpacity;
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          varying float vOpacity;
          void main() {
            gl_FragColor = vec4(color, vOpacity);
          }
        `,
        transparent: true,
      }), COUNT]}
    />
  );
};
