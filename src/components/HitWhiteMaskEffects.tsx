import * as THREE from "three";
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import PubSub from "pubsub-js";
import { vec3 } from "@react-three/rapier";

const HitWhiteMask = ({ id, container }: { id: string, container: { x: number, y: number } }) => {
    const planeRef = useRef<any>(null);
    const materialRef = useRef<any>(null);

    // 自定义 ShaderMaterial
    const shaderMaterial = {
        uniforms: {
            uTime: { value: 0 },          // 初始时间
            uAlpha: { value: 1 },       // 最大透明度
            uMaskRadius: { value: 0.5 },  // 遮罩半径
            uPlaneSize: { value: { x: container.x, y: container.y } }, // 平面大小
            uEdgeSoftness: { value: 1 }, // 边缘模糊程度
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
uniform float uTime;       // 时间
uniform float uAlpha;      // 初始透明度
uniform float uMaskRadius; // 遮罩半径
uniform vec2 uPlaneSize;   // 平面大小
uniform float uEdgeSoftness; // 边缘模糊程度

varying vec2 vUv;

void main() {
    // 将 UV 坐标转换到以平面中心为原点的坐标系
    vec2 centeredUv = vUv - vec2(0.5);

    // 归一化平面比例，确保圆形不会因为平面比例而变形
    vec2 normalizedUv = centeredUv * uPlaneSize / max(uPlaneSize.x, uPlaneSize.y);

    // 计算当前片段到圆心的距离
    float dist = length(normalizedUv);

    // 边缘模糊处理
    float edgeStart = uMaskRadius - uEdgeSoftness; // 模糊起始位置
    float edgeAlpha = smoothstep(uMaskRadius, edgeStart, dist); // 边缘透明度过渡

    // 整体透明度处理
    float overallAlpha = uAlpha * (1.0 - uTime); // 整体透明度随时间减弱

    if(overallAlpha < 0.0) {
        discard; // 透明度小于 0 时丢弃片段
    }

    // 最终透明度
    float alpha = edgeAlpha * overallAlpha;

    // 设置遮罩颜色和透明度
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}
        `,
        transparent: true,
    };


    // 动画帧更新
    useFrame((state, delta) => {
        if (materialRef.current.uniforms.uTime.value < 1.0) {
            materialRef.current.uniforms.uTime.value += delta * 3; // 增加时间
        } else {
            planeRef.current.visible = false; // 时间结束后隐藏平面
        }
    });

    // 订阅事件触发效果
    useEffect(() => {
        const token = PubSub.subscribe(
            id,
            (msg: string, data: { position: THREE.Vector3 }) => {
                // 显示平面并重置时间
                planeRef.current.visible = true;
                planeRef.current.position.copy(data.position);
                materialRef.current.uniforms.uTime.value = 0; // 重置时间
                materialRef.current.uniforms.uAlpha.value = 1.0; // 重置透明度
            }
        );

        return () => {
            PubSub.unsubscribe(token);
        };
    }, []);

    return (
        <mesh ref={planeRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
            {/* 平面几何体 */}
            <planeGeometry args={[container.x, container.y]} />
            {/* ShaderMaterial */}
            <shaderMaterial ref={materialRef} args={[shaderMaterial]} depthWrite={false} />
        </mesh>
    );
}

export const HitWhiteMaskEffects = () => {
    const HIT_WHITE_MASK_COUNT = 5; // 遮罩数量
    const hitWhiteMaskIndex = useRef<number>(0);

    useEffect(() => {
        const startHitWHiteMaskEffectToken = PubSub.subscribe(
            "hitWhiteMaskEffects",
            (msg: any, data: { position: THREE.Vector3 }) => {
                PubSub.publish(`startHitWhiteMaskEffects_${hitWhiteMaskIndex.current}`, {
                    position: vec3(data.position),
                });
                hitWhiteMaskIndex.current = (hitWhiteMaskIndex.current + 1) % HIT_WHITE_MASK_COUNT;
            }
        );
        return () => {
            PubSub.unsubscribe(startHitWHiteMaskEffectToken);
        }
    }, [])

    return (<>
        {Array.from({ length: HIT_WHITE_MASK_COUNT }).map((_, index) => (
            <HitWhiteMask key={index} id={`startHitWhiteMaskEffects_${index}`} container={{
                x: 0.28,
                y: 0.28
            }} />
        ))}
    </>)
};
