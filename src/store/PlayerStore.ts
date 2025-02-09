import { create } from 'zustand';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import PubSub from 'pubsub-js'
import { subscribeWithSelector } from "zustand/middleware"; // 如果需要订阅特定状态变化

export interface IProjectile {
    id: any;
    position: THREE.Vector3;
    direction: THREE.Vector3;
    projectileRotation: THREE.Quaternion;
}

export interface IEnemyProjectile {
    id: any;
    enemyId: any;
    position: THREE.Vector3;
    direction: THREE.Vector3;
    projectileRotation: THREE.Quaternion;
    lifetime: number;
}

// 定义 PlayerInfo 的接口
interface IPlayerInfo {
    playerHealth: number;
    needOtherPlayerHelp: boolean;
}

// 定义 Zustand Store 的接口
interface IPlayerStore {
    playerInfo: IPlayerInfo;
    playerShareInfo: IPlayerShareInfo;
    setPlayerHealth: (newHealth: number) => void;
    resetPlayerInfo: () => void;
    resetPlayerShareInfo: () => void;
    updatePlayerInfo: (updates: Partial<IPlayerInfo>) => void;
    setPlayerToDeath: () => void;
    respawnPlayer: () => void;
    setPlayerShareInfo: (newShareInfo: Partial<IPlayerShareInfo>) => void;
}

interface IPlayerShareInfo {
    name: string;
    content: string;
    region: string;
    points: number;
    playerTime: number;
    deathCount: number;
    shootCount: number;
    shootHitCount: number;
    onHitCount: number;
    retryCount: number;
}

// 初始化 PlayerInfo 的默认值
const initValue: IPlayerInfo = {
    playerHealth: 3,
    needOtherPlayerHelp: false,
};

const initShareValue: IPlayerShareInfo = {
    name: "player",
    content: "",
    region: "",
    points: 0,
    playerTime: 0,
    deathCount: 0,
    shootCount: 0,
    shootHitCount: 0,
    onHitCount: 0,
    retryCount: 0,
};

// 创建 Zustand Store
const usePlayerStore = create<IPlayerStore>()(
    subscribeWithSelector((set, get) => ({
        playerInfo: initValue,
        playerShareInfo: initShareValue,

        // 更新 playerHealth
        setPlayerHealth: (newHealth: number) => {
            set((state) => ({
                playerInfo: { ...state.playerInfo, playerHealth: newHealth },
            }));
        },

        // 重置 PlayerInfo
        resetPlayerInfo: () => {
            set(() => ({ playerInfo: initValue }));
            PubSub.publish("resetPlayerModel");
            PubSub.publish("resetPlayerPosition");
            PubSub.publish("setDisablePlayerMove", false);
        },

        // 重置 PlayerShareInfo
        resetPlayerShareInfo: () => {
            set(() => ({ playerShareInfo: initShareValue }));
        },

        // 更新 PlayerInfo 的部分属性
        updatePlayerInfo: (updates: Partial<IPlayerInfo>) => {
            set((state) => ({
                playerInfo: { ...state.playerInfo, ...updates },
            }));
        },

        // 将玩家设置为死亡状态
        setPlayerToDeath: () => {
            const currentDeathCount = get().playerShareInfo.deathCount;
            set((state) => ({
                playerInfo: {
                    ...state.playerInfo,
                    playerHealth: 0,
                },
                playerShareInfo: {
                    ...state.playerShareInfo,
                    deathCount: currentDeathCount + 1,
                },
            }));
        },

        // 复活玩家
        respawnPlayer: () => {
            PubSub.publish("resetPlayerModel");
            PubSub.publish("resetPlayerPosition");
            PubSub.publish("setDisablePlayerMove", false);
            PubSub.publish("setPlayerVisibleModel", true);
            set((state) => ({
                playerInfo: { ...state.playerInfo, playerHealth: 3 },
            }));
        },

        setPlayerShareInfo: (newShareInfo: Partial<IPlayerShareInfo>) => {
            set((state) => ({
                playerShareInfo: { ...state.playerShareInfo, ...newShareInfo },
            }));
        }
    }))
);

export default usePlayerStore;
