import { useKeyboardControls } from '@react-three/drei';
import React, { useEffect } from 'react'
import useGamePauseStore from '../store/GamePauseStore';
import { GamepadManager } from '../modules/GamepadManager';
import { useDebouncedCallback } from 'use-debounce';

const gamepadManager = new GamepadManager();
export default function GamePauseSystem() {
    const [sub, get] = useKeyboardControls()
    const togglePause = useGamePauseStore(state => state.togglePause);

    const debouncedGamePadStateUpdate = useDebouncedCallback((gamepadState: any) => {
        if (gamepadState.buttons['Start'] ||
            gamepadState.buttons['Options']) {
            togglePause()
        }
    }, 100)

    const handleGamePadStateUpdate = (gamepadState: any) => {
        if (gamepadState.buttons['Start'] ||
            gamepadState.buttons['Options']) {
            debouncedGamePadStateUpdate(gamepadState)
        }
    }

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

    useEffect(() => {
        gamepadManager.on('update', handleGamePadStateUpdate)
        return () => {
            // 清理订阅
            gamepadManager.off("update", handleGamePadStateUpdate);
        };
    }, [])

    return (null)
}
