import { animated, useSpring } from '@react-spring/web';
import React, { useEffect, useRef, useState } from 'react'
import { GamepadManager } from '../../modules/GamepadManager';
import useGamePauseStore from '../../store/GamePauseStore';
import useAudioStore from '../../store/AudioStore';

const AnimatedDiv = animated('div');
export default function GamePauseOverlay() {
    const opacityValueRef = useRef<number>(0)
    const [styles, api] = useSpring(() => ({
        from: { opacity: opacityValueRef.current },
    }));
    const [volume, setVolume] = useState<number>(0.3)
    const setAllVolume = useAudioStore(state => state.setAllVolume)

    const handlePauseChange = (isPause: boolean) => {
        api.stop()
        if (isPause) {
            api.start({
                from: { opacity: opacityValueRef.current },
                to: { opacity: 0.6 },
                config: { duration: 600 },
                onChange: (value) => {
                    opacityValueRef.current = value.value.opacity
                }
            })
        } else {
            api.start({
                from: { opacity: opacityValueRef.current },
                to: { opacity: 0 },
                config: { duration: 300 },
                onChange: (value) => {
                    opacityValueRef.current = value.value.opacity
                }
            })
        }
    }

    useEffect(() => useGamePauseStore.subscribe(
        state => state.isPaused, handlePauseChange
    ), [])

    return (
        <AnimatedDiv className='w-screen h-screen bg-[#2e2c27] pointer-events-auto z-10' style={{
            opacity: styles.opacity,
            display: styles.opacity.to((opacity) => opacity === 0 ? 'none' : 'flex')
        }}>
            <div className='container mx-auto flex items-center justify-center h-full flex-col'>
                <div className='text-white text-6xl'>
                    GAME STOP
                    <div className='text-white text-xl mt-10'>
                        <p>Volume</p>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.1}
                            defaultValue={volume}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg dark:bg-gray-700 pointer-events-auto"
                            onChange={(e) => {
                                const value = parseFloat(e.target.value)
                                setVolume(value)
                                setAllVolume(value)
                            }} />
                    </div>
                </div>
            </div>
        </AnimatedDiv>
    )
}
