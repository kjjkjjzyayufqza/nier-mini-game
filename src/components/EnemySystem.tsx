import React, { useEffect, useRef, useState } from 'react'
import { Enemy } from './Enemy'
import { EnemyData, EnemyProps, FinalConfirmEnemy } from '../data/EnemyData'
import { Html, Text } from '@react-three/drei';
import usePlayerStore from '../store/PlayerStore';
import { useDebouncedCallback } from 'use-debounce';
import systemInfoStore from '../store/SystemInfoStore';
import useAudioStore from '../store/AudioStore';
import { useCutsceneStore } from '../store/CutsceneStore';


export const EnemySystem = React.memo(() => {
    const currentPhase = systemInfoStore(state => state.systemInfo.currentPhase);
    const setImportantPhaseRecord = systemInfoStore(state => state.setImportantPhaseRecord);
    const setCurrentPhase = systemInfoStore(state => state.setCurrentPhase);
    const startCutscene = useCutsceneStore(state => state.startCutscene);
    const setPlayerShareInfo = usePlayerStore(state => state.setPlayerShareInfo);
    const updatePlayerInfo = usePlayerStore(state => state.updatePlayerInfo);
    const playerHealth = usePlayerStore(state => state.playerInfo.playerHealth);
    const [enemiesMap, setEnemiesMap] = useState<Map<string, EnemyProps>>(new Map());
    const pendingEnemies = useRef<Set<string>>(new Set());
    const pointsRef = useRef<number>(0);
    const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
    const checkEnemyList = useRef<Set<string>>(new Set());
    const { play: playAudio } = useAudioStore();

    const batchAddEnemies = (enemies: EnemyProps[]) => {
        enemies.forEach(enemy => {
            if (enemy.isImportantPhase) {
                setImportantPhaseRecord(enemy.phase);
            }
            setEnemiesMap(prev => {
                const newMap = new Map(prev);
                if (!newMap.has(enemy.id)) {
                    newMap.set(enemy.id, enemy);
                }
                return newMap;
            });
        });
    }

    const handleUpdateEnemiesByPhase = (phase: string) => {
        const phaseEnemies = EnemyData.filter(e => e.phase === phase);
        batchAddEnemies(phaseEnemies);
    };

    const debouncedPhaseUpdate = useDebouncedCallback(
        (phase: string) => handleUpdateEnemiesByPhase(phase),
        500
    );

    useEffect(() => {
        if (playerHealth > 0) {
            console.log('currentPhase', currentPhase)
            debouncedPhaseUpdate(currentPhase);
        }
    }, [currentPhase, debouncedPhaseUpdate]);

    useEffect(() => {
        const resetEnemiesDataToken = PubSub.subscribe("resetEnemiesData", (msg: any, resetType: {
            type: string,
            phase?: string
        }) => {
            //重置敌人数据
            timersRef.current.forEach(timer => clearTimeout(timer)); // 清除所有定时器
            timersRef.current.clear(); // 清空定时器引用
            if (resetType?.type == "empty") {
                setEnemiesMap(new Map());
            } else if (resetType?.type == "resetPhase") {
                setEnemiesMap(new Map());
                setTimeout(() => {
                    handleUpdateEnemiesByPhase(resetType?.phase || currentPhase);
                }, 200)
            }
            checkEnemyList.current.clear();
        })

        const setFinalConfirmEnemiesDataToken = PubSub.subscribe("setFinalConfirmEnemiesData", (msg: any, data: EnemyProps) => {
            //设置最终确认敌人数据 FinalConfirmEnemy
            timersRef.current.forEach(timer => clearTimeout(timer)); // 清除所有定时器
            timersRef.current.clear(); // 清空定时器引用
            const newMap = new Map();
            newMap.set(FinalConfirmEnemy.id, FinalConfirmEnemy);
            setEnemiesMap(newMap);
            checkEnemyList.current.clear();
        })

        return () => {
            timersRef.current.forEach(timer => clearTimeout(timer));
            timersRef.current.clear();
            PubSub.unsubscribe(resetEnemiesDataToken);
            PubSub.unsubscribe(setFinalConfirmEnemiesDataToken);
        };
    }, []);

    const handleFinalConfirmEnemyOnDeath = () => {
        setTimeout(() => {
            startCutscene('startDestroyOnlineResultOverlay')
            new Promise(async (resolve) => {
                const req = await fetch('/api/destroy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                const req2 = await fetch('/api/gameClear')
                resolve(null)
            }).catch(() => { })

        }, 3000)
        setTimeout(() => {
            PubSub.publish("setDisablePlayerMove", true);
            PubSub.publish("setPlayerVisibleModel", false);
        }, 4000)
    }

    const handleFinalEnemyOnDeath = () => {
        setTimeout(() => {
            startCutscene('startPlayerSummary')
            setPlayerShareInfo({ points: pointsRef.current });
            updatePlayerInfo({ needOtherPlayerHelp: false })
        }, 3000)
        setTimeout(() => {
            PubSub.publish("setDisablePlayerMove", true);
            PubSub.publish("setPlayerVisibleModel", false);
        }, 4000)
    }

    const enemyOnDeath = (
        id: string,
        phase?: string,
        nextPhase?: string,
        isImportantPhase?: boolean,
        isNeedChidAllDead?: boolean,
        childrenIds?: string[],
        points: number = 0
    ) => {
        //避免同个敌人多次死亡
        if (checkEnemyList.current.has(id)) {
            setEnemiesMap(prev => {
                const newMap = new Map(prev);
                newMap.delete(id)
                return newMap;
            });
            return
        }
        pointsRef.current += points;
        checkEnemyList.current.add(id);
        playAudio('coreExplode1');
        if (id == "enemy_final") {
            handleFinalEnemyOnDeath()
        } else if (id == 'enemy_final_confirm') {
            handleFinalConfirmEnemyOnDeath()
        }
        checkPendingEnemies({
            id,
            phase,
            nextPhase,
            isImportantPhase,
            isNeedChidAllDead,
            childrenIds
        });
        setEnemiesMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(id)
            return newMap;
        });
    }

    const checkPendingEnemies = (deadEnemy: {
        id: string,
        phase?: string,
        nextPhase?: string,
        isImportantPhase?: boolean,
        isNeedChidAllDead?: boolean,
        childrenIds?: string[]
    }) => {
        //先检查pendingEnemies中是否有敌人，有就先处理
        if (pendingEnemies.current.size > 0) {
            pendingEnemies.current.forEach(id => {
                const enemy = EnemyData.find(e => e.id === id);
                if (enemy) {
                    //同时检查enemiesMap和id不是当前的，因为当前的还处于enemiesMap中
                    const childrenAlive = enemy.childrenIds?.some(id => enemiesMap.has(id) && id !== deadEnemy.id);
                    if (!childrenAlive && enemy.nextPhase) {
                        setCurrentPhase(enemy.nextPhase);
                        pendingEnemies.current.delete(id);
                    }
                }
            });
        }

        if (!deadEnemy?.isNeedChidAllDead) {
            if (deadEnemy.nextPhase) {
                setCurrentPhase(deadEnemy.nextPhase);
            }
            return;
        };

        //如果是isNeedChidAllDead，检查所有子敌人是否都死了
        const childrenAlive = deadEnemy.childrenIds?.some(id => enemiesMap.has(id));
        if (!childrenAlive && deadEnemy.nextPhase) {
            setCurrentPhase(deadEnemy.nextPhase);
        } else {
            // 如果有子敌人还活着，将父敌人加入待处理列表
            pendingEnemies.current.add(deadEnemy.id);
        }
    }

    return (
        <>
            <Html>
                {/* <button className='text-white' onClick={() => {
                    // const newMap = new Map();
                    // newMap.set(FinalConfirmEnemy.id, FinalConfirmEnemy);
                    // setEnemiesMap(newMap);
                    addNotification(t("unlockDebugMenu") + Math.random())
                }}>
                    log
                </button> */}
            </Html>
            {Array.from(enemiesMap.values()).map(enemy => (
                <Enemy
                    key={enemy.id}
                    {...enemy}
                    onDeath={enemyOnDeath}
                />
            ))}
        </>
    );
});
