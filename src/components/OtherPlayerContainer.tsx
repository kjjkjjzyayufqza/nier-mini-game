import { Html, useGLTF } from "@react-three/drei";
import { vec3 } from "@react-three/rapier";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import usePlayerStore from "../store/PlayerStore";
import { useFixedFrameUpdate } from "../hook/useFixedFrameUpdate";
import { LevaInputs, Schema } from "leva/plugin";
import { useControls } from "leva";


const HexagonContainer = () => {
    const [radius, setRadius] = useState<number>(0.15) // 六边形的半径
    const { nodes: playerNodes, scene: playerModel } = useGLTF("./nier/player.glb");
    const hexagonContainerRef = useRef<any>(null);
    const otherPlayerRefs = useRef<any[]>([]);
    const destroyOtherPlayerIndexRefs = useRef<number>(0);
    const [rotationSpeed, setRotationSpeed] = useState<number>(0.0579);
    const [maxPlayerCount, setMaxPlayerCount] = useState<number>(6);
    const playerOptions = useCallback(() => {
        const value: Schema = {
            helpPlayerCount: {
                label: "Other Player Count",
                value: maxPlayerCount,
                type: LevaInputs.NUMBER,
                min: 6,
                max: 60,
                step: 1,
                onChange: (v) => {
                    setMaxPlayerCount(v)
                }
            },
            centerRange: {
                label: "Center Range",
                value: radius,
                min: 0.15,
                max: 1,
                onChange: (v) => {
                    setRadius(v)
                }
            },
            rotationSpeed: {
                label: "Rotation Speed",
                value: rotationSpeed,
                min: 0,
                max: 0.20,
                onChange: (v) => {
                    setRotationSpeed(v)
                }
            }
        }
        return value
    }, [])
    const pPlayer = useControls('Player', playerOptions)

    const hexagon = useMemo(() => {
        const shape = new THREE.Shape();
        for (let i = 0; i < maxPlayerCount; i++) {
            const angle = (i / maxPlayerCount) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            if (i === 0) {
                shape.moveTo(x, y); // 第一个顶点
            } else {
                shape.lineTo(x, y); // 其他顶点
            }
        }
        shape.closePath(); // 闭合路径
        return shape;
    }, [radius, maxPlayerCount])

    const vertices = useMemo(() => {
        const points = [];
        for (let i = 0; i < maxPlayerCount; i++) {
            const angle = (i / maxPlayerCount) * Math.PI * 2; // 每个顶点的角度
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            points.push([x, y, 0]); // z 坐标为 0
        }
        return points;
    }, [radius, maxPlayerCount]);

    const clonedModels = useMemo(() => {
        return vertices.map(() => clone(playerModel));
    }, [playerModel, vertices]);

    useFixedFrameUpdate((state, delta) => {
        if (hexagonContainerRef.current) {
            hexagonContainerRef.current.rotation.z += rotationSpeed;
            //获取player_rigidbody的旋转方向，并且为每个otherPlayer设置相同的rotation和angle
            const mainPlayer = hexagonContainerRef.current.parent?.getObjectByName("player_rigidbody_group");
            if (mainPlayer) {
                hexagonContainerRef.current.children.forEach((child: any) => {
                    if (child.name.startsWith("other_player_")) {
                        // 计算偏差值
                        const offsetZ = hexagonContainerRef.current.rotation.z;

                        // 应用主玩家的旋转并去除偏差
                        child.rotation.set(
                            Math.PI / 2, // 固定 X 轴旋转
                            mainPlayer.rotation.y - offsetZ, // 主玩家的 Y 轴旋转
                            mainPlayer.rotation.z // 主玩家的 Z 轴旋转减去偏差值
                        );
                    }
                });
            }
            // 如果otherPlayer的位置不是初始位置，更新每个 otherPlayer 的位置
            otherPlayerRefs.current.forEach((ref: any, index: number) => {
                if (!vertices[index]) return;
                const targetPosition = vec3({ x: vertices[index][0], y: vertices[index][1], z: vertices[index][2] });
                // 如果当前位置与目标位置不同，则缓慢移动过去
                if (!ref.position.equals(targetPosition) && ref.position.distanceTo(targetPosition) > 0.01) {
                    // 使用 lerp 插值移动位置，第二个参数是插值速度（范围 0 到 1）
                    ref.position.lerp(targetPosition, delta * 2);
                } else {
                    // 更新user data
                    if (!ref.userData?.ready) {
                        ref.userData = {
                            ready: true
                        }
                    }
                }
            })
        }
    })

    useEffect(() => {
        // 设置动画效果，先把每个otherPlayer的位置设置到屏幕外
        otherPlayerRefs.current.forEach((ref: any, index) => {
            ref.position.set((index + 1) * 3, 0, 0);
        })

        const updateOtherPlayerPositionToken = PubSub.subscribe('updateOtherPlayerPosition', (msg: any, data: any) => {
            const index = destroyOtherPlayerIndexRefs.current;
            otherPlayerRefs.current[index].position.set(5, 0, 0);
            otherPlayerRefs.current[index].userData = {
                ready: false
            }
            destroyOtherPlayerIndexRefs.current = (index + 1) % maxPlayerCount;
        })

        return () => {
            PubSub.unsubscribe(updateOtherPlayerPositionToken);
        }
    }, [])

    return (
        <group rotation={[Math.PI / -2, 0, 0]} ref={hexagonContainerRef} name={"OtherPlayerContainer"}>
            <mesh>
                <shapeGeometry args={[hexagon]} />
                <meshBasicMaterial color="orange" side={THREE.DoubleSide} transparent opacity={0} />
            </mesh>
            <>
                {vertices.map(([x, y, z], index) => (
                    <group key={index} position={[x, y, z]} name={"other_player_" + index} ref={(ref) => {
                        if (ref) {
                            // 确保每个 ref 只被赋值一次
                            otherPlayerRefs.current[index] = ref;
                        }
                    }}>
                        <primitive object={clonedModels[index]} />
                    </group>
                ))}
            </>
        </group>
    );
};

export default function OtherPlayerContainer() {
    const playerInfo = usePlayerStore(state => state.playerInfo);

    if (!playerInfo.needOtherPlayerHelp) {
        return <></>
    }
    return (
        <HexagonContainer />
    )
}
