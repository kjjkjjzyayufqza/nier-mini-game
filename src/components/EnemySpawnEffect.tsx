import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";
import { vec3 } from "@react-three/rapier";
import PubSub from "pubsub-js";


const SpawnLightEffect = ({ id }: { id: string }) => {
  const materialRef = useRef<any>(null);
  const elapsedTime = useRef(0); // 用于累积时间
  const spawnLightEffectRef = useRef<any>(null);

  const vertexShader = `
uniform float uTime;

varying vec2 vUv;
varying float vStretchFactor;

void main() {
  vUv = uv;

  // 时间控制拉伸
  float stretchFactor = smoothstep(0.0, 1.0, clamp(uTime * 2.5, 0.0, 1.0));
  vStretchFactor = stretchFactor;

  // 挤压形变：从圆形到长方形
  vec3 transformedPosition = position;
  transformedPosition.x *= mix(1.0, 2.0, stretchFactor); // 拉长 x 轴
  transformedPosition.y *= mix(1.0, 0.05, stretchFactor); // 压缩 y 轴

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);
}

`;

  const fragmentShader = `
uniform float uTime;

varying vec2 vUv;
varying float vStretchFactor;

void main() {
  // 计算从中心的距离，用于圆形渐变
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(vUv, center);

  // 圆形渐隐
  float radialAlpha = smoothstep(0.5, 0.0, dist);

  // 时间渐隐
  float timeAlpha = smoothstep(3.0, 0.0, clamp(uTime * 10.0, 0.0, 3.0));

  // 最终透明度
  float alpha = radialAlpha * timeAlpha;

  // 自发光红色
  vec3 baseColor = vec3(1.0, 0.12, 0.34); // 红色
  vec3 glow = baseColor * 3.0; // 增强亮度模拟自发光

  // 根据 alpha 混合基础颜色和发光效果
  vec3 finalColor = mix(baseColor, glow, alpha);

  gl_FragColor = vec4(finalColor, alpha);
}
`;

  useFrame((state, delta) => {
    if (materialRef.current && spawnLightEffectRef.current.visible) {
      elapsedTime.current += delta;
      materialRef.current.uniforms.uTime.value = elapsedTime.current;
    }
  });

  useEffect(() => {
    const token = PubSub.subscribe(`enemySpawnLightEffect_${id}`, () => {
      // 重置时间并显示效果
      elapsedTime.current = 0;
      materialRef.current.uniforms.uTime.value = 0;
      spawnLightEffectRef.current.visible = true;
    });

    return () => {
      PubSub.unsubscribe(token);
    };
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} ref={spawnLightEffectRef} visible={false}>
      <planeGeometry args={[1.6, 0.04, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
        }}
        transparent={true}
      />
    </mesh>
  );
};


const SpawnParticleEffect = ({ id }: { id: string }) => {
  const meshRef = useRef<any>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const COUNT = 100

  // 初始化粒子的属性
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < COUNT; i++) {
      // 随机选择是左侧还是右侧
      const isLeft = Math.random() < 0.5;

      const angle = isLeft
        ? THREE.MathUtils.randFloat((-15 * Math.PI) / 180, (15 * Math.PI) / 180) // 左侧方向
        : THREE.MathUtils.randFloat((105 * Math.PI) / 180, (165 * Math.PI) / 180); // 右侧方向

      temp.push({
        // 初始位置随机分布在水平线（x 和 z 随机）
        x: THREE.MathUtils.randFloat(-1, 1),
        y: 0,
        z: THREE.MathUtils.randFloat(-0.01, 0.01),
        initialX: THREE.MathUtils.randFloat(-1, 1), // 固定的初始 X 位置
        initialZ: THREE.MathUtils.randFloat(-0.01, 0.01), // 固定的初始 Z 位置
        // 随机的扩散方向
        direction: vec3({ x: Math.cos(angle), y: 0, z: Math.sin(angle) }).normalize(),
        // 随机的扩散速度
        speed: THREE.MathUtils.randFloat(0.1, 0.5), // 扩散速度
        // 随机的旋转速度
        rotationSpeed: THREE.MathUtils.randFloat(0.0002, 0.0002),
        // 随机的生命周期
        life: 2, // 粒子的存在时间
        // 初始静止时间
        delay: 0.001, // 保持静止的时间
        // 随机的缩放大小
        scale: THREE.MathUtils.randFloat(0.02, 0.04),
        // 记录开始时间
        startTime: 0,
      });
    }
    return temp;
  }, []);

  // 动画更新
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    particles.forEach((particle, i) => {
      const { x, z, life, rotationSpeed, direction, speed, scale, delay } = particle;

      // 更新生命周期
      particle.life -= delta;

      // 静止阶段
      if (particle.delay > 0) {
        particle.delay -= delta; // 减少静止时间
        dummy.position.set(particle.x, particle.y, particle.z);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        return; // 粒子保持静止，不移动
      }

      // 扩散阶段
      particle.x += direction.x * speed * delta; // 沿着随机方向扩散
      particle.z += direction.z * speed * delta;

      if (particle.life > 1.9) {
        // 粒子沿预设方向移动
        particle.x += direction.x * speed * delta; // 沿着随机方向扩散
        particle.z += direction.z * speed * delta;
      } else {
        // 无限符号运动阶段
        const t = (state.clock.elapsedTime - particle.startTime) * 2; // 时间因子，控制速度
        const w = 0.8; // 无限符号的水平宽度
        const h = 0.4; // 无限符号的垂直高度

        // 更新粒子位置为无限符号轨迹
        particle.x += w * Math.cos(t) * delta * 0.5; // 水平轨迹
        particle.z += h * Math.sin(2 * t) * delta * 0.5; // 垂直轨迹
      }

      // 计算透明度（根据生命周期线性减少）
      const opacity = Math.max(0, particle.life / 1.5);

      // 更新实例矩阵
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.rotation.y += rotationSpeed; // 自转
      dummy.scale.set(scale, scale, scale);


      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.material.opacity = opacity;
    });

    // 通知 Three.js 更新实例化的几何体
    meshRef.current.instanceMatrix.needsUpdate = true;

  });

  const triangleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -0.5, 0, 0, // 左下角
      0.5, 0, 0,  // 右下角
      0, 1, 0,    // 顶点
    ]);
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.computeVertexNormals(); // 计算法线
    geometry.rotateX(Math.PI / -2); // 旋转到水平面
    geometry.scale(0.15, 0.15, 0.15); // 缩放
    return geometry;
  }, []);

  useEffect(() => {
    const token = PubSub.subscribe(`enemySpawnParticleEffect_${id}`, () => {
      particles.forEach((particle, i) => {
        // 重置粒子属性
        particle.life = 2; // 重新设置生命周期
        particle.delay = 0.001; // 重新设置静止时间
        particle.x = particle.initialX; // 重新设置初始位置
        particle.z = particle.initialZ; // 重新设置初始位置
        particle.startTime = 0; // 记录当前时间
      });
    });

    return () => {
      PubSub.unsubscribe(token);
    };
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[triangleGeometry, undefined, COUNT]}>
      <meshStandardMaterial color="white" transparent opacity={0.8} emissive={'#de4141'} emissiveIntensity={5} />
    </instancedMesh>
  );
};

export const EnemySpawnEffect = () => {
  const enemySpawnEffectIndexRef = useRef<number>(0);
  const enemySpawnEffectRef1 = useRef<any>(null);
  const enemySpawnEffectRef2 = useRef<any>(null);
  const enemySpawnEffectRef3 = useRef<any>(null);
  const enemySpawnEffectRef4 = useRef<any>(null);
  const enemySpawnEffectRef5 = useRef<any>(null);
  const enemySpawnEffectRef6 = useRef<any>(null);
  const enemySpawnEffectRef7 = useRef<any>(null);
  const enemySpawnEffectRef8 = useRef<any>(null);
  const enemySpawnEffectRef9 = useRef<any>(null);
  const enemySpawnEffectRef10 = useRef<any>(null);
  const refs = [enemySpawnEffectRef1, enemySpawnEffectRef2, enemySpawnEffectRef3, enemySpawnEffectRef4, enemySpawnEffectRef5, enemySpawnEffectRef6, enemySpawnEffectRef7, enemySpawnEffectRef8, enemySpawnEffectRef9, enemySpawnEffectRef10]

  useEffect(() => {
    const enemySpawnEffectToken = PubSub.subscribe("enemySpawnEffect", (msg: any, data: { position: THREE.Vector3 }) => {
      PubSub.publish(`enemySpawnLightEffect_${enemySpawnEffectIndexRef.current}`, null);
      PubSub.publish(`enemySpawnParticleEffect_${enemySpawnEffectIndexRef.current}`, null);
      refs[enemySpawnEffectIndexRef.current].current.position.copy(data.position)
      refs[enemySpawnEffectIndexRef.current].current.visible = true
      enemySpawnEffectIndexRef.current = (enemySpawnEffectIndexRef.current + 1) % refs.length

    })
    return () => {
      PubSub.unsubscribe(enemySpawnEffectToken)
    }
  }, [])
  return <>
    {refs.map((_, i) => (
      <group visible={false} key={i} ref={_}>
        <SpawnLightEffect id={`${i}`} />
        <SpawnParticleEffect id={`${i}`} />
      </group>
    ))}
  </>
}
