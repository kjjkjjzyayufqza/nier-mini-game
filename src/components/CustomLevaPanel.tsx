import React, { useCallback, useContext, useMemo, useRef, useState } from 'react'
import { button, Leva, useControls } from 'leva'
import { Html } from '@react-three/drei'
import { Schema } from 'leva/dist/declarations/src/types/public';
import usePlayerStore from '../store/PlayerStore';
import systemInfoStore from '../store/SystemInfoStore';
import useAudioStore from '../store/AudioStore';
import { EmptyEnemyData, EnemyData } from '../data/EnemyData';
import { filePicker } from "leva-file-picker";

export default function CustomLevaPanel() {
    const setCurrentPhase = systemInfoStore(state => state.setCurrentPhase)
    const currentPhase = systemInfoStore(state => state.systemInfo.currentPhase)
    const importantPhaseRecord = systemInfoStore(state => state.importantPhaseRecord)
    const updatePlayerInfo = usePlayerStore(state => state.updatePlayerInfo)
    const systemInfo = systemInfoStore(state => state.systemInfo)
    const { initVolume, play: playAudio, setAllVolume, stop: stopAudio, addSound, removeSound, removeSoundByType, sounds } = useAudioStore();
    const firstLoad = useRef(true)

    function onFileChange(file: File) {
        if (!file) {
            // 如果 file 为 null 或 undefined，进入移除逻辑
            removeSoundByType("music");
            return;
        }
        stopAudio('Weight of the World')
        if (sounds[file.name]) {
            stopAudio(file.name);
            removeSoundByType("music");
        }
        addSound(file.name, URL.createObjectURL(file), {
            type: "music",
            loop: true,
        });
        playAudio(file.name);
    }


    const accept = {
        "audio/*": [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"]
    };

    const systemOptions = useCallback(() => {
        const value: Schema = {
            'Music': filePicker({ onChange: onFileChange, accept }),
            // 'Music Volume': filePicker({ onChange, accept }),
            effectVolume: {
                label: "Effect Volume",
                value: initVolume,
                min: 0,
                max: 1,
                onChange: (v) => {
                    setAllVolume(v)
                }
            }
        }
        return value
    }, [setAllVolume, stopAudio, removeSound, addSound, playAudio, initVolume, firstLoad])

    const debugOptions = useCallback(() => {
        const value: Schema = {
            'Clear Enemy': button((get) => {
                PubSub.publish("resetEnemiesData", {
                    type: "empty"
                })
            }),
            help: {
                label: "Help",
                value: false,
                onChange: (v) => {
                    updatePlayerInfo({ needOtherPlayerHelp: v })
                }
            }
        }
        return value
    }, [])

    const pSystem = useControls('System', systemOptions)
    const pDebug = useControls('Debug', debugOptions)

    return (
        <></>
    )
}
