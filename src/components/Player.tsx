import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import { Html, useKeyboardControls } from '@react-three/drei';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { BallCollider, CollisionTarget, interactionGroups, quat, RapierRigidBody, RigidBody, vec3 } from '@react-three/rapier';
import * as THREE from 'three';
import PubSub from 'pubsub-js';
import { PlayerOnHitExpandingRingEffect } from './PlayerOnHitEffects';
import OtherPlayerContainer from './OtherPlayerContainer';
import { GamepadManager } from '../modules/GamepadManager';
import usePlayerStore from '../store/PlayerStore';
import systemInfoStore from '../store/SystemInfoStore';
import useAudioStore from '../store/AudioStore';
import { PlayerMoveEffects } from './PlayerMoveEffects';
import { useTranslations } from 'next-intl';
import { useFixedFrameUpdate } from '../hook/useFixedFrameUpdate';
import { useNotificationStore } from '../store/NotificationStore';
import { useCutsceneStore } from '../store/CutsceneStore';
import { useNetworkStore } from '../store/NetworkStore';
import { useControls } from 'leva';
import { Schema } from 'leva/plugin';
import useGamePauseStore from '../store/GamePauseStore';

const normalizeAngle = (angle: number) => {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
};

const lerpAngle = (start: number, end: number, t: number) => {
    start = normalizeAngle(start);
    end = normalizeAngle(end);

    if (Math.abs(end - start) > Math.PI) {
        if (end > start) {
            start += 2 * Math.PI;
        } else {
            end += 2 * Math.PI;
        }
    }

    return normalizeAngle(start + (end - start) * t);
};

const gamepadManager = new GamepadManager(0.3);

export const Player = () => {
    // console.log('Player')
    const addNotification = useNotificationStore(state => state.addNotification);
    const startCutscene = useCutsceneStore(state => state.startCutscene);
    const currentPhase = systemInfoStore(state => state.systemInfo.currentPhase);
    const notEnablePlayerNameList = useNetworkStore(state => state.notEnablePlayerNameList);
    const { scene } = useThree();
    const playerInfo = usePlayerStore(state => state.playerInfo);
    const setPlayerShareInfo = usePlayerStore(state => state.setPlayerShareInfo)
    const setPlayerHealth = usePlayerStore(state => state.setPlayerHealth)
    const setPlayerToDeath = usePlayerStore(state => state.setPlayerToDeath)
    const player = useRef<any>(null);
    const rb = useRef<RapierRigidBody>(null);
    const playerRotationTarget = useRef<any>(0);
    const rotationTarget = useRef<any>(0);
    const [, get] = useKeyboardControls();
    const [speed, setSpeed] = useState<number>(0.6);
    const { nodes: playerNodes, scene: playerModel } = useLoader(GLTFLoader, "./nier/player.glb");
    const effectStartPosition = useRef<THREE.Vector3>(vec3({ x: 0, y: 0, z: 0 }));
    const effectTargetPosition = useRef<THREE.Vector3>(vec3({ x: 0, y: 0, z: 0 }));
    const isClicking = useRef<boolean>(false);
    const isShooting = useRef<boolean>(false);
    const isMoving = useRef<boolean>(false);
    const playerHitBoxRef = useRef<any>(null);
    const [playerOnHitExpandingRingHitBoxSize, setPlayerOnHitExpandingRingHitBoxSize] = useState<number>(0);
    const playerInvincibilityTime = 0.8
    const isPlayerOnHit = useRef<boolean>(false)
    const playerInvincibilityTimeAccumulatedTime = useRef<number>(0)
    const playerOnHitColorReturnNormal = useRef<boolean>(false)
    const [shootingInterval, setShootingInterval] = useState<number>(0.0986)
    const disableMove = useRef<boolean>(false)
    const resetPlayerPositionRef = useRef<boolean>(false)
    const playerLocalSummery = useRef<{
        onHitCount: number,
        totalShootCount: number,
    }>({
        onHitCount: 0,
        totalShootCount: 0,
    })
    const { play: playAudio, setVolume, stop: stopAudio } = useAudioStore();
    const t = useTranslations()
    const isPaused = useGamePauseStore(state => state.isPaused)

    const playerOptions = useCallback(() => {
        const value: Schema = {
            moveSpeed: {
                label: "Move Speed",
                value: speed,
                min: 0,
                max: 2,
                onChange: (v) => {
                    setSpeed(v)
                }
            },
            shootingInterval: {
                label: "Shooting Interval",
                value: shootingInterval,
                min: 0,
                max: 1,
                onChange: (v) => {
                    setShootingInterval(v)
                }
            }
        }
        return value
    }, [])
    const pPlayer = useControls('Player', playerOptions)


    const onMouseDown = (e: any) => {
        if (e.button === 0) {
            isClicking.current = true;
        }
        if ((e.button === 2 && isClicking.current)) {
            isShooting.current = true;
        }
    }
    const onMouseUp = (e: any) => {
        if (e.button === 0) {
            isClicking.current = false;
        }
        if (e.button === 2) {
            isShooting.current = false;
        }
    }
    const handleContextMenu = (event: any) => {
        event.preventDefault(); // 阻止默认的右键菜单
    };

    const shootProjectile = () => {
        if (playerInfo.playerHealth <= 0) return
        playerLocalSummery.current.totalShootCount += 1
        playAudio('playerShot')
        const direction = vec3().set(
            Math.sin(player.current.rotation.y) * 2,
            0,
            Math.cos(player.current.rotation.y) * 2
        );

        // 计算射弹的旋转，由于模型的朝向横向的，我们要转成纵向的
        const projectileRotation = quat().setFromUnitVectors(
            vec3({ x: 1, y: 0, z: 0 }), // 模型的朝向
            direction.clone().normalize() // 射弹方向
        );

        // 添加额外的旋转，将模型绕自身的 X 轴旋转 45 度
        const additionalRotation = quat().setFromAxisAngle(
            vec3({ x: 1, y: 0, z: 0 }), // 绕 X 轴旋转
            Math.PI / 4 // 45 度
        );

        // 合并两个旋转
        projectileRotation.multiply(additionalRotation);

        const position = rb.current?.translation();
        PubSub.publish('shootProjectile', {
            id: Math.random(),
            position: vec3(position),
            direction,
            projectileRotation,
        });

        if (playerInfo.needOtherPlayerHelp) {
            const otherPlayerContainer = scene.getObjectByName('OtherPlayerContainer')
            otherPlayerContainer?.children.forEach((child: any) => {
                if (child.name.startsWith("other_player_")) {
                    if (child.userData?.ready) {
                        const worldPosition = child.getWorldPosition(vec3())
                        PubSub.publish('shootProjectile', {
                            id: Math.random(),
                            position: worldPosition,
                            direction,
                            projectileRotation,
                        });
                    }
                }
            })
        }
    }

    const lastShotTime = useRef(0); // 用于存储上次射击时间
    const playerEffectsSpawnTime = useRef(0); // 用于存储上次生成玩家特效的时间
    useFixedFrameUpdate((state, delta) => {
        if (isPaused) return
        if (disableMove.current) {
            return
        }
        //如果同时按下鼠标右键和左键
        if (isShooting.current) {
            const currentTime = state.clock.getElapsedTime(); // 获取当前时间
            if (currentTime - lastShotTime.current >= shootingInterval) { // 检查间隔
                shootProjectile();
                lastShotTime.current = currentTime; // 更新上次射击时间
            }
        }
        //如果按下gamepad的R键
        if (gamepadManager.isConnected() && (gamepadManager.getState().buttons["RB"] || gamepadManager.getState().buttons["R1"])) {
            const currentTime = state.clock.getElapsedTime(); // 获取当前时间
            if (currentTime - lastShotTime.current >= shootingInterval) { // 检查间隔
                shootProjectile();
                lastShotTime.current = currentTime; // 更新上次射击时间
            }
        }

    });

    useEffect(() => {

        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('contextmenu', handleContextMenu);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('contextmenu', handleContextMenu);
        }
    }, [])

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const lookBottom = new THREE.Vector3(0, 1, 0)

    useFixedFrameUpdate((state, delta) => {
        if (isPaused) return
        if (playerInfo.playerHealth <= 0) return
        if (disableMove.current) return
        if (rb.current) {
            const vel = rb.current?.linvel();
            const rbTranslation = rb.current.translation();
            const movement = {
                x: 0,
                z: 0
            }

            if (get().forward) movement.z = speed
            if (get().backward) movement.z = -speed
            if (get().left) movement.x = speed
            if (get().right) movement.x = -speed

            if (gamepadManager.isConnected()) {
                const leftStickX = gamepadManager.getState().axes["Left Stick Horizontal"] || 0; // 左摇杆水平轴
                const leftStickY = gamepadManager.getState().axes["Left Stick Vertical"] || 0;   // 左摇杆垂直轴

                movement.x += -leftStickX * speed; // 将手柄的输入映射到移动逻辑
                movement.z += -leftStickY * speed;
            }

            if (movement.x !== 0) {
                rotationTarget.current += 0.1 * movement.x;
            }

            if (movement.x !== 0 || movement.z !== 0) {
                playerRotationTarget.current = Math.atan2(movement.x, movement.z);
                vel.x = 1 * movement.x;
                vel.z = 1 * movement.z;
                isMoving.current = true
            } else {
                vel.x = 0;
                vel.z = 0;
                isMoving.current = false
            }

            let rotationSpeed = 0.2
            // 如果正在点击鼠标，更新玩家朝向
            if (isClicking.current) {
                // 计算鼠标在世界坐标中的位置
                mouse.x = state.pointer.x // 将指针坐标标准化到 -1 到 1
                mouse.y = state.pointer.y // 这里可能需要调整为正值以适应从上往下看的视角

                // 使用射线投射获取鼠标指向的世界坐标
                raycaster.setFromCamera(mouse, state.camera);

                // 假设地面是水平的，平面的法向量为 (0, 1, 0)
                const groundPlane = new THREE.Plane(lookBottom, 0); // 修改为 (0, 0, 1) 以适应从上往下的视角
                const intersect = raycaster.ray.intersectPlane(groundPlane, vec3());

                if (intersect) {
                    const targetPoint = intersect; // 获取鼠标目标点
                    // 计算玩家朝向的角度，注意这里可能需要调整 x 和 z 的顺序
                    playerRotationTarget.current = Math.atan2(targetPoint.x - rbTranslation.x, targetPoint.z - rbTranslation.z);
                    rotationSpeed = 0.8
                }
            }

            if (gamepadManager.isConnected()) {
                const rightStickX = gamepadManager.getState().axes["Right Stick Horizontal"] || 0; // 右摇杆水平轴
                const rightStickY = gamepadManager.getState().axes["Right Stick Vertical"] || 0;   // 右摇杆垂直轴

                // 如果右摇杆有输入，则更新玩家的朝向
                if (Math.abs(rightStickX) > 0.1 || Math.abs(rightStickY) > 0.1) { // 应用死区
                    playerRotationTarget.current = Math.atan2(-rightStickX, -rightStickY);
                    rotationSpeed = 0.4
                }
            }

            player.current.rotation.y = lerpAngle(
                player.current.rotation.y,
                playerRotationTarget.current,
                rotationSpeed
            );

            rb.current.setLinvel(vel, true);
            //spawn player movement particles
            const position = rb.current?.translation(); // 获取物理引擎中的位置
            if (position) {
                effectStartPosition.current.set(position.x, position.y, position.z);
                //effectTargetPosition是从effectStartPosition的位置开始
                // 随机方向
                const distance = 0.1;
                effectTargetPosition.current.set(
                    position.x + Math.random() * distance - distance / 2,
                    position.y + Math.random() * distance - distance / 2,
                    position.z + Math.random() * distance - distance / 2
                );
            }

            //如果玩家被击中
            if (isPlayerOnHit.current) {
                playerInvincibilityTimeAccumulatedTime.current += delta
                if (playerOnHitExpandingRingHitBoxSize < 0.4) {
                    setPlayerOnHitExpandingRingHitBoxSize(prev => prev + 0.009)
                }
                if (playerInvincibilityTimeAccumulatedTime.current >= playerInvincibilityTime) {
                    isPlayerOnHit.current = false
                    playerInvincibilityTimeAccumulatedTime.current = 0
                    setPlayerOnHitExpandingRingHitBoxSize(0)
                }
            }

            if (playerOnHitColorReturnNormal.current) {
                //如果玩家被击中后，颜色变黑色，在useFrame内逐渐恢复颜色
                const header: any = playerNodes['Header']
                const headerColor = header.material.color
                if (headerColor.r < 0.5 && headerColor.g < 0.5 && headerColor.b < 0.5) {
                    header.material.color.set(headerColor.r + 0.002, headerColor.g + 0.002, headerColor.b + 0.002)
                } else {
                    playerOnHitColorReturnNormal.current = false
                }
            }

            //如果玩家移动
            if (isMoving.current) {
                //每隔0.1秒生成一个特效
                playerEffectsSpawnTime.current += delta;
                if (playerEffectsSpawnTime.current >= (0.08 + Math.random() * 0.14)) {
                    playerEffectsSpawnTime.current = 0;
                    PubSub.publish('spawnPlayerMovementParticles', {
                        position: vec3(rb.current.translation())
                    })
                }
            }

            const otherPlayerContainer = state.scene.getObjectByName('OtherPlayerContainer')
            if (otherPlayerContainer) {
                const rbTr = rb.current.translation()
                otherPlayerContainer?.position.copy(vec3(rbTr))
            }
        }
    })

    const handlePlayerOnHitChangeColor = () => {
        const header: any = playerNodes['Header']
        header.material.color.set(0, 0, 0)
        playerOnHitColorReturnNormal.current = true
    }

    const handleNeedOtherPlayerOnHit = (rbTr: any) => {
        //通知容器
        PubSub.publish('updateOtherPlayerPosition')
        //audio
        playAudio('playerExplode')
        //effect
        PubSub.publish('startPlayerDeathEffect', {
            position: vec3(rbTr)
        })
        PubSub.publish('playerOnHitEffect', {
            position: vec3(rbTr)
        })
        PubSub.publish('startOnHitCameraEffect', {})
        //add notification
        let playerName = 'player'
        if (notEnablePlayerNameList.length > 0) {
            const randomIndex = Math.floor(Math.random() * notEnablePlayerNameList.length)
            playerName = notEnablePlayerNameList[randomIndex]
        }
        addNotification(`${t('hasLost')}${playerName}${t("'sData")}`,)
    }

    const onHit = ((target: CollisionTarget, other: CollisionTarget) => {
        //如果玩家在无敌时间内，不受伤
        if (other.rigidBodyObject?.userData.type === 'enemy_normal_projectile' ||
            other.rigidBodyObject?.userData.type === 'enemy_unbroken_projectile'
        ) {
            isPlayerOnHit.current = true
            //还在无敌时间内，不受伤
            if (playerInvincibilityTimeAccumulatedTime.current < playerInvincibilityTime) {
                //如果是第一次被击中，生成特效
                if (playerInvincibilityTimeAccumulatedTime.current == 0) {
                    //手柄震动
                    if (gamepadManager.isVibrationSupported()) {
                        gamepadManager.vibrate(500, 0.7, 0.6)
                    }
                    const rbTr = rb.current?.translation()
                    //如果处于需要其他玩家帮助的状态，不受伤
                    if (playerInfo.needOtherPlayerHelp) {
                        handleNeedOtherPlayerOnHit(rbTr)
                        return
                    }
                    //正常受伤
                    setPlayerHealth(playerInfo.playerHealth - 1)

                    playerLocalSummery.current.onHitCount += 1
                    //隐藏部位
                    if (playerInfo.playerHealth == 3) {
                        playerNodes['L_MOMO_1'].visible = false
                        playerNodes['L_ASHI'].visible = false
                        PubSub.publish('playerOnHitEffect', {
                            position: vec3(rbTr)
                        })
                        playAudio('playerHit')
                    }
                    else if (playerInfo.playerHealth == 2) {
                        playerNodes['R_MOMO_1'].visible = false
                        playerNodes['R_ASHI'].visible = false
                        PubSub.publish('playerOnHitEffect', {
                            position: vec3(rbTr)
                        })
                        playAudio('playerHit')
                    }
                    else if (playerInfo.playerHealth == 1) {
                        playerNodes['Center'].visible = false
                        playerNodes['Header'].visible = false
                        PubSub.publish('startPlayerDeathEffect', {
                            position: vec3(rbTr)
                        })
                        PubSub.publish('startOnHitCameraEffect', {})
                        playAudio('playerExplode')
                        isPlayerOnHit.current = false
                        disableMove.current = true
                        rb.current?.setEnabled(false)
                        setPlayerToDeath()
                        startCutscene('showContinueOverlayAndClearSceneObjects')
                        return
                    }
                    PubSub.publish('startOnHitCameraEffect', {})
                    handlePlayerOnHitChangeColor()
                }
            }
        }
    })

    const resetPlayerModel = () => {
        playerNodes['L_MOMO_1'].visible = true
        playerNodes['L_ASHI'].visible = true
        playerNodes['R_MOMO_1'].visible = true
        playerNodes['R_ASHI'].visible = true
        playerNodes['Center'].visible = true
        playerNodes['Header'].visible = true
    }
    const newPosition = vec3({ x: 0, y: 0, z: 0 });
    useFixedFrameUpdate(() => {
        if (isPaused) return
        if (rb.current && resetPlayerPositionRef.current) {
            const playerRb = rb.current;
            if (!vec3(playerRb.translation()).equals(newPosition)) {
                playerRb.setTranslation(newPosition, true); // 更新刚体位置
                playerRb.setLinvel(vec3({ x: 0, y: 0, z: 0 }), true); // 重置线速度
                playerRb.setAngvel(vec3({ x: 0, y: 0, z: 0 }), true); // 重置角速度
                player.current.position.copy(newPosition);
                player.current.rotation.y = 0;
                resetPlayerPositionRef.current = false
            }
        }
    })

    useEffect(() => {
        const resetPlayerToken = PubSub.subscribe('resetPlayerModel', () => {
            resetPlayerModel()
        })
        const resetPlayerPositionToken = PubSub.subscribe('resetPlayerPosition', () => {
            resetPlayerPositionRef.current = true
        });
        const setDisablePlayerMoveToken = PubSub.subscribe('setDisablePlayerMove', (msg: any, data: boolean = true) => {
            if (data) {
                rb.current?.sleep()
            } else {
                rb.current?.wakeUp()
                rb.current?.setEnabled(true)
            }
            disableMove.current = data
        })
        const setPlayerVisibleModelToken = PubSub.subscribe('setPlayerVisibleModel', (msg: any, data: boolean = true) => {
            player.current.visible = data
        })
        return () => {
            PubSub.unsubscribe(resetPlayerToken)
            PubSub.unsubscribe(resetPlayerPositionToken)
            PubSub.unsubscribe(setDisablePlayerMoveToken)
            PubSub.unsubscribe(setPlayerVisibleModelToken)
        }
    }, [])

    useEffect(() => {
        if (currentPhase === "end") {
            setPlayerShareInfo({
                shootCount: playerLocalSummery.current.totalShootCount,
                onHitCount: playerLocalSummery.current.onHitCount
            })
        }
    }, [currentPhase])

    const resetPlayerVelocity = () => {
        if (rb.current) {
            rb.current.setLinvel(vec3({ x: 0, y: 0, z: 0 }), true)
        }
    }
    useEffect(() => useGamePauseStore.subscribe(
        state => state.isPaused, resetPlayerVelocity
    ), [])

    return (
        <>
            <RigidBody
                name='player_rigidbody'
                lockRotations
                enabledTranslations={[true, false, true]}//只允许在x和z轴上移动
                ref={rb}
                gravityScale={0}
                collisionGroups={interactionGroups(0, [100, 1, 2, 3])}
                colliders={false}
                userData={{ type: 'player' }}
                onCollisionEnter={({ manifold, target, other }) => {
                    onHit(target, other)
                }}
            >
                <group ref={player} position={[0, 0, 0]} name='player_rigidbody_group'>
                    <primitive object={playerModel} scale={[2, 3, 2]} />
                    <BallCollider
                        collisionGroups={interactionGroups(0, [100, 1, 2, 3])}
                        name="player_collider"
                        args={[0.048]} // 动态调整球体碰撞体的半径
                    />
                    <BallCollider
                        collisionGroups={interactionGroups(0, [1, 2, 3])}//不和墙壁碰撞
                        name='player_on_hit_expanding_ring_hit_box'
                        ref={playerHitBoxRef}
                        args={[playerOnHitExpandingRingHitBoxSize]} // 动态调整球体碰撞体的半径
                    />
                    <PlayerOnHitExpandingRingEffect />
                    {process.env.NODE_ENV == "development" && <Html>
                        <button className="text-white top-5 absolute" onClick={() => {
                            onHit(undefined as any, { rigidBodyObject: { userData: { type: 'enemy_normal_projectile' } } } as any)
                        }}>
                            OnHIt
                        </button>
                        <button className="text-white top-10 absolute" onClick={() => {
                            console.log(playerInfo)
                        }}>
                            get player
                        </button>
                    </Html>}
                </group>
            </RigidBody>
            <PlayerMoveEffects />
            <OtherPlayerContainer />
        </>
    );
};