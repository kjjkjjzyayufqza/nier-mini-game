import React, { useContext, useEffect, useRef, useState } from 'react';
import usePlayerStore from '../store/PlayerStore';
import systemInfoStore from '../store/SystemInfoStore';
import { useFixedFrameUpdate } from '../hook/useFixedFrameUpdate';

export default function PlayTimerCounter() {
    const gameStarted = systemInfoStore(state => state.gameStarted);
    const currentPhase = systemInfoStore(state => state.systemInfo.currentPhase);
    const setPlayerShareInfo = usePlayerStore(state => state.setPlayerShareInfo)
    const timer = useRef<number>(0);


    useFixedFrameUpdate((state, delta) => {
        if (gameStarted) {
            timer.current += delta;
        }
    })

    useEffect(() => {
        if (currentPhase == 'end') {
            setPlayerShareInfo({ playerTime: timer.current });
        }
    }, [currentPhase])

    return (
        <></>
    );
}
