import { useThree } from '@react-three/fiber';
import { CuboidCollider, interactionGroups, RigidBody } from '@react-three/rapier';
import React from 'react'

//https://stackoverflow.com/questions/77764960/react-three-rapier-scene-limitation-for-objects
export default function AirWall() {
    const { viewport } = useThree(); //viewport bounds
    const wallHeight = 0.1;
    const depth = 0
    return (
        <group position={[0, 0, 0]}>
            <RigidBody type="fixed" collisionGroups={interactionGroups(100, [0, 1, 2])}>
                {/* FRONT */}
                <Wall
                    width={viewport.width / 2}
                    height={wallHeight / 2}
                    depth={depth}
                    x={0}
                    y={wallHeight / 2}
                    z={viewport.height / 2}
                />
                {/* BACK */}
                <Wall
                    width={viewport.width / 2}
                    height={wallHeight / 2}
                    depth={depth}
                    x={0}
                    y={wallHeight / 2}
                    z={-viewport.height / 2}
                />
                {/* LEFT */}
                <Wall
                    width={depth}
                    height={wallHeight / 2}
                    depth={viewport.height}
                    x={-viewport.width / 2}
                    y={wallHeight / 2}
                    z={0}
                />
                {/* RIGHT */}
                <Wall
                    width={depth}
                    height={wallHeight / 2}
                    depth={viewport.height}
                    x={viewport.width / 2}
                    y={wallHeight / 2}
                    z={0}
                />
            </RigidBody>
        </group>

    );
}

function Wall({
    height,
    width,
    depth,
    x,
    y,
    z,
}: {
    height: number;
    width: number;
    depth: number;
    x: number;
    y: number;
    z: number;
}) {
    return <CuboidCollider args={[width, height, depth]} position={[x, y, z]} />;
}