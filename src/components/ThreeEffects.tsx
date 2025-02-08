import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass';
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { Vector2 } from 'three';
import { useRef, useEffect } from 'react';

extend({
    RenderPass,
    EffectComposer,
    OutlinePass,
    DotScreenPass,
    RenderPixelatedPass,
    UnrealBloomPass,
    SSAOPass,
    OutputPass,
    SMAAPass,
});

declare global {
    namespace JSX {
        interface IntrinsicElements {
            outlinePass: any;
            dotScreenPass: any;
            renderPixelatedPass: any;
            unrealBloomPass: any;
        }
    }
}

// Uncomment the passes you want to use
export const ThreeEffects = () => {
    const { camera, gl, scene } = useThree();
    const composer = useRef<EffectComposer>(null);

    useEffect(() => {
        composer.current = new EffectComposer(gl);
        composer.current.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(
            new Vector2(window.innerWidth, window.innerHeight),
            0.5,
            0.4,
            0.85
        );
        composer.current.addPass(bloomPass);

        const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
        composer.current.addPass(ssaoPass);

        const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
        composer.current.addPass(smaaPass);

        const outputPass = new OutputPass();
        composer.current.addPass(outputPass);

        // Resize the composer when the window size changes
        composer.current.setSize(window.innerWidth, window.innerHeight);
    }, [gl, scene, camera]);

    useFrame(() => {
        composer.current?.render();
    }, 1);

    return null;
};