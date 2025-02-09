import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import PubSub from 'pubsub-js';
import { useFixedFrameUpdate } from '../hook/useFixedFrameUpdate';

export const HitEffectExpandingRing = ({
  id,
  planeSize = 0.45,
  maxRadius = 0.43,
  innerRadiusValue = 0.05,
  outerRadiusValue = 0.05,
  opacity = 0.1,
  color,
  expandSpeed = 5
}: {
  id: string,
  planeSize?: number,
  maxRadius?: number,
  innerRadiusValue?: number,
  outerRadiusValue?: number,
  opacity?: number,
  color?: string,
  expandSpeed?: number
}) => {

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
uniform float uOverallAlpha; // 整体透明度
uniform vec3 uColor; // 圆环颜色
varying vec2 vUv;
uniform float innerRadiusValue;
uniform float outerRadiusValue;
uniform float opacity;

void main() {
  // 计算当前像素到中心点的距离
  vec2 center = vec2(0.5, 0.5); // UV 的中心点
  float dist = distance(vUv, center);

  // 定义圆环的内外边界
  float innerRadius = uRadius - innerRadiusValue; // 圆环的内边界
  float outerRadius = uRadius + outerRadiusValue; // 圆环的外边界

  // 创建一个清晰的圆环（内部完全透明，边缘无渐变）
  float ring = step(innerRadius, dist) - step(outerRadius, dist);
  ring *= opacity;

  // 为圆环的外层添加渐变透明效果
  float fade = 1.0 - smoothstep(uRadius, uMaxRadius, dist);

  // 最终颜色：白色圆环，内部透明，外环渐变透明，整体透明度随时间减少
  gl_FragColor = vec4(uColor, ring * fade * uOverallAlpha);
}
`;

  const materialRef = useRef<any>(null);
  const expandingRingRef = useRef<any>(null);

  // 控制圆环的当前半径
  const radius = useRef(0);

  useFixedFrameUpdate((state, delta) => {
    if (materialRef.current) {
      if (radius.current > maxRadius) {
        // 超过最大半径后隐藏
        expandingRingRef.current.visible = false;
        return;
      }
      radius.current += THREE.MathUtils.lerp(0, maxRadius, delta * expandSpeed); // 逐渐增加半径

      // 更新圆环半径和整体透明度
      materialRef.current.uniforms.uRadius.value = radius.current;

      // 根据半径动态减少整体透明度
      const overallAlpha = Math.max(1 - radius.current / maxRadius, 0.0); // 从 1.0 减少到 0.0
      materialRef.current.uniforms.uOverallAlpha.value = overallAlpha;
    }
  });

  useEffect(() => {
    const startHitExpandingRingAnimationToken = PubSub.subscribe(id, (msg: string, data: { position: THREE.Vector3 }) => {
      // 重置圆环半径
      radius.current = 0;
      expandingRingRef.current.position.copy(data.position);
      expandingRingRef.current.visible = true;
    });
    return () => {
      PubSub.unsubscribe(startHitExpandingRingAnimationToken);
    };
  }, []);

  return (
    <mesh rotation={[Math.PI / -2, 0, 0]} ref={expandingRingRef} visible={false}>
      <planeGeometry args={[planeSize, planeSize, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        uniforms={{
          uRadius: { value: 0 }, // 动态半径
          uMaxRadius: { value: maxRadius }, // 最大半径
          uOverallAlpha: { value: 1.0 }, // 整体透明度
          uColor: { value: new THREE.Color(color || 'white') }, // 颜色
          innerRadiusValue: { value: innerRadiusValue },
          outerRadiusValue: { value: outerRadiusValue },
          opacity: { value: opacity }
        }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

export const HitEffectExpandingRingEffects = () => {

  const hitEffectExpandingRingGroupRef = useRef<any>(null);
  const HIT_EFFECTS_COUNT = 10;
  const HIT_BOUNDARY_EFFECTS_COUNT = 10
  const hitEffectExpandingRingIndex = useRef<number>(0);
  const hitEffectExpandingRingBoundaryIndex = useRef<number>(0);

  useEffect(() => {
    const startHitExpandingRingAnimationToken = PubSub.subscribe('startHitExpandingRingAnimation', (msg: string, data: { position: THREE.Vector3 }) => {
      PubSub.publish(`hitEffectExpandingRing_${hitEffectExpandingRingIndex.current}`, {
        position: data.position
      });
      hitEffectExpandingRingIndex.current = (hitEffectExpandingRingIndex.current + 1) % HIT_EFFECTS_COUNT;
    })
    const startHitExpandingRingBoundaryAnimationToken = PubSub.subscribe('startHitExpandingRingBoundaryAnimation', (msg: string, data: { position: THREE.Vector3 }) => {
      PubSub.publish(`hitEffectExpandingRingBoundary_${hitEffectExpandingRingIndex.current}`, {
        position: data.position
      });
      hitEffectExpandingRingBoundaryIndex.current = (hitEffectExpandingRingBoundaryIndex.current + 1) % HIT_BOUNDARY_EFFECTS_COUNT;
    })
    return () => {
      PubSub.unsubscribe(startHitExpandingRingAnimationToken);
      PubSub.unsubscribe(startHitExpandingRingBoundaryAnimationToken);
    };
  }, []);

  return <group ref={hitEffectExpandingRingGroupRef}>
    {Array.from({ length: HIT_EFFECTS_COUNT }).map((_, index) => <HitEffectExpandingRing key={index} id={`hitEffectExpandingRing_${index}`} />)}
    {Array.from({ length: HIT_BOUNDARY_EFFECTS_COUNT }).map((_, index) => <HitEffectExpandingRing key={index} id={`hitEffectExpandingRingBoundary_${index}`}
      opacity={0.8}
      outerRadiusValue={0.002}
      innerRadiusValue={0.002}
    />)}
  </group>
}