import { RapierRigidBody, InstancedRigidBodies, interactionGroups, InstancedRigidBodyProps, MeshCollider, CuboidCollider, vec3, CollisionTarget } from '@react-three/rapier';
import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three';
import { IEnemyProjectile, IProjectile } from '../store/PlayerStore';
import { useFixedFrameUpdate } from '../hook/useFixedFrameUpdate';

export default function EnemyNormalProjectile() {
    const enemyProjectileRigidBodies = useRef<RapierRigidBody[]>([]);
    const enemyInstancesMeshRef = useRef<THREE.InstancedMesh>(null);
    const ENEMY_PROJECTILE_COUNT = 200
    const projectileSpeed = 0.5
    const projectilesIndex = useRef<number>(-1)
    const maxProjectilesRange = { x: 3, z: 3 }
    const idlePositionBox = {
        value: vec3({ x: 0, y: -1, z: 11 }),
        minY: -1,
        maxY: -100
    }

    // 顶点着色器
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
varying vec2 vUv;
uniform vec3 uInnerColor;  // 圆心颜色
uniform vec3 uOuterColor;  // 中间颜色
uniform vec3 uGlowColor;    // 自定义自发光颜色
uniform vec3 uOutlineColor;  // 外轮廓颜色
uniform float uAlpha;      // 最大透明度
uniform float uGlowStrength; // 自发光强度

void main() {
    // 计算当前片段到圆心的距离
    float dist = distance(vUv, vec2(0.5));

    if (dist > 0.5) discard;

    // 调整距离值以实现更加柔和的边缘（平方函数）
    float smoothDist = smoothstep(0.25, 0.5, dist);

    // 计算颜色渐变：从圆心的 uInnerColor 到边缘的 uOuterColor
    vec3 gradientColor = mix(uInnerColor, uOuterColor, pow(smoothDist, 5.0));

    // 计算发光强度：距离越小，发光越强
    float glow = (1.0 - dist) * uGlowStrength;

    // 叠加自发光效果，使用自定义的发光颜色
    vec3 glowingColor = gradientColor + glow * uGlowColor;

    // 透明度从圆心到边缘逐渐减弱（使用平方函数柔化边缘透明度）
    float gradientAlpha = uAlpha * (1.0 - smoothDist * smoothDist);

    // 设置圆形颜色和透明度
    gl_FragColor = vec4(glowingColor, gradientAlpha);
}
`;

    const shootProjectile = (data: IProjectile) => {
        if (projectilesIndex.current < ENEMY_PROJECTILE_COUNT - 1) {
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
        enemyProjectileRigidBodies.current[projectilesIndex.current].setEnabled(true)
        enemyProjectileRigidBodies.current[projectilesIndex.current].setTranslation(position, true);
        enemyProjectileRigidBodies.current[projectilesIndex.current].setLinvel({
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

    const enemyInstances = useMemo(() => {
        const instances: InstancedRigidBodyProps[] = [];
        let countY = idlePositionBox.minY
        for (let i = 0; i < ENEMY_PROJECTILE_COUNT; i++) {
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
                key: "enemy_normal_projectile_" + i,
                position: position,
                rotation: [0, 0, 0],
                userData: {
                    id: "enemy_normal_projectile_" + i,
                    type: 'enemy_normal_projectile'
                }
            });
        }
        return instances;
    }, []);

    useEffect(() => {
        if (!enemyInstancesMeshRef.current) return
        if (enemyInstancesMeshRef.current) {
            enemyInstancesMeshRef.current.frustumCulled = false
        }
        if (enemyProjectileRigidBodies.current) {
            enemyProjectileRigidBodies.current.forEach((projectile) => {
                projectile.setEnabled(false)
            })
        }

        const enemyShootProjectileToken = PubSub.subscribe('enemyShootProjectile', (msg: string, data: IEnemyProjectile) => {
            shootProjectile(data)
        })
        const resetEnemyShootProjectileToken = PubSub.subscribe('resetEnemyShootProjectile', () => {
            enemyProjectileRigidBodies.current.forEach((projectile) => {
                resetProjectileDirection(projectile)
            })
        })
        return () => {
            PubSub.unsubscribe(enemyShootProjectileToken)
            PubSub.unsubscribe(resetEnemyShootProjectileToken)
        }
    }, [])

    useFixedFrameUpdate(() => {
        enemyProjectileRigidBodies.current.forEach((projectileRigidBody) => {
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
            name='enemy_normal_projectile_rigid_bodies'
            ref={enemyProjectileRigidBodies}
            instances={enemyInstances}
            collisionGroups={interactionGroups(2, [0])}
            gravityScale={0}
            onIntersectionEnter={(e) => {

            }}
            onCollisionEnter={({ manifold, target, other }) => {
                onHit(manifold, target, other)
            }}
            type='kinematicVelocity'
        >
            <instancedMesh
                args={[undefined, undefined, ENEMY_PROJECTILE_COUNT]}
                count={ENEMY_PROJECTILE_COUNT}
                ref={enemyInstancesMeshRef}
                rotation={[Math.PI / -2, 0, 0]}>
                <planeGeometry args={[0.1, 0.1]} />
                <shaderMaterial
                    attach="material"
                    uniforms={{
                        uInnerColor: { value: [0.45, 0.23, 0] },
                        uOuterColor: { value: [0.35, 0.13, 0.04] },
                        uGlowColor: { value: [1, 0, 0] },
                        uOutlineColor: { value: [1, 0.3, 0] },
                        uAlpha: { value: 1 }, // 最大透明度
                        uGlowStrength: { value: 3.5 }, // 自发光强度
                    }}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    transparent={true}
                />
            </instancedMesh>
        </InstancedRigidBodies>
    )
}


