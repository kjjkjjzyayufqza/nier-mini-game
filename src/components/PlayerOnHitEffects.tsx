import React, { useEffect, useRef } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { TextureLoader } from 'three'
import PubSub from "pubsub-js";
import { useFixedFrameUpdate } from "../hook/useFixedFrameUpdate";
import { useTexture } from "@react-three/drei";

const PlayerOnHitEffectOutsideExpandingRing = () => {
  const materialRef = useRef<any>(null);
  const meshRef = useRef<any>(null);
  const shaderMaterialRef = useRef<any>(null);

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
    uniform float uRadius; // 当前圆环半径
    uniform float uMaxRadius; // 最大圆环半径
    varying vec2 vUv;
    uniform float innerRadiusValue; // 内圈模糊的宽度
    uniform float outerRadiusValue; // 外圈清晰的宽度
    uniform float opacity; // 圆环透明度

    void main() {
      // 计算当前像素到中心点的距离
      vec2 center = vec2(0.5, 0.5); // UV 的中心点
      float dist = distance(vUv, center);

      // 定义圆环的内外边界
      float innerRadius = uRadius - innerRadiusValue; // 圆环的内边界
      float outerRadius = uRadius + outerRadiusValue; // 圆环的外边界

      // 创建一个圆环效果
      float ring = smoothstep(innerRadius - 0.02 - (uRadius / 5.0), innerRadius, dist) - step(outerRadius, dist);

      // 外圈清晰，内圈模糊
      float innerFade = smoothstep(innerRadius, innerRadius, dist); // 内圈模糊渐变
      ring *= (1.0 - innerFade); // 内圈模糊效果

      // 外圈透明渐变（根据最大半径）
      float fade = 2.5 - smoothstep(uRadius, uMaxRadius, dist);

      // 最终颜色：白色圆环，内部模糊，外圈清晰，整体透明度随时间减少
      gl_FragColor = vec4(vec3(1.0), ring * fade * opacity);
    }
  `;

  if (!shaderMaterialRef.current) {
    shaderMaterialRef.current = new THREE.ShaderMaterial({
      uniforms: {
        uRadius: { value: 0 }, // 初始圆环半径
        uMaxRadius: { value: 1 }, // 最大圆环半径
        innerRadiusValue: { value: 0 }, // 内圈模糊宽度
        outerRadiusValue: { value: 1 }, // 外圈清晰宽度
        opacity: { value: 1.0 }, // 圆环透明度
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });
  }

  // 动态更新圆环的半径和透明度
  useFixedFrameUpdate((scene, delta) => {
    if (materialRef.current && meshRef.current.visible) {
      const uniforms = materialRef.current.uniforms;

      // 动态增加圆环半径
      uniforms.uRadius.value += 0.01

      if (uniforms.uRadius.value > 0.2) {
        uniforms.opacity.value -= 0.03
      }

      // 重置效果（可选）
      if (uniforms.uRadius.value > 0.5) {
        meshRef.current.visible = false;
        // uniforms.uRadius.value = 0; // 重置半径
        // uniforms.opacity.value = 1.0; // 重置透明度
      }
    }
  });

  useEffect((() => {
    const token = PubSub.subscribe('startPlayerOnHitOutsideExpandingRingEffect', () => {
      meshRef.current.visible = true;
      materialRef.current.uniforms.uRadius.value = 0;
      materialRef.current.uniforms.opacity.value = 1.0;
    })
    return () => {
      PubSub.unsubscribe(token)
    }
  }), [])

  return (
    <mesh ref={meshRef} visible={false}>
      <planeGeometry args={[1, 1]} />
      <primitive object={shaderMaterialRef.current} ref={materialRef} />
    </mesh>
  );
};

const PlayerOnHitEffectInsideExpandingRing = () => {
  const materialRef = useRef<any>(null);
  const meshRef = useRef<any>(null);
  const shaderMaterialRef = useRef<any>(null);
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
    uniform float uRadius; // 当前圆环半径
    uniform float uMaxRadius; // 最大圆环半径
    varying vec2 vUv;
    uniform float innerRadiusValue; // 内圈模糊的宽度
    uniform float outerRadiusValue; // 外圈清晰的宽度
    uniform float opacity; // 圆环透明度

    void main() {
  // 计算当前像素到中心点的距离
  vec2 center = vec2(0.5, 0.5); // UV 的中心点
  float dist = distance(vUv, center);

  // 定义圆环的内外边界
  float innerRadius = uRadius - innerRadiusValue; // 圆环的内边界
  float outerRadius = uRadius + outerRadiusValue; // 圆环的外边界

  // 创建一个清晰的圆环（内部完全透明，边缘无渐变）
  float ring = step(innerRadius, dist) - step(outerRadius, dist);
  ring *= 2.0;

  // 为圆环的外层添加渐变透明效果
  float fade = 1.0 - smoothstep(uRadius, uMaxRadius, dist);

  // 最终颜色：白色圆环，内部透明，外环渐变透明，整体透明度随时间减少
  gl_FragColor = vec4(vec3(1.0), ring * fade * opacity);
    }
  `;

  // 创建 ShaderMaterial
  if (!shaderMaterialRef.current) {
    shaderMaterialRef.current = new THREE.ShaderMaterial({
      uniforms: {
        uRadius: { value: 0 }, // 初始圆环半径
        uMaxRadius: { value: 1 }, // 最大圆环半径
        innerRadiusValue: { value: 0.002 }, // 内圈模糊宽度
        outerRadiusValue: { value: 0.002 }, // 外圈清晰宽度
        opacity: { value: 1.0 }, // 圆环透明度
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });
  }

  // 动态更新圆环的半径和透明度
  useFixedFrameUpdate((scene, delta) => {
    if (materialRef.current && meshRef.current.visible) {
      const uniforms = materialRef.current.uniforms;

      // 动态增加圆环半径
      uniforms.uRadius.value += 0.009

      if (uniforms.uRadius.value > 0.2) {
        uniforms.opacity.value -= 0.03
      }

      // 重置效果（可选）
      if (uniforms.uRadius.value > 0.5) {
        meshRef.current.visible = false;
        // uniforms.uRadius.value = 0; // 重置半径
        // uniforms.opacity.value = 1.0; // 重置透明度
      }
    }
  });

  useEffect((() => {
    const token = PubSub.subscribe('startPlayerOnHitInsideExpandingRingEffect', () => {
      meshRef.current.visible = true;
      materialRef.current.uniforms.uRadius.value = 0;
      materialRef.current.uniforms.opacity.value = 1.0;
    })
    return () => {
      PubSub.unsubscribe(token)
    }
  }), [])

  return (
    <mesh ref={meshRef} visible={false}>
      <planeGeometry args={[0.8, 0.8]} />
      <primitive object={shaderMaterialRef.current} ref={materialRef} />
    </mesh>
  );
};


export const PlayerOnHitLightningEffect = () => {
  const groupRef = useRef<any>(null);
  const lightningGroupRef = useRef<any>(null);
  const colorMap = useTexture('/nier/texture/—Pngtree—thunder png free vector art_8133602.png')
  const effectSpawnTime = useRef<number>(0);
  const lightningRef = useRef<any>(null);
  const lightRef = useRef<any>(null);

  useFixedFrameUpdate((scene, delta) => {
    if (groupRef.current && lightningRef.current && lightRef.current &&
      groupRef.current.visible
    ) {
      effectSpawnTime.current += delta;
      lightRef.current.material.opacity -= 0.1;
      if (effectSpawnTime.current > 0.1) {
        lightningRef.current.material.opacity -= 0.1;
      }

      if (lightningRef.current.material.opacity <= 0) {
        lightningRef.current.visible = false;
      }

      if (lightRef.current.material.opacity <= 0) {
        lightRef.current.visible = false
      }

      if (effectSpawnTime.current > 2) {
        groupRef.current.visible = false;
      }
    }
  })

  useEffect(() => {
    const playerOnHitEffectToken = PubSub.subscribe('playerOnHitEffect', (msg: any, data: {
      position: THREE.Vector3
    }) => {
      effectSpawnTime.current = 0;
      groupRef.current.visible = true;
      groupRef.current.position.copy(data.position);
      lightningRef.current.material.opacity = 1;
      lightningRef.current.visible = true;
      lightningRef.current.rotation.z = Math.random() * Math.PI * 3;
      lightRef.current.material.opacity = 1;
      lightRef.current.visible = true;
      PubSub.publish('startPlayerOnHitOutsideExpandingRingEffect')
      PubSub.publish('startPlayerOnHitInsideExpandingRingEffect')
      PubSub.publish('startPlayerOnHitBlackHole')
    })
    return () => {
      PubSub.unsubscribe(playerOnHitEffectToken)
    }
  }, [])

  return (
    <group rotation={[Math.PI / -2, 0, 0]} ref={groupRef} visible={false}>
      <group ref={lightningGroupRef}>
        <mesh ref={lightningRef} visible={true}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshStandardMaterial map={colorMap} transparent opacity={1} depthWrite={false} />
        </mesh>
        <mesh ref={lightRef} visible={true}>
          <circleGeometry args={[0.05, 12]} />
          <meshStandardMaterial color={'#FEFEFC'} transparent opacity={0.5} emissive={'#FEFEFC'} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
};

const PlayerOnHitBlackHole = () => {
  const groupRef = useRef<any>(null);
  const timer = useRef<number>(0);
  const ringMaterialRef1 = useRef<any>(null);
  const ringMaterialRef2 = useRef<any>(null);
  const ringMaterialRef3 = useRef<any>(null);
  const sphereMaterialRef = useRef<any>(null);

  useEffect(() => {
    const playerOnHitEffectToken = PubSub.subscribe('startPlayerOnHitBlackHole', (msg: any, data: {}) => {
      setTimeout(() => {
        groupRef.current.visible = true;
        timer.current = 0;
        ringMaterialRef1.current.opacity = 0.7;
        ringMaterialRef2.current.opacity = 0.4;
        ringMaterialRef3.current.opacity = 0.1;
        ringMaterialRef1.current.visible = true;
        ringMaterialRef2.current.visible = true;
        ringMaterialRef3.current.visible = true;
      }, 400)
    })
    return () => {
      PubSub.unsubscribe(playerOnHitEffectToken)
    }
  }, [])

  useFixedFrameUpdate((scene, delta) => {
    if (groupRef.current && groupRef.current.visible) {
      timer.current += delta;
      ringMaterialRef1.current.opacity -= 0.015;
      ringMaterialRef2.current.opacity -= 0.015;
      ringMaterialRef3.current.opacity -= 0.015;
      if (ringMaterialRef1.current.opacity <= 0) {
        ringMaterialRef1.current.visible = false;
      }
      if (ringMaterialRef2.current.opacity <= 0) {
        ringMaterialRef2.current.visible = false;
      }
      if (ringMaterialRef3.current.opacity <= 0) {
        ringMaterialRef3.current.visible = false;
      }

      if (timer.current > 0.7) {
        groupRef.current.visible = false;
      }
    }
  })

  return <group ref={groupRef} visible={false}>
    <mesh>
      <ringGeometry args={[0.136, 0.16, 32]} />
      <meshStandardMaterial color={'#000000'} transparent opacity={0.7} depthWrite={false} ref={ringMaterialRef1} />
    </mesh>
    <mesh position={[0, 0, 0.02]}>
      <ringGeometry args={[0.13, 0.15, 32]} />
      <meshStandardMaterial color={'#000000'} transparent opacity={0.4} depthWrite={false} ref={ringMaterialRef2} />
    </mesh>
    <mesh position={[0, 0, 0.00]}>
      <ringGeometry args={[0.12, 0.12, 32]} />
      <meshStandardMaterial color={'#ffffff'} transparent opacity={0.01} depthWrite={false} ref={ringMaterialRef3} />
    </mesh>
    <mesh position={[0, 0, 0.00]}>
      <sphereGeometry args={[0.12, 16, 32]} />
      <meshStandardMaterial color={'#ffffff'} transparent opacity={0.01} depthWrite={false} ref={sphereMaterialRef} />
    </mesh>
  </group>
}


// 与player绑定位置
export const PlayerOnHitExpandingRingEffect = () => {
  return <group rotation={[Math.PI / -2, 0, 0]}>
    <group >
      <PlayerOnHitEffectOutsideExpandingRing />
      <PlayerOnHitEffectInsideExpandingRing />
    </group>
    <PlayerOnHitBlackHole />
  </group>
}

useTexture.preload('/nier/texture/—Pngtree—thunder png free vector art_8133602.png')