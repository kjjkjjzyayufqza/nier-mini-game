import { ColliderProps, CollisionTarget, CuboidArgs, CuboidCollider, euler, interactionGroups, MeshCollider, RigidBody, RigidBodyProps, vec3 } from '@react-three/rapier'
import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Html, Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import usePlayerRigidBodyInfo from '../hook/usePlayerRigidBodyInfo'
import { EnemyProps, StrongType } from '../data/EnemyData'
import useAudioStore from '../store/AudioStore'
import { animated, useSpring } from '@react-spring/web'
import { useFixedFrameUpdate } from '../hook/useFixedFrameUpdate'

export const Enemy = ({
    id,
    type,
    initPosition,
    text,
    phase,
    nextPhase,
    isImportantPhase,
    isNeedChidAllDead,
    childrenIds,
    shootIntervalTime = 0.6,
    enableShoot = true,
    strongType,
    health,
    points,
    onDeath = () => { }
}: EnemyProps) => {
    const [debugOptions, setDebugOptions] = useState({
        shootPortVisible: false,
        enableShooting: enableShoot
    })
    const { play: playAudio, setVolume, stop: stopAudio } = useAudioStore();
    const enemyRef = useRef<any>(null)
    const enemyShootPortGroupRef = useRef<any>(null)
    const textRef = useRef<any>(null)
    const cuboidColliderRef = useRef<any>(null)
    const [cuboidSize, setCuboidSize] = useState<[number, number, number]>([0, 0, 0]);
    const changeTextColorTime = useRef<{ value: number, enable: boolean }>({
        value: 0,
        enable: false
    })
    const shakeIntensity = useRef<number>(0)
    const shootInterval = useRef<number>(0)
    const moveToInitPositionIRef = useRef<{
        startMoveToInitPosition: boolean,
        movedToTopPosition: boolean
    }>({
        startMoveToInitPosition: false,
        movedToTopPosition: false
    })
    const moveToInitPositionSpeed = 0.02
    const movedToInitPosition = useRef<boolean>(false)
    const easyEnemyRandomOffset = {
        x: Math.random() * 2 - 1, // 随机生成 -1 到 1 的偏移量
        z: Math.random() * 2 - 1, // 随机生成 -1 到 1 的偏移量
        timeOffset: Math.random() * Math.PI * 2, // 随机时间偏移，范围 [0, 2π]
    };
    const healthRef = useRef<number>(health)
    const [finalConfirmEnemyHealth, setFinalConfirmEnemyHealth] = useState<number>(health)
    const { viewport, size } = useThree();
    const spawnEffect = useRef<boolean>(false)
    const fontSize = useMemo(() => {
        if (strongType == StrongType.VERY_EASY) {
            return 0.04
        } else if (strongType == StrongType.EASY) {
            return 0.04
        } else if (strongType == StrongType.NORMAL) {
            return 0.06
        } else if (strongType == StrongType.MEDIUM) {
            return 0.06
        } else if (strongType == StrongType.HARD) {
            return 0.06
        } else if (strongType == StrongType.EXTREME) {
            return 0.06
        }
    }, [])
    const movedDistance = useRef<number>(0)
    //相反x轴
    let reverseX = -(initPosition.x)
    const selfMoveTargetPosition = vec3({ x: reverseX, y: 0, z: initPosition.z })

    //easy
    const easyEnemyShootingPortCenterRef = useRef<any>(null)

    //normal
    const normalEnemyShootingPortCenterRef = useRef<any>(null)

    //medium
    const mediumEnemyShootingPortLeftRef = useRef<any>(null)
    const mediumEnemyShootingPortRightRef = useRef<any>(null)

    //hard
    const hardEnemyShootingPortLeftRef = useRef<any>(null)
    const hardEnemyShootingPortLeftRef2 = useRef<any>(null)
    const hardEnemyShootingPortRightRef = useRef<any>(null)
    const hardEnemyShootingPortRightRef2 = useRef<any>(null)

    //extreme
    const extremeEnemyShootingPortCenterRef = useRef<any>(null)
    const extremeEnemyShootingPortCenterRef2 = useRef<any>(null)
    const extremeEnemyShootingPortLeftRef = useRef<any>(null)
    const extremeEnemyShootingPortLeftRef2 = useRef<any>(null)
    const extremeEnemyShootingPortRightRef = useRef<any>(null)
    const extremeEnemyShootingPortRightRef2 = useRef<any>(null)

    const { playerInfo } = usePlayerRigidBodyInfo()

    const shootingPortConfigs: {
        [key: string]: { name: string, ref: any, rotation?: number[], geometryType: string }[]
    } = useMemo(() => {
        return {
            VERY_EASY: [{ name: "easyEnemyShootingPortCenter", ref: easyEnemyShootingPortCenterRef, geometryType: "box" }],
            EASY: [{ name: "easyEnemyShootingPortCenter", ref: easyEnemyShootingPortCenterRef, geometryType: "box" }],
            NORMAL: [
                { name: "normalEnemyShootingPortCenter", ref: normalEnemyShootingPortCenterRef, rotation: [Math.PI / -2, 0, 0], geometryType: "plane" },
            ],
            MEDIUM: [
                { name: "mediumEnemyShootingPortLeft", ref: mediumEnemyShootingPortLeftRef, rotation: [Math.PI / -2, 0, 0], geometryType: "plane" },
                { name: "mediumEnemyShootingPortRight", ref: mediumEnemyShootingPortRightRef, rotation: [Math.PI / -2, 0, 0], geometryType: "plane" },
            ],
            HARD: [
                { name: "hardEnemyShootingPortLeft", ref: hardEnemyShootingPortLeftRef, rotation: [Math.PI / -2, 0, 0], geometryType: "plane" },
                { name: "hardEnemyShootingPortLeft2", ref: hardEnemyShootingPortLeftRef2, rotation: [Math.PI / -2, 0, Math.PI / 4], geometryType: "plane" },
                { name: "hardEnemyShootingPortRight", ref: hardEnemyShootingPortRightRef, rotation: [Math.PI / -2, 0, 0], geometryType: "plane" },
                { name: "hardEnemyShootingPortRight2", ref: hardEnemyShootingPortRightRef2, rotation: [Math.PI / -2, 0, Math.PI / 4], geometryType: "plane" },
            ],
            EXTREME: [
                { name: "extremeEnemyShootingPortCenter", ref: extremeEnemyShootingPortCenterRef, rotation: [Math.PI / -2, 0, 0], geometryType: "plane" },
                { name: "extremeEnemyShootingPortCenter2", ref: extremeEnemyShootingPortCenterRef2, rotation: [Math.PI / -2, 0, Math.PI / 4], geometryType: "plane" },
                { name: "extremeEnemyShootingPortLeft", ref: extremeEnemyShootingPortLeftRef, rotation: [Math.PI / -2, 0, 0], geometryType: "plane" },
                { name: "extremeEnemyShootingPortLeft2", ref: extremeEnemyShootingPortLeftRef2, rotation: [Math.PI / -2, 0, Math.PI / 4], geometryType: "plane" },
                { name: "extremeEnemyShootingPortRight", ref: extremeEnemyShootingPortRightRef, rotation: [Math.PI / -2, 0, 0], geometryType: "plane" },
                { name: "extremeEnemyShootingPortRight2", ref: extremeEnemyShootingPortRightRef2, rotation: [Math.PI / -2, 0, Math.PI / 4], geometryType: "plane" },
            ],
        };
    }, []);
    const currentConfig = shootingPortConfigs[strongType] || [];

    const TextBoundingUpdate = (e: any) => {
        if (e.geometry) {
            e.geometry.computeBoundingBox();
            const size = vec3();
            e.geometry.boundingBox.getSize(size);
            // 每次都减少 size.x 的一半，是因为文字的锚点是在中心的
            size.x = size.x / 2 + 0.02;
            size.y = size.y / 2 + 0.02;
            if (id == "enemy_final_confirm") {
                setCuboidSize([0.45, 0.05, 0.01]);
            } else {
                setCuboidSize([size.x, size.y, 0.01]); // 更新碰撞体大小
            }
        }
    };

    const setShootingPositionInfo = () => {
        const centerPosition = enemyRef.current.translation()
        textRef.current.geometry.computeBoundingBox();
        const textSize = vec3()
        textRef.current.geometry.boundingBox.getSize(textSize);
        //根据碰撞箱计算最左边和最右边的位置
        const left = centerPosition.x - textSize.x / 2
        const right = centerPosition.x + textSize.x / 2

        //easy, very easy
        if (easyEnemyShootingPortCenterRef.current) {
            easyEnemyShootingPortCenterRef.current.position.set(centerPosition.x, centerPosition.y, centerPosition.z)
        }
        //normal
        if (normalEnemyShootingPortCenterRef.current) {
            normalEnemyShootingPortCenterRef.current.position.set(centerPosition.x, centerPosition.y, centerPosition.z)
        }
        //medium
        if (mediumEnemyShootingPortLeftRef.current && mediumEnemyShootingPortRightRef.current) {
            mediumEnemyShootingPortLeftRef.current.position.set(left, centerPosition.y, centerPosition.z)
            mediumEnemyShootingPortRightRef.current.position.set(right, centerPosition.y, centerPosition.z)
        }
        //hard
        if (hardEnemyShootingPortLeftRef.current &&
            hardEnemyShootingPortLeftRef2.current &&
            hardEnemyShootingPortRightRef.current &&
            hardEnemyShootingPortRightRef2.current) {
            hardEnemyShootingPortLeftRef.current.position.set(left, centerPosition.y, centerPosition.z)
            hardEnemyShootingPortLeftRef2.current.position.set(left, centerPosition.y, centerPosition.z)
            hardEnemyShootingPortRightRef.current.position.set(right, centerPosition.y, centerPosition.z)
            hardEnemyShootingPortRightRef2.current.position.set(right, centerPosition.y, centerPosition.z)
        }
        //extreme
        if (extremeEnemyShootingPortCenterRef.current &&
            extremeEnemyShootingPortCenterRef2.current &&
            extremeEnemyShootingPortLeftRef.current &&
            extremeEnemyShootingPortLeftRef2.current &&
            extremeEnemyShootingPortRightRef.current &&
            extremeEnemyShootingPortRightRef2.current) {
            extremeEnemyShootingPortCenterRef.current.position.set(centerPosition.x, centerPosition.y, centerPosition.z);
            extremeEnemyShootingPortCenterRef2.current.position.set(centerPosition.x, centerPosition.y, centerPosition.z)
            extremeEnemyShootingPortLeftRef.current.position.set(left, centerPosition.y, centerPosition.z)
            extremeEnemyShootingPortLeftRef2.current.position.set(left, centerPosition.y, centerPosition.z)
            extremeEnemyShootingPortRightRef.current.position.set(right, centerPosition.y, centerPosition.z)
            extremeEnemyShootingPortRightRef2.current.position.set(right, centerPosition.y, centerPosition.z)
        }
    }

    const getBoxCorner = (halfWidth: number, halfHeight: number) => {
        // 定义四个边的局部坐标
        const corners = [
            vec3({ x: -halfWidth, y: -halfHeight, z: 0 }), // 左下角
            vec3({ x: halfWidth, y: -halfHeight, z: 0 }), // 右下角
            vec3({ x: halfWidth, y: halfHeight, z: 0 }), // 右上角
            vec3({ x: -halfWidth, y: halfHeight, z: 0 }), // 左上角
        ]
        return corners
    }

    const handleShooting = () => {
        //计算自己shootingPortCenterRef到玩家的方向
        if (!playerInfo) return
        if ([StrongType.VERY_EASY, StrongType.EASY].includes(strongType)) {
            const direction = vec3({
                x: playerInfo.position.x - easyEnemyShootingPortCenterRef.current.position.x,
                y: playerInfo.position.y - easyEnemyShootingPortCenterRef.current.position.y,
                z: playerInfo.position.z - easyEnemyShootingPortCenterRef.current.position.z
            })
            //根据玩家方向添加左或者右的偏移
            const offsetMagnitude = 1.0;
            const baseOffset = 0;

            const randomOffset = (Math.random() > 0.5)
                ? (baseOffset + Math.random() * offsetMagnitude)   // 正方向偏移范围：0 ~ 1.0
                : (-baseOffset - Math.random() * offsetMagnitude)  // 负方向偏移范围：-1.0 ~ 0

            direction.x += randomOffset
            direction.z += randomOffset
            if (strongType == StrongType.VERY_EASY) {
                PubSub.publish('enemyShootProjectile', {
                    id: Math.random(),
                    position: vec3(easyEnemyShootingPortCenterRef.current.position),
                    direction,
                    projectileRotation: vec3({ x: 0, y: 0, z: 0 }),
                })
            } else {
                const random = Math.random()
                if (random > 0.6) {
                    PubSub.publish('enemyShootUnbrokenProjectileToken', {
                        id: Math.random(),
                        position: vec3(easyEnemyShootingPortCenterRef.current.position),
                        direction,
                        projectileRotation: vec3({ x: 0, y: 0, z: 0 }),
                    })
                } else {
                    PubSub.publish('enemyShootProjectile', {
                        id: Math.random(),
                        position: vec3(easyEnemyShootingPortCenterRef.current.position),
                        direction,
                        projectileRotation: vec3({ x: 0, y: 0, z: 0 }),
                    })
                }
            }
        }

        if (strongType == StrongType.NORMAL) {
            loopShootingPortAndShoot([normalEnemyShootingPortCenterRef.current])
        }

        if (strongType == StrongType.MEDIUM) {
            loopShootingPortAndShoot([mediumEnemyShootingPortLeftRef.current, mediumEnemyShootingPortRightRef.current])
        }

        if (strongType == StrongType.HARD) {
            loopShootingPortAndShoot([
                hardEnemyShootingPortLeftRef.current,
                hardEnemyShootingPortLeftRef2.current,
                hardEnemyShootingPortRightRef.current,
                hardEnemyShootingPortRightRef2.current
            ])
        }

        if (strongType == StrongType.EXTREME) {
            loopShootingPortAndShoot([
                extremeEnemyShootingPortCenterRef.current,
                extremeEnemyShootingPortCenterRef2.current,
                extremeEnemyShootingPortLeftRef.current,
                extremeEnemyShootingPortLeftRef2.current,
                extremeEnemyShootingPortRightRef.current,
                extremeEnemyShootingPortRightRef2.current
            ])
        }
    }

    const loopShootingPortAndShoot = (meshRef: any[]) => {
        for (let meshIndex = 0; meshIndex < meshRef.length; meshIndex++) {
            const corners = getBoxCorner(0.025, 0.025)
            // 将局部坐标转换为世界坐标
            const worldCorners = corners.map(corner => {
                return corner.clone().applyMatrix4(meshRef[meshIndex].matrixWorld);
            });
            // 计算边的中点
            const midpoints = [
                vec3().addVectors(worldCorners[0], worldCorners[1]).multiplyScalar(0.5), // 上边中点
                vec3().addVectors(worldCorners[1], worldCorners[2]).multiplyScalar(0.5), // 右边中点
                vec3().addVectors(worldCorners[2], worldCorners[3]).multiplyScalar(0.5), // 下边中点
                vec3().addVectors(worldCorners[3], worldCorners[0]).multiplyScalar(0.5), // 左边中点
            ];
            // 计算每个边的方向
            const center = vec3().setFromMatrixPosition(meshRef[meshIndex].matrixWorld); // 获取平面中心
            for (let i = 0; i < midpoints.length; i++) {
                const direction = midpoints[i].clone().sub(center).normalize();
                direction.x = direction.x;
                direction.y = 0;
                direction.z = direction.z;
                if (![StrongType.HARD, StrongType.EXTREME].includes(strongType)) {
                    if (i % 2 == 0) {
                        PubSub.publish('enemyShootProjectile', {
                            id: Math.random(),
                            position: vec3(center),
                            direction: vec3(direction),
                            projectileRotation: vec3({ x: 0, y: 0, z: 0 }),
                        });
                    } else {
                        PubSub.publish('enemyShootUnbrokenProjectileToken', {
                            id: Math.random(),
                            position: vec3(center),
                            direction: vec3(direction),
                            projectileRotation: vec3({ x: 0, y: 0, z: 0 }),
                        });
                    }
                } else {
                    //only hard and extreme
                    if (meshIndex % 2 == 0) {
                        PubSub.publish('enemyShootProjectile', {
                            id: Math.random(),
                            position: vec3(center),
                            direction: vec3(direction),
                            projectileRotation: vec3({ x: 0, y: 0, z: 0 }),
                        });
                    } else {
                        PubSub.publish('enemyShootUnbrokenProjectileToken', {
                            id: Math.random(),
                            position: vec3(center),
                            direction: vec3(direction),
                            projectileRotation: vec3({ x: 0, y: 0, z: 0 }),
                        });
                    }
                }
            }
        }
    }


    const handleTextChangeColor = () => {
        textRef.current.color = '#B9A186'
        changeTextColorTime.current.enable = true
        //抖动效果
        shakeIntensity.current = 0.018
    }

    const changeEnemyColliderGroup = (groups: number[]) => {
        enemyRef.current.collider().setCollisionGroups(interactionGroups(1, groups))
        cuboidColliderRef.current.setCollisionGroups(interactionGroups(1, groups))
    }

    const handleOnHitPlayAudio = () => {
        if (healthRef.current <= 0) return
        playAudio('enemyHit')
    }

    const enemyOnHit = (target: CollisionTarget, other: CollisionTarget) => {
        //如果是玩家则不处理
        if (other.colliderObject?.name == 'player_collider') {
            return
        }
        handleTextChangeColor()
        handleOnHitPlayAudio()
        if (other.rigidBodyObject?.userData?.type == 'player_projectile') {
            healthRef.current -= 1
            if (id == 'enemy_final_confirm') {
                setFinalConfirmEnemyHealth((prev) => prev - 1)
            }
            if (healthRef.current <= 0) {
                PubSub.publish('startEnemyExplosionParticle', {
                    position: vec3(cuboidColliderRef.current.translation()),
                    x: cuboidSize[0] * 2,
                    y: cuboidSize[1],
                })
                onDeath(id, phase, nextPhase, isImportantPhase, isNeedChidAllDead, childrenIds, points)
            }
        }
        if (other.colliderObject?.name == 'player_on_hit_expanding_ring_hit_box') {
            //直接死亡
            PubSub.publish('startEnemyExplosionParticle', {
                position: vec3(cuboidColliderRef.current.translation()),
                x: cuboidSize[0] * 2,
                y: cuboidSize[1],
            })
            onDeath(id, phase, nextPhase, isImportantPhase, isNeedChidAllDead, childrenIds, points)
        }
    }

    const moveToInitPosition = () => {
        //获取initPosition.z的位置，并且+屏幕最顶部距离世界的位置，模拟从屏幕外进入
        const totalHight = initPosition.z + size.height / 1024
        enemyRef.current.setTranslation(vec3({ x: initPosition.x, y: initPosition.y, z: totalHight }))
        setShootingPositionInfo()
        moveToInitPositionIRef.current.startMoveToInitPosition = true
        moveToInitPositionIRef.current.movedToTopPosition = true
        textRef.current.visible = true
    }

    const handleUpdateColorOnFrame = (delta: number) => {
        if (changeTextColorTime.current.value > 250) {
            textRef.current.color = '#E7E2DF'
            changeTextColorTime.current.value = 0
            changeTextColorTime.current.enable = false
        }
        if (changeTextColorTime.current.enable) {
            changeTextColorTime.current.value += delta * 1000
        }
    }

    const handleShakeTextOnFrame = () => {
        if (shakeIntensity.current > 0) {
            textRef.current.position.x = (Math.random() - 0.5) * shakeIntensity.current
            textRef.current.position.y = (Math.random() - 0.5) * shakeIntensity.current
            textRef.current.position.z = (Math.random() - 0.5) * shakeIntensity.current
            shakeIntensity.current *= 0.9 // 每帧减弱抖动
            if (shakeIntensity.current < 0.01) shakeIntensity.current = 0 // 停止抖动
        }
    }
    const handleShootingOnFrame = (delta: number) => {
        //射击间隔
        if (movedToInitPosition.current) {
            if (shootInterval.current > (shootIntervalTime * 1000)) {
                shootInterval.current = 0
                if (debugOptions.enableShooting) {
                    handleShooting()
                }
            } else {
                shootInterval.current += delta * 1000
            }
        }
    }

    const handleRotationShootingPortOnFrame = () => {
        if (strongType == StrongType.NORMAL) {
            // 旋转normalEnemyShootingPortCenterRef
            const rotation = normalEnemyShootingPortCenterRef.current.rotation
            normalEnemyShootingPortCenterRef.current.rotation.set(rotation.x, rotation.y, rotation.z + 0.003)
        }

        if (strongType == StrongType.MEDIUM) {
            // 旋转mediumEnemyShootingPortLeftRef
            const rotationLeft = mediumEnemyShootingPortLeftRef.current.rotation
            mediumEnemyShootingPortLeftRef.current.rotation.set(rotationLeft.x, rotationLeft.y, rotationLeft.z + 0.005)
            // 旋转mediumEnemyShootingPortRightRef
            const rotationRight = mediumEnemyShootingPortRightRef.current.rotation
            mediumEnemyShootingPortRightRef.current.rotation.set(rotationRight.x, rotationRight.y, rotationRight.z + 0.003)
        }

        if (strongType == StrongType.HARD) {
            // 旋转hardEnemyShootingPortLeftRef
            const rotationLeft = hardEnemyShootingPortLeftRef.current.rotation
            hardEnemyShootingPortLeftRef.current.rotation.set(rotationLeft.x, rotationLeft.y, rotationLeft.z + 0.003)
            // 旋转hardEnemyShootingPortLeftRef2
            const rotationLeft2 = hardEnemyShootingPortLeftRef2.current.rotation
            hardEnemyShootingPortLeftRef2.current.rotation.set(rotationLeft2.x, rotationLeft2.y, rotationLeft2.z + 0.003)
            // 旋转hardEnemyShootingPortRightRef
            const rotationRight = hardEnemyShootingPortRightRef.current.rotation
            hardEnemyShootingPortRightRef.current.rotation.set(rotationRight.x, rotationRight.y, rotationRight.z + 0.005)
            // 旋转hardEnemyShootingPortRightRef2
            const rotationRight2 = hardEnemyShootingPortRightRef2.current.rotation
            hardEnemyShootingPortRightRef2.current.rotation.set(rotationRight2.x, rotationRight2.y, rotationRight2.z + 0.005)
        }

        if (strongType == StrongType.EXTREME) {
            const rotationCenter = extremeEnemyShootingPortCenterRef.current.rotation
            extremeEnemyShootingPortCenterRef.current.rotation.set(rotationCenter.x, rotationCenter.y, rotationCenter.z + 0.004)
            const rotationCenter2 = extremeEnemyShootingPortCenterRef2.current.rotation
            extremeEnemyShootingPortCenterRef2.current.rotation.set(rotationCenter2.x, rotationCenter2.y, rotationCenter2.z + 0.004)
            const rotationLeft = extremeEnemyShootingPortLeftRef.current.rotation
            extremeEnemyShootingPortLeftRef.current.rotation.set(rotationLeft.x, rotationLeft.y, rotationLeft.z + 0.002)
            const rotationLeft2 = extremeEnemyShootingPortLeftRef2.current.rotation
            extremeEnemyShootingPortLeftRef2.current.rotation.set(rotationLeft2.x, rotationLeft2.y, rotationLeft2.z + 0.002)
            const rotationRight = extremeEnemyShootingPortRightRef.current.rotation
            extremeEnemyShootingPortRightRef.current.rotation.set(rotationRight.x, rotationRight.y, rotationRight.z + 0.008)
            const rotationRight2 = extremeEnemyShootingPortRightRef2.current.rotation
            extremeEnemyShootingPortRightRef2.current.rotation.set(rotationRight2.x, rotationRight2.y, rotationRight2.z + 0.008)
        }
    }

    const handleStartMoveToInitPosition = () => {
        if (moveToInitPositionIRef.current.startMoveToInitPosition) {
            const currentPosition = vec3(enemyRef.current.translation());
            const distance = currentPosition.distanceTo(initPosition); // 计算当前位置与目标位置的距离
            if (distance > 0.1) { // 如果距离大于阈值
                const lerpedPosition = currentPosition.lerp(initPosition, moveToInitPositionSpeed);
                enemyRef.current.setTranslation(lerpedPosition);
            } else {
                const lerpedPosition = currentPosition.lerp(initPosition, 0.045);
                enemyRef.current.setTranslation(lerpedPosition);
                if (spawnEffect.current == false) {
                    const spawnPosition = currentPosition.clone()
                    spawnPosition.z = spawnPosition.z - 0.02
                    PubSub.publish('enemySpawnEffect', {
                        position: vec3(spawnPosition)
                    })
                    spawnEffect.current = true
                    //设置碰撞组
                    changeEnemyColliderGroup([0])
                }
                if (distance <= 0.1) {
                    setShootingPositionInfo();
                    movedToInitPosition.current = true;
                }
                if (distance <= 0.001) {
                    enemyRef.current.setTranslation(initPosition);
                    moveToInitPositionIRef.current.startMoveToInitPosition = false;
                }
            }
        }
    }
    const tempTime = useRef<number>(0)
    const handleRandomMoveOnFrame = (delta: number) => {
        if (movedToInitPosition.current) {
            const currentPosition = vec3(enemyRef.current.translation());
            const screenTop = viewport.height / 2; // 视口顶部
            const screenBottom = 0; // 视口底部
            const screenRight = viewport.width / 2; // 视口右侧
            const screenLeft = -viewport.width / 2; // 视口左侧
            if ([StrongType.VERY_EASY, StrongType.EASY].includes(strongType)) {
                tempTime.current += delta
                const time = tempTime.current * 0.5 + easyEnemyRandomOffset.timeOffset; // 使用状态中的时钟
                // 目标位置：x 和 z 轴生成无限 "∞" 的轨迹，y 始终为 0
                const targetPosition = vec3({
                    x: Math.sin(time + easyEnemyRandomOffset.x) * (screenRight * 3), // x 轴加上随机偏移
                    y: 0, // y 始终为 0
                    z: Math.sin(time * 2 + easyEnemyRandomOffset.z) * (screenTop * 3) // z 轴加上随机偏移
                });

                // 确保目标位置不会超出屏幕范围
                targetPosition.x = Math.max(screenLeft, Math.min(screenRight, targetPosition.x)); // 限制 x 轴范围
                targetPosition.z = Math.max(screenBottom, Math.min(screenTop, targetPosition.z)); // 限制 z 轴范围

                // 平滑插值到目标位置
                const lerpedPosition = currentPosition.lerp(targetPosition, 0.01);
                enemyRef.current.setTranslation(lerpedPosition);
                setShootingPositionInfo()
            } else if ([StrongType.MEDIUM, StrongType.HARD, StrongType.EXTREME].includes(strongType)) {
                //move to screen center
                if (selfMoveTargetPosition.x == 0) return
                const distance = currentPosition.distanceTo(selfMoveTargetPosition); // 计算当前位置与目标位置的距离
                movedDistance.current += distance
                if (movedDistance.current < 400) { // 如果距离大于阈值
                    let lerpFactor = 0.0001 * movedDistance.current // 动态调整插值比例
                    const lerpedPosition = currentPosition.lerp(selfMoveTargetPosition, lerpFactor);
                    enemyRef.current.setTranslation(lerpedPosition);
                    setShootingPositionInfo()
                } else {
                    //返回到初始位置
                    movedDistance.current = 0
                }
            }
        }
    }

    useEffect(() => {
        if (cuboidSize.some((e) => e == 0)) return
        if (type == "DEBUG") return
        if (enemyRef.current && textRef.current) {
            changeEnemyColliderGroup([])
            moveToInitPosition()
        }
    }, [cuboidSize])

    useFixedFrameUpdate((state, delta) => {
        if (type == "DEBUG") return
        if (!enemyRef.current || !textRef.current) return
        handleUpdateColorOnFrame(delta)
        handleShakeTextOnFrame()
        handleShootingOnFrame(delta)
        handleRotationShootingPortOnFrame()
        handleStartMoveToInitPosition()
        handleRandomMoveOnFrame(delta)
    })

    return (
        <group>
            <RigidBody
                ref={enemyRef}
                position={[0, 0, 2]}
                gravityScale={0}
                type='kinematicPosition'
                collisionGroups={interactionGroups(1, [])}
                onIntersectionEnter={(e) => {
                }}
                onCollisionEnter={({ manifold, target, other }) => {
                    enemyOnHit(target, other)
                }}
                friction={0}
                userData={{ type: 'enemy_rigidbody' }}
                rotation={[Math.PI / -2, 0, Math.PI]}
            >
                <CuboidCollider args={cuboidSize} ref={cuboidColliderRef} collisionGroups={interactionGroups(1, [])} />
                <Text
                    font={"./nier/fonts/Manrope-Light.ttf"}
                    color="#E7E2DF"
                    anchorX='center'
                    anchorY='middle'
                    fontSize={fontSize}
                    textAlign="center"
                    ref={textRef}
                    onSync={TextBoundingUpdate}
                    sdfGlyphSize={128}
                    visible={false}
                >
                    {text}
                    {id == 'enemy_final_confirm' && <Html>
                        <OnHitAnimatedYoRHaButton text={text} value={finalConfirmEnemyHealth} maxValue={health} />
                    </Html>}
                </Text>
            </RigidBody>
            <group name={`${strongType.toLowerCase()}EnemyShootingPort`}>
                {currentConfig.map((config, index) => (
                    <ShootingPortMesh
                        key={index}
                        name={config.name}
                        refProp={config.ref}
                        rotation={config?.rotation || [0, 0, 0]}
                        visible={debugOptions.shootPortVisible}
                        geometryType={config.geometryType}
                    />
                ))}
            </group>
        </group>
    )
}

const AnimatedDiv = animated('div');
const OnHitAnimatedYoRHaButton = ({ text, value, maxValue }: { text: string, value: number, maxValue: number }) => {
    const [styles, api] = useSpring(() => ({
        from: { opacity: 0 },
        to: async (next) => {
            await next({ opacity: 1 });
        },
        onRest: () => { },
        config: { duration: 200 },
    }));
    const [fillValue, setFillValue] = useState(0); // 控制动画填充效果的状态
    const maxFillValue = maxValue; // 最大填充值

    // 用于处理填充效果的函数
    const handleFill = () => {
        if (fillValue < maxFillValue) {
            setFillValue(prev => prev + 1); // 增加填充值
        }
    };

    const getWith = () => {
        if (value == maxValue) return 0
        const wValue = (fillValue / maxFillValue) * 100
        return wValue
    }

    useEffect(() => {
        handleFill()
    }, [value])

    return (
        <AnimatedDiv className="pointer-events-none top-[-1.5em] left-[-15em] absolute z-10" style={styles}>
            <button
                className={`group min-w-[30em] relative overflow-hidden font-medium py-2 px-4 transition-colors duration-300 flex items-center justify-start gap-2
                    bg-[#B3AE98]
                    ${getWith() >= 20
                        ? "text-[#B3AE98]"
                        : "text-[#524E45]"
                    }`}
            >
                {/* 动画填充效果 */}
                <span
                    className={`absolute inset-0 bg-[#524E45] transition-all duration-150 ease-in-out`}
                    style={{ width: `${getWith()}%` }} // 根据填充值动态设置宽度
                ></span>

                {/* 按钮内容 */}
                <div
                    className={`w-5 h-5 ${getWith() >= 10 ? "bg-[#B3AE98]" : "bg-[#524E45]"} relative z-10 transition-colors`}
                />
                <p className="text-lg relative z-10">{text}</p>
            </button>
        </AnimatedDiv>
    );
};

const ShootingPortMesh = memo(({ name, refProp, rotation = [0, 0, 0], visible, geometryType = "box" }: {
    name: string,
    refProp: any,
    rotation?: [number, number, number] | any[],
    visible: boolean,
    geometryType?: "box" | "plane" | string
}) => {
    const geometry = useMemo(() => {
        return geometryType === "box"
            ? new THREE.BoxGeometry(0.05, 0.05, 0.05)
            : new THREE.PlaneGeometry(0.05, 0.05);
    }, [geometryType]);

    const material = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: "white",
            transparent: true,
            opacity: 0.2,
        });
    }, []);

    useEffect(() => {
        return () => {
            // 清理资源
            geometry.dispose();
            material.dispose();
        };
    }, [geometry, material]);

    return (
        <mesh name={name} ref={refProp} rotation={rotation as any} visible={visible} geometry={geometry} material={material} />
    );
});
