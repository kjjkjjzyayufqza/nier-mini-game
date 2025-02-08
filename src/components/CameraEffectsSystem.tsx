import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import PubSub from "pubsub-js";
import { vec3 } from "@react-three/rapier";
import { Html } from "@react-three/drei";

const CameraShakeEffect = () => {
    const enable = useRef(false);
    const { camera } = useThree(); // 获取当前场景的相机
    const shakeIntensity = useRef(0); // 抖动强度
    const shakeDuration = useRef(0); // 抖动持续时间
    const shakeTimeElapsed = useRef(0); // 已经过的时间

    const originalPosition = useRef(vec3()); // 记录相机的初始位置

    useEffect(() => {
        // 记录相机的初始位置和旋转
        originalPosition.current.copy(camera.position);

        // 初始化抖动参数
        shakeIntensity.current = 0.03; // 初始抖动强度
        shakeDuration.current = 0.8; // 抖动持续时间（秒）
        shakeTimeElapsed.current = 0; // 重置时间
    }, [camera]);

    useFrame((state, delta) => {
        if (!camera) return;
        if (!originalPosition.current) return;
        if (!enable.current) return;
        if (shakeTimeElapsed.current < shakeDuration.current) {
            // 更新时间
            if (enable.current) {
                shakeTimeElapsed.current += delta;

                // 计算剩余的抖动强度（线性衰减）
                const progress = shakeTimeElapsed.current / shakeDuration.current;
                const intensity = shakeIntensity.current * (1 - progress); // 强度随时间减弱

                // 随机生成抖动偏移
                const offsetX = (Math.random() - 0.5) * intensity; // X方向随机偏移
                const offsetY = (Math.random() - 0.5) * intensity; // Y方向随机偏移
                const offsetZ = (Math.random() - 0.5) * intensity; // Z方向随机偏移

                // 应用抖动到相机
                camera.position.set(
                    originalPosition.current.x + offsetX,
                    originalPosition.current.y + offsetY,
                    originalPosition.current.z + offsetZ
                );
            }
        } else {
            // 抖动结束后复原相机到初始位置和旋转
            camera.position.copy(originalPosition.current);
            enable.current = false;
        }
    });

    useEffect(() => {
        const startCameraShakeToken = PubSub.subscribe("startCameraShake", (msg: string, data: {}) => {
            enable.current = true;
            shakeTimeElapsed.current = 0;
        });
        return () => {
            PubSub.unsubscribe(startCameraShakeToken);
        };
    })

    return null;
};

const CameraRedHitEffect = () => {
    const { camera, size, viewport } = useThree();
    const meshRef = useRef<any>(null);

    // 创建 ShaderMaterial
    const maskMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0.0 },
            },
            vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
            fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
  
          void main() {
            // 将 UV 坐标映射到 [-1, 1]
            vec2 uv = vUv * 2.0 - 1.0;
  
            // 定义遮罩的形状
            float radius = 1.1; // 中心透明区域的大小
            float edgeSoftness = 0.5; // 边缘的柔和程度
  
            // 计算不规则形状的边界
            float ellipse = pow(uv.x, 2.0) * 1.2 + pow(uv.y, 2.0);
            float mask = smoothstep(radius, radius - edgeSoftness, ellipse);
  
            // 红色区域
            vec3 color = mix(vec3(1.0, 0.0, 0.0), vec3(0.0), mask);

            float alpha = (1.0 - mask) * max(0.0, 0.1 - uTime);
  
            gl_FragColor = vec4(color, alpha);
          }
        `,
            transparent: true,
            depthWrite: false,
        });
    }, [size]);

    useEffect(() => {
        if (meshRef.current) {
            const width = viewport.width;
            const height = viewport.height;
            meshRef.current.scale.set(width, height, 1);
        }

    }, [size, maskMaterial]);

    useFrame((state, delta) => {
        if (maskMaterial && meshRef.current && meshRef.current.visible) {
            maskMaterial.uniforms.uTime.value += delta / 5;

            if (maskMaterial.uniforms.uTime.value > 0.2) {
                meshRef.current.visible = false;
                maskMaterial.uniforms.uTime.value = 0;
            }
        }
    });

    useEffect(() => {
        const startCameraRedHitEffectToken = PubSub.subscribe("startCameraRedHitEffect", (msg: string, data: {}) => {
            meshRef.current.visible = true;
            maskMaterial.uniforms.uTime.value = 0;
        })
        return () => {
            PubSub.unsubscribe(startCameraRedHitEffectToken);
        };
    }, [])

    return (
        <mesh rotation={[Math.PI / -2, 0, 0]} ref={meshRef} visible={false}>
            <planeGeometry args={[1, 1]} />
            <primitive object={maskMaterial} attach="material" />
        </mesh>
    );
};


export default function CameraEffectsSystem() {

    useEffect(() => {
        const startOnHitCameraEffectToken = PubSub.subscribe('startOnHitCameraEffect', (msg: string, data: {}) => {
            PubSub.publish('startCameraShake', {});
            PubSub.publish('startCameraRedHitEffect', {});
        })
        return () => {
            PubSub.unsubscribe(startOnHitCameraEffectToken)
        }
    }, [])

    return (
        <group>
            <CameraShakeEffect />
            <CameraRedHitEffect />
        </group>
    )
}
