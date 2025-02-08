import React, { useContext, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { vec3 } from '@react-three/rapier';

export const SceneEffects = () => {
  const [COUNT, setCOUNT] = useState(0); // 粒子数量
  const [particles, setParticles] = useState<{
    id: number;
    enabled: boolean;
    position: THREE.Vector3;
    targetPosition: THREE.Vector3;
    opacity: number;
    maxDuration: number;
    size: [number, number];
  }[]>([]);
  const groupRef = useRef<THREE.Group>(null); // 粒子组
  const size: [number, number] = [0.0055, 0.0055];
  const visiblePage = useRef<boolean>(true);

  // 初始化粒子
  const initParticles = (count: number) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const position: THREE.Vector3 = vec3({
        x: (Math.random() - 0.5) * 5,
        y: -1, // 固定 y 轴
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
        id: i,
        enabled: true,
        position,
        targetPosition: randomTargetPosition,
        opacity: 0,
        maxDuration: 2 + Math.random() * 10,
        size,
      });
    }
    return list;
  };

  // 动态更新粒子数量
  const updateParticles = () => {
    if (groupRef.current) {
      const currentCount = groupRef.current.children.length;

      // 如果粒子数量增加
      if (COUNT > currentCount) {
        const newParticles = initParticles(COUNT - currentCount);
        setParticles((prev) => [...prev, ...newParticles]);

        newParticles.forEach((particle) => {
          const plane = new THREE.PlaneGeometry(particle.size[0], particle.size[1]);
          const planeMaterial = new THREE.MeshStandardMaterial({
            color: '#FFFEF9',
            opacity: 0,
            transparent: true,
            emissive: '#45423A',
            emissiveIntensity: 0,
          });
          const planeMesh = new THREE.Mesh(plane, planeMaterial);
          planeMesh.position.copy(particle.position);
          planeMesh.rotation.set(Math.PI / -2, 0, 0);
          groupRef.current!.add(planeMesh);
        });
      }

      // 如果粒子数量减少
      if (COUNT < currentCount) {
        const diff = currentCount - COUNT;
        for (let i = 0; i < diff; i++) {
          groupRef.current.remove(groupRef.current.children[groupRef.current.children.length - 1]);
        }
        setParticles((prev) => prev.slice(0, COUNT));
      }
    }
  };

  // 初始化粒子组
  useEffect(() => {
    if (groupRef.current) {
      setParticles(initParticles(COUNT));
      updateParticles();
    }
  }, []);

  // 动态监听 COUNT 的变化
  useEffect(() => {
    updateParticles();
  }, [COUNT]);

  // 页面可见性监听
  useEffect(() => {
    const handleVisibilityChange = () => {
      visiblePage.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const updateSceneEffectCountToken = PubSub.subscribe('updateSceneEffectCount', (msg: string, data: number) => {
      setCOUNT(data);
    })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      PubSub.unsubscribe(updateSceneEffectCountToken);
    };
  }, []);

  // 动画帧更新
  useFrame((state, delta) => {
    if (groupRef.current && visiblePage.current) {
      particles.forEach((particle, i) => {
        const mesh = groupRef.current!.children[i] as THREE.Mesh;
        if (!mesh?.material) return;
        const material = mesh.material as THREE.MeshStandardMaterial;

        // 更新粒子位置
        mesh.position.lerp(particle.targetPosition, 0.0005);

        // 更新透明度
        particle.opacity += Math.min(Math.random(), 0.3) * delta;
        if (particle.opacity < 1) {
          material.opacity += Math.min(Math.random(), 0.3) * delta;
        }

        if (material.opacity >= 0.6) {
          material.emissiveIntensity += 3.5 * delta;
        }

        if (material.emissiveIntensity > 5) {
          material.emissiveIntensity = 5;
        }

        if (particle.opacity >= 1) {
          if (material.opacity > 0) material.opacity -= 0.3 * delta;
        }
        if (material.opacity < 0) {
          material.opacity = 0;
        }

        // 重置粒子
        if (particle.opacity >= particle.maxDuration) {
          material.opacity = 0;
          particle.opacity = 0;
          material.emissiveIntensity = 0;

          const position: THREE.Vector3 = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            -1,
            (Math.random() - 0.5) * 5
          );

          const range = 1;
          const randomTargetPosition = position
            .clone()
            .set(
              position.x + (Math.random() - 0.5) * range,
              position.y + (Math.random() - 0.5) * range,
              position.z + (Math.random() - 0.5) * range
            );

          particle.targetPosition = randomTargetPosition;
          particle.position = position;
          mesh.position.copy(position);
        }
      });
    }
  });

  return (
    <>
      <group ref={groupRef}>
      </group>
    </>
  );
};
