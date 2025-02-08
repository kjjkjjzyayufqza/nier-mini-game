import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { euler, vec3 } from "@react-three/rapier";

interface IPlayerRigidBodyInfo {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
}

const usePlayerRigidBodyInfo = () => {
    const scene = useThree((state) => state.scene) // 获取当前场景
    const [playerInfo, setPlayerInfo] = useState<IPlayerRigidBodyInfo>({
        position: vec3({ x: 0, y: 0, z: 0 }), // 初始化 player
        rotation: euler({ x: 0, y: 0, z: 0 }), // 初始化 player
        scale: vec3({ x: 1, y: 1, z: 1 }),
    });

    useEffect(() => {
        // 在场景中查找 rigidbody 的 userData.type 为 "player" 的物体
        const player = scene.getObjectByName("player_rigidbody");
        if (player) {
            setPlayerInfo((prev) => ({
                ...prev,
                position: player.position, // 直接引用 position 对象
                rotation: player.rotation, // 获取旋转信息
                scale: player.scale,       // 获取缩放信息
            }));
        } else {
            console.warn('No object with name "player" found in the scene.');
        }
    }, [scene]); // 依赖于场景的变化

    return { playerInfo }; // 返回 player 的信息和更新 health 的方法
};

export default usePlayerRigidBodyInfo;
