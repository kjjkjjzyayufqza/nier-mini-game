import * as THREE from 'three';

export function PlayerEffectsBoxParticle({
    id,
    type,
    position,
    boxSize,
}: {
    id: string,
    type: 'white' | 'black';
    position: THREE.Vector3;
    boxSize: [number, number, number];
}) {
    // 创建一个 Group 来包含所有子对象
    const group = new THREE.Group();
    group.name = id
    group.visible = false

    // 创建 BoxGeometry 和 EdgesGeometry
    const boxGeometry = new THREE.BoxGeometry(...boxSize);
    const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);

    // 创建线框材质
    const lineMaterial = new THREE.LineBasicMaterial({
        color: '#8b8b8b',
        opacity: 1,
        transparent: true,
    });

    // 创建线框对象
    const lineSegments = new THREE.LineSegments(edgesGeometry, lineMaterial);
    lineSegments.position.copy(position);

    // 如果是 "white" 类型
    if (type === 'white') {
        // 创建主立方体
        const mainMeshMaterial = new THREE.MeshStandardMaterial({
            color: '#DFE0DD',
            emissive: '#DFE0DD',
            emissiveIntensity: 1.2,
            transparent: true,
        });
        const mainMesh = new THREE.Mesh(boxGeometry, mainMeshMaterial);
        mainMesh.position.copy(position);
        mainMesh.renderOrder = 0;

        // 创建背面透明立方体
        const backMeshMaterial = new THREE.MeshBasicMaterial({
            color: '#8b8b8b',
            side: THREE.BackSide,
            depthTest: false,
            transparent: true,
            opacity: 0.5,
        });
        const backMesh = new THREE.Mesh(boxGeometry, backMeshMaterial);
        backMesh.position.copy(position);
        backMesh.renderOrder = 0;
        lineSegments.scale.set(1.05, 1.05, 1.05);
        // 将对象添加到组中
        group.add(mainMesh);
        group.add(lineSegments);
        group.add(backMesh);
    }

    // 如果是 "black" 类型
    else if (type === 'black') {
        // 创建背面白色立方体
        const backMeshMaterial = new THREE.MeshBasicMaterial({
            color: 'white',
            side: THREE.BackSide,
            depthTest: false,
            transparent: true,
            opacity: 0,
        });
        const backMesh = new THREE.Mesh(boxGeometry, backMeshMaterial);
        backMesh.position.copy(position);
        backMesh.renderOrder = 0;

        // 将对象添加到组中
        group.add(lineSegments);
        group.add(backMesh);
    }

    // 返回组
    return group;
}
