import { Canvas } from '@react-three/fiber'
import { KeyboardControls, Loader, OrbitControls, PerformanceMonitor, Stats } from '@react-three/drei';
import { Player } from './Player';
import { Physics } from '@react-three/rapier';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import AirWall from './AirWall';
import { ThreeEffects } from './ThreeEffects';
import { NoToneMapping } from 'three';
import { SceneEffects } from './SceneEffects';
import { Perf } from 'r3f-perf'
import { ProjectileSystem } from './ProjectileSystem';
import CameraEffectsSystem from './CameraEffectsSystem';
import CustomLevaPanel from './CustomLevaPanel';
import { button, Leva, useControls } from 'leva';
import SceneBackgroundText from './SceneBackgroundText';
import PlayTimerCounter from './PlayTimerCounter';
import { EnemySystemV3 } from './EnemySystemV3';
import { Schema } from 'leva/dist/declarations/src/types/public';
import systemInfoStore from '../store/SystemInfoStore';
import { isGameClear } from '../lib/isGameClear';

const keyboardMap = [
  { name: "forward", keys: ["KeyW"] },
  { name: "backward", keys: ["KeyS"] },
  { name: "left", keys: ["KeyA"] },
  { name: "right", keys: ["KeyD"] },
  { name: "escape", keys: ["Escape"] },
]

export default function CanvasContainer() {
  const gameStarted = systemInfoStore((state) => state.gameStarted);
  const sceneRef = useRef<any>(undefined)
  const [dpr, setDpr] = useState(1)
  const sceneOptions = useMemo(() => {
    const sceneDebugOption: Schema = {
      bgColor: {
        label: "Background Color",
        value: "#22201C",
      },
      postEffects: {
        label: "Post Effects",
        value: true,
      },
    }
    return sceneDebugOption
  }, [])
  const debugOptions = useMemo(() => {
    const value: Schema = {
      r3f_perf: {
        label: "r3f-perf",
        value: true,
      },
      threeStats: {
        label: "Stats",
        value: true,
      },
      freeCamera: {
        label: "Free Camera",
        value: false,
      },
      hitBoxDebug: {
        label: "Hit Box Debug",
        value: false,
      }
    }
    return value
  }, [])

  const pScene: any = useControls('Scene', sceneOptions)
  const pDebug: any = useControls('Debug', debugOptions)

  return (
    <KeyboardControls map={keyboardMap}>
      <Leva collapsed={true} hidden={!isGameClear()} />
      <Canvas
        ref={sceneRef}
        dpr={dpr}
        camera={{ position: [0, 2.2, 0], fov: 50, rotation: [-Math.PI / 2, 0, Math.PI], near: 0.1, far: 1000 }}
        gl={{
          toneMapping: NoToneMapping,
          powerPreference: "high-performance",
        }}
      >
        <PerformanceMonitor onIncline={() => setDpr(1)} onDecline={() => setDpr(0.75)} />
        <CustomLevaPanel />
        <color attach="background" args={[pScene.bgColor]} />
        <ambientLight intensity={4.1} color={'#E1DECE'} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={1} />
        {gameStarted &&
          <>
            <Physics debug={pDebug.hitBoxDebug} timeStep={"vary"}>
              {/* timeStep = vary 是为了避免当前帧率低于设置的值，可能会导致物理更新滞后，影响流畅性 */}
              <AirWall />
              <Player />
              <EnemySystemV3 />
              <ProjectileSystem />
            </Physics>
          </>
        }
        <CameraEffectsSystem />
        <PlayTimerCounter />
        {pDebug.freeCamera && <OrbitControls />}
        <SceneBackgroundText />
        <SceneEffects />
        {sceneOptions.postEffects && <ThreeEffects />}
        {pDebug.r3f_perf && <Perf position='top-left' style={{ marginTop: "3rem" }} />}
        {pDebug.threeStats && <Stats />}
      </Canvas>
      <Loader />
    </KeyboardControls >
  )
}

