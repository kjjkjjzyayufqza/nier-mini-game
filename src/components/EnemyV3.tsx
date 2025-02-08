import { ColliderProps, CollisionTarget, CuboidArgs, CuboidCollider, euler, interactionGroups, MeshCollider, RigidBody, RigidBodyProps, vec3 } from '@react-three/rapier'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Html, Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import usePlayerRigidBodyInfo from '../hook/usePlayerRigidBodyInfo'
import { EnemyProps, StrongType } from '../data/EnemyData'

export const EnemyV3 = ({
    id,
    type,
    initPosition,
    text,
    phase,
    shootIntervalTime = 0.6,
    enableShoot = true,
    strongType,
    health,
    nextPhase,
    isImportantPhase,
    isNeedChidAllDead,
    childrenIds,
    points,
    onDeath = () => { }
}: EnemyProps) => {
    const enemyRef = useRef<any>(null)
    const textRef = useRef<any>(null)
    const cuboidColliderRef = useRef<any>(null)
    const [cuboidSize, setCuboidSize] = useState<[number, number, number]>([0, 0, 0]);
    const changeTextColorTime = useRef<{ value: number, enable: boolean }>({
        value: 0,
        enable: false
    })
    const shakeIntensity = useRef<number>(0)
    const startMoveToInitPosition = useRef<boolean>(false)
    const moveToInitPositionSpeed = 0.02
    const movedToInitPosition = useRef<boolean>(false)
    const healthRef = useRef<number>(health)
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
    const TextBoundingUpdate = (e: any) => {
        if (e.geometry) {
            e.geometry.computeBoundingBox();
            const size = vec3();
            e.geometry.boundingBox.getSize(size);
            // 每次都减少 size.x 的一半，是因为文字的锚点是在中心的
            size.x = size.x / 2 + 0.02;
            size.y = size.y / 2 + 0.02;
            setCuboidSize([size.x, size.y, 0.01]); // 更新碰撞体大小
        }
    };

    const setRotation = () => {
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(euler({
            x: Math.PI / -2, y: 0, z: Math.PI,
        }));
        enemyRef.current.setRotation(quaternion);
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

    const enemyOnHit = (target: CollisionTarget, other: CollisionTarget) => {
        //如果是玩家则不处理
        if (other.colliderObject?.name == 'player_collider') {
            return
        }
        handleTextChangeColor()
        if (other.rigidBodyObject?.userData?.type == 'player_projectile') {
            healthRef.current -= 1
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
        const totalHight = initPosition.z
        enemyRef.current.setTranslation(vec3({ x: initPosition.x, y: initPosition.y, z: totalHight }))
        startMoveToInitPosition.current = true
    }

    const handleStartMoveToInitPosition = () => {
        if (startMoveToInitPosition.current) {
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
                    movedToInitPosition.current = true;
                }
                if (distance <= 0.001) {
                    enemyRef.current.setTranslation(initPosition);
                    startMoveToInitPosition.current = false;
                }
            }
        }
    }

    useEffect(() => {
        if (type == "DEBUG") return
        if (enemyRef.current && textRef.current) {
            // changeEnemyColliderGroup([])
            setRotation()
            moveToInitPosition()
        }
    }, [cuboidSize, type])

    useFrame((state, delta) => {
        if (type == "DEBUG") return
        // handleUpdateColorOnFrame(delta)
        // handleShakeTextOnFrame()
        // handleShootingOnFrame(delta)
        // handleRotationShootingPortOnFrame()
        handleStartMoveToInitPosition()
        // handleRandomMoveOnFrame(delta)
    })

    return (
        <group>
            <RigidBody
                ref={enemyRef}
                gravityScale={0}
                type='kinematicPosition'
                collisionGroups={interactionGroups(1, [0])}
                onIntersectionEnter={(e) => {
                }}
                onCollisionEnter={({ manifold, target, other }) => {
                    enemyOnHit(target, other)
                }}
                friction={0}
            >
                <CuboidCollider args={cuboidSize} ref={cuboidColliderRef} collisionGroups={interactionGroups(1, [0])} />
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
                >
                    {text}
                </Text>
            </RigidBody>

        </group>
    )
}
