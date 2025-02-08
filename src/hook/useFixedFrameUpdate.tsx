import { RenderCallback, useFrame } from "@react-three/fiber";
import { useRef } from "react";

export function useFixedFrameUpdate(callback: RenderCallback, step = 1 / 60) {
    const accumulatorRef = useRef(0);

    useFrame((state, delta) => {
        accumulatorRef.current += Math.min(delta, 1 / 30);

        while (accumulatorRef.current >= step) {
            callback(state, step);
            accumulatorRef.current -= step;
        }
    });
}
