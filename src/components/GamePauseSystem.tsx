import { useKeyboardControls } from '@react-three/drei';
import React, { useEffect } from 'react'
import useGamePauseStore from '../store/GamePauseStore';

export default function GamePauseSystem() {
    const [sub, get] = useKeyboardControls()
    const togglePause = useGamePauseStore(state => state.togglePause);

    useEffect(() => {
        return sub(
            (state) => state.escape,
            (pressed) => {
                if (pressed) {
                    togglePause()
                }
            }
        )
    }, [])
    return (null)
}
