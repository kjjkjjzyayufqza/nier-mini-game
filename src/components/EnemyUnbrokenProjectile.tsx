import { RapierRigidBody, InstancedRigidBodies, interactionGroups, InstancedRigidBodyProps, MeshCollider, CuboidCollider, vec3, CollisionTarget } from '@react-three/rapier';
import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three';
import { IEnemyProjectile, IProjectile } from '../store/PlayerStore';
import systemInfoStore from '../store/SystemInfoStore';
import { useFixedFrameUpdate } from '../hook/useFixedFrameUpdate';

export default function EnemyUnbrokenProjectile() {
    const enemyUnbrokenProjectileRigidBodies = useRef<RapierRigidBody[]>([]);
    const enemyUnbrokenInstancesMeshRef = useRef<THREE.InstancedMesh>(null);
    const ENEMY_UNBROKEN_PROJECTILE_COUNT = 200
    const projectileSpeed = 0.5
    const projectilesIndex = useRef<number>(-1)
    const maxProjectilesRange = { x: 3, z: 3 }
    const idlePositionBox = {
        value: vec3({ x: 0, y: -1, z: 12 }),
        minY: -1,
        maxY: -100
    }

    const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;

    // 旋转角度
    float angle = -3.14159 / -2.0;

    // 绕 X 轴的旋转矩阵
    mat4 rotationMatrix = mat4(1.0);
    rotationMatrix[1][1] = cos(angle);   // Y轴
    rotationMatrix[1][2] = -sin(angle);  // Y轴向 Z 轴的分量
    rotationMatrix[2][1] = sin(angle);   // Z轴向 Y 轴的分量
    rotationMatrix[2][2] = cos(angle);   // Z轴

    // 使用 instanceMatrix 和旋转矩阵
    gl_Position = projectionMatrix * viewMatrix * instanceMatrix * rotationMatrix * vec4(position, 1.0);
}

    `;


    const fragmentShader = `
    uniform vec3 centerColor;
    uniform vec3 edgeColor;
    uniform vec3 outlineColor;
    varying vec2 vUv;
  
    void main() {
      float dist = length(vUv - vec2(0.5)); // 计算到中心的距离
      //在最外圈增加一层白色
      if(dist > 0.38 && dist < 0.5) {
        float alpha = smoothstep(0.42, 0.5, dist);
        vec3 color = mix(centerColor, outlineColor, alpha);
        gl_FragColor = vec4(color, 0.5);
        return;
      }
      float alpha = smoothstep(0.4, 0.5, dist); // 计算模糊效果
      vec3 color = mix(centerColor, edgeColor, alpha);
      gl_FragColor = vec4(color, 1.0 - alpha); // 最外层为白色
    }
  `;

    const enemyInstances = useMemo(() => {
        const instances: InstancedRigidBodyProps[] = [];
        let countY = idlePositionBox.minY
        for (let i = 0; i < ENEMY_UNBROKEN_PROJECTILE_COUNT; i++) {
            const position = vec3({
                x: idlePositionBox.value.x,
                y: countY,
                z: idlePositionBox.value.z
            })
            countY -= 0.01
            if (countY < idlePositionBox.maxY) {
                countY = idlePositionBox.minY
            }
            instances.push({
                key: "enemy_unbroken_projectile_" + i,
                position: position,
                rotation: [0, 0, 0],
                userData: {
                    id: "enemy_unbroken_projectile_" + i,
                    type: 'enemy_unbroken_projectile'
                }
            });
        }
        return instances;
    }, []);

    const shootProjectile = (data: IProjectile) => {
        if (projectilesIndex.current < ENEMY_UNBROKEN_PROJECTILE_COUNT - 1) {
            projectilesIndex.current++
        } else {
            projectilesIndex.current = 0
        }
        const position = vec3({
            x: data.position.x,
            y: data.position.y,
            z: data.position.z
        })
        const velocity = vec3({
            x: data.direction.x,
            y: 0,
            z: data.direction.z,
        }).normalize().multiplyScalar(projectileSpeed);
        enemyUnbrokenProjectileRigidBodies.current[projectilesIndex.current].setEnabled(true)
        enemyUnbrokenProjectileRigidBodies.current[projectilesIndex.current].setTranslation(position, true);
        enemyUnbrokenProjectileRigidBodies.current[projectilesIndex.current].setLinvel({
            x: velocity.x,
            y: velocity.y,
            z: velocity.z
        }, true);
    }


    const resetProjectileDirection = (projectile: RapierRigidBody | any) => {
        const idlePosition = enemyInstances.find((instance) => instance.key == projectile.userData.id)?.position
        projectile.setEnabled(false)
        projectile.setLinvel(vec3({ x: 0, y: 0, z: 0 }), true)
        projectile.setTranslation(idlePosition, true)
        projectile.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
    }

    const onHit = (manifold: any, target: CollisionTarget, other: CollisionTarget) => {
        //当击中玩家或者被玩家子弹击中时，消失
        if (other?.colliderObject?.name == "player_on_hit_expanding_ring_hit_box") {
            const hitPosition = target.rigidBody?.translation()
            PubSub.publish('hitExplosionSmallParticle', { position: hitPosition })
        }
        resetProjectileDirection(target.rigidBody)
    }

    useEffect(() => {
        if (enemyUnbrokenInstancesMeshRef.current) {
            enemyUnbrokenInstancesMeshRef.current.frustumCulled = false
        }
        if (enemyUnbrokenProjectileRigidBodies.current) {
            enemyUnbrokenProjectileRigidBodies.current.forEach((projectile) => {
                projectile.setEnabled(false)
            })
        }
        const enemyShootUnbrokenProjectileToken = PubSub.subscribe('enemyShootUnbrokenProjectileToken', (msg: string, data: IEnemyProjectile) => {
            shootProjectile(data)
        })
        const resetEnemyShootUnbrokenProjectileToken = PubSub.subscribe('resetEnemyShootUnbrokenProjectileToken', () => {
            enemyUnbrokenProjectileRigidBodies.current.forEach((projectile) => {
                resetProjectileDirection(projectile)
            })
        })
        return () => {
            PubSub.unsubscribe(enemyShootUnbrokenProjectileToken)
            PubSub.unsubscribe(resetEnemyShootUnbrokenProjectileToken)
        }
    }, [])

    useFixedFrameUpdate(() => {
        enemyUnbrokenProjectileRigidBodies.current.forEach((projectileRigidBody) => {
            //如果x或z超出边界，销毁
            if (!projectileRigidBody.isEnabled()) return
            if (!projectileRigidBody.isMoving()) return
            const position = projectileRigidBody.translation()
            if (Math.abs(position.x) > maxProjectilesRange.x || Math.abs(position.z) > maxProjectilesRange.z) {
                resetProjectileDirection(projectileRigidBody)
            }
        })
    })

    return (
        <InstancedRigidBodies
            name='enemy_unbroken_projectile_rigid_bodies'
            ref={enemyUnbrokenProjectileRigidBodies}
            instances={enemyInstances}
            collisionGroups={interactionGroups(3, [0])}
            gravityScale={0}
            onIntersectionEnter={(e) => {

            }}
            onCollisionEnter={({ manifold, target, other }) => {
                onHit(manifold, target, other)
            }}
            type='kinematicVelocity'
        >
            <instancedMesh args={[undefined, undefined, ENEMY_UNBROKEN_PROJECTILE_COUNT]} count={ENEMY_UNBROKEN_PROJECTILE_COUNT} ref={enemyUnbrokenInstancesMeshRef}
                rotation={[Math.PI / -2, 0, 0]}>
                <planeGeometry args={[0.1, 0.1]} />
                <shaderMaterial
                    attach="material"
                    uniforms={{
                        centerColor: { value: [0.74, 0.01, 0.18] }, // 粉红色
                        edgeColor: { value: [0.24, 0, 0.06] }, // 白色
                        outlineColor: { value: [0.76, 0.38, 0.56] }, // 白色
                    }}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    transparent={true}
                />
            </instancedMesh>
        </InstancedRigidBodies>
    )
}

