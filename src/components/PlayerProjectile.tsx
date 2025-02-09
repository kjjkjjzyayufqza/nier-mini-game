import { RapierRigidBody, vec3, InstancedRigidBodyProps, InstancedRigidBodies, interactionGroups, CollisionTarget } from '@react-three/rapier';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import usePlayerStore, { IProjectile } from '../store/PlayerStore';
import * as THREE from 'three';
import systemInfoStore from '../store/SystemInfoStore';
import { useFixedFrameUpdate } from '../hook/useFixedFrameUpdate';

export default function PlayerProjectile() {
    const [overRangeLimit, setOverRangeLimit] = useState<"airWall" | "maxRange">("maxRange")
    const projectileRigidBodies = useRef<RapierRigidBody[]>([]);
    const projectilesIndex = useRef<number>(-1)
    const playerInstancedMeshRef = useRef<THREE.InstancedMesh>(null);
    const maxProjectilesRange = { x: 5, z: 5 }
    const projectileSpeed = 2
    const PLAYER_PROJECTILE_COUNT = 100
    const idlePositionBox = {
        value: vec3({ x: 0, y: -1, z: 10 }),
        minY: -1,
        maxY: -100
    }
    const playerProjectileSummaries = useRef<{
        totalHit: number,
    }>({
        totalHit: 0,
    })
    const currentPhase = systemInfoStore(state => state.systemInfo.currentPhase)
    const setPlayerShareInfo = usePlayerStore(state => state.setPlayerShareInfo)

    const playerInstances = useMemo(() => {
        const instances: InstancedRigidBodyProps[] = [];
        let countY = idlePositionBox.minY
        for (let i = 0; i < PLAYER_PROJECTILE_COUNT; i++) {
            const position = vec3({
                x: idlePositionBox.value.x,
                y: countY,
                z: idlePositionBox.value.z
            })
            countY -= 0.05
            if (countY < idlePositionBox.maxY) {
                countY = idlePositionBox.minY
            }
            instances.push({
                key: "player_projectile_" + i,
                name: "player_projectile_" + i,
                position: position,
                rotation: [0, 0, 0],
                userData: { id: "player_projectile_" + i, type: 'player_projectile' }
            });
        }
        return instances;
    }, []);

    const shootProjectile = (data: IProjectile) => {
        projectilesIndex.current = (projectilesIndex.current + 1) % PLAYER_PROJECTILE_COUNT
        const position = vec3({
            x: data.position.x,
            y: data.position.y,
            z: data.position.z
        })
        const velocity = vec3({
            x: data.direction.x,
            y: 0,
            z: data.direction.z,
        }).normalize().multiplyScalar(projectileSpeed);;
        projectileRigidBodies.current[projectilesIndex.current].setTranslation(position, true);
        projectileRigidBodies.current[projectilesIndex.current].setRotation(data.projectileRotation, true);
        projectileRigidBodies.current[projectilesIndex.current].setLinvel({
            x: velocity.x,
            y: velocity.y,
            z: velocity.z
        }, true);
        projectileRigidBodies.current[projectilesIndex.current].setAngvel({ x: 0, y: 0, z: 0 }, true);
    }

    const onHit = (manifold: any, target: CollisionTarget, other: CollisionTarget) => {
        playerProjectileSummaries.current.totalHit++
        const hitPosition = target.rigidBody?.translation()
        if (other?.rigidBodyObject?.userData.type == 'enemy_normal_projectile') {
            PubSub.publish('startHitExpandingRingBoundaryAnimation', { position: hitPosition })
            PubSub.publish('hitExplosionSmallParticle', { position: hitPosition })
            PubSub.publish('hitWhiteMaskEffects', { position: hitPosition })
        } else if (other?.rigidBodyObject?.userData.type == 'enemy_rigidbody') {
            PubSub.publish('startHitAnimation', hitPosition)
            PubSub.publish('startHitExpandingRingAnimation', { position: hitPosition })
            PubSub.publish('hitExplosionParticle', { position: hitPosition })
        }
        const projectile = projectileRigidBodies.current.find((projectile) => (projectile.userData as any)?.id == target.rigidBodyObject?.userData.id)
        resetProjectileDirection(projectile)
    }

    const resetProjectileDirection = (projectile: RapierRigidBody | any) => {
        const idlePosition = playerInstances.find((instance) => instance.key == projectile.userData.id)?.position
        projectile.setLinvel(vec3({ x: 0, y: 0, z: 0 }), true)
        projectile.setTranslation(idlePosition, true)
        projectile.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
    }

    useFixedFrameUpdate(() => {
        if (overRangeLimit == "airWall") return
        projectileRigidBodies.current.forEach((projectileRigidBody) => {
            //如果x或z超出边界，销毁
            if (!projectileRigidBody.isEnabled()) return
            if (!projectileRigidBody.isMoving()) return
            const position = projectileRigidBody.translation()
            if (Math.abs(position.x) > maxProjectilesRange.x || Math.abs(position.z) > maxProjectilesRange.z) {
                resetProjectileDirection(projectileRigidBody)
            }
        })
    })

    useEffect(() => {
        const shootProjectileToken = PubSub.subscribe('shootProjectile', (msg: string, data: IProjectile) => {
            shootProjectile(data)
        })
        const resetPlayerProjectilesToken = PubSub.subscribe('resetPlayerProjectiles', () => {
            projectileRigidBodies.current.forEach((projectile) => {
                resetProjectileDirection(projectile)
            })
        })
        return () => {
            PubSub.unsubscribe(shootProjectileToken)
            PubSub.unsubscribe(resetPlayerProjectilesToken)
        }
    }, [])

    useEffect(() => {
        if (playerInstancedMeshRef.current) {
            playerInstancedMeshRef.current.frustumCulled = false
        }
    }, [])

    useEffect(() => {
        if (currentPhase === "end") {
            setPlayerShareInfo({
                shootHitCount: playerProjectileSummaries.current.totalHit
            })
        }
    }, [currentPhase])


    return (
        <InstancedRigidBodies
            name='player_projectile_rigid_bodies'
            ref={projectileRigidBodies}
            instances={playerInstances}
            collisionGroups={interactionGroups(0, [1, 2, overRangeLimit == "airWall" ? 100 : 101])}
            gravityScale={0}
            enabledRotations={[false, false, false]}
            enabledTranslations={[true, false, true]}
            onIntersectionEnter={(e) => {

            }}
            onCollisionEnter={({ manifold, target, other }) => {
                onHit(manifold, target, other)
                // projectileRigidBodies.current.forEach((projectile) => {
                //     if ((projectile.userData as any)?.id == target.rigidBodyObject?.userData.id) {
                //         const position = manifold.solverContactPoint(0)
                //         onHit(vec3({ x: position.x, y: position.y, z: position.z }), other.rigidBodyObject?.userData, other.rigidBody?.isEnabled(), projectile)
                //     }
                // })
            }}
        >
            <instancedMesh args={[undefined, undefined, PLAYER_PROJECTILE_COUNT]} count={PLAYER_PROJECTILE_COUNT} ref={playerInstancedMeshRef}>
                <boxGeometry args={[0.11, 0.028, 0.028]} />
                <meshStandardMaterial color={"#D8B589"} emissive={"#D8B589"} emissiveIntensity={2} />
            </instancedMesh>
        </InstancedRigidBodies>
    )
}
