import { useThree } from "@react-three/fiber"
import { useLayoutEffect } from "react"

//https://discourse.threejs.org/t/r3f-vertical-sync-with-useframe/60132/3
export function FrameLimiter({ fps = 60 }) {
    const { advance, set, frameloop: initFrameloop } = useThree()
    useLayoutEffect(() => {
        let elapsed = 0
        let then = 0
        let raf: any = null
        const interval = 1000 / fps
        function tick(t: any) {
            raf = requestAnimationFrame(tick)
            elapsed = t - then
            if (elapsed > interval) {
                advance(t)
                then = t - (elapsed % interval)
            }
        }
        // Set frameloop to never, it will shut down the default render loop
        set({ frameloop: 'never' })
        // Kick off custom render loop
        raf = requestAnimationFrame(tick)
        // Restore initial setting
        return () => {
            cancelAnimationFrame(raf)
            set({ frameloop: initFrameloop })
        }
    }, [fps])

    return <></>
}