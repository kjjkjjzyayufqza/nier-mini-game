import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { v4 as uuid } from "uuid";

interface ISystemInfo {
  mainOverlayShowed: boolean;
  titleScreenShowed: boolean;
  currentPhase: string;
}

// 初始值
const initSystemInfoValue: ISystemInfo = {
  mainOverlayShowed: false,
  titleScreenShowed: false,
  currentPhase: "",
};

interface SystemInfoContextType {
  systemInfo: ISystemInfo;
  gameStarted: boolean;
  resetSystemInfo: () => void;
  setCurrentPhase: (newPhase: string) => void;
  setTitleScreenShowed: (showed: boolean) => void;
  setGameStarted: (started: boolean) => void;
  updateSystemInfo: (updates: Partial<ISystemInfo>) => void;
  importantPhaseRecord: string;
  setImportantPhaseRecord: (phase: string) => void;
  reSetBackgroundDisplayTexts: () => void;
  clearBackgroundDisplayTexts: () => void;
  isFinaleConfirmed: boolean;
  setFinaleConfirmed: (value: boolean) => void;
  startDestroyOnlineResultAnimation: boolean;
  setStartDestroyOnlineResultAnimation: (value: boolean) => void;
  startDestroyPlayerSummaryAnimation: boolean;
  setStartDestroyPlayerSummaryAnimation: (value: boolean) => void;
  postEffects: boolean;
  setPostEffects: (value: boolean) => void;
}

const systemInfoStore = create<SystemInfoContextType>()(
  subscribeWithSelector((set, get) => ({
    gameStarted: false,
    systemInfo: initSystemInfoValue,
    resetSystemInfo: () => {
      set({ systemInfo: { ...initSystemInfoValue } });
      PubSub.publish("resetPlayerPosition");
      PubSub.publish("resetEnemiesData", {
        type: "empty",
      });
      PubSub.publish("resetPlayerProjectiles");
      PubSub.publish("resetEnemyShootProjectile");
      PubSub.publish("resetEnemyShootUnbrokenProjectileToken");
      PubSub.publish("updateSceneEffectCount", 0);
    },
    setCurrentPhase: (newPhase) =>
      set((state) => ({
        systemInfo: { ...state.systemInfo, currentPhase: newPhase },
      })),
    setTitleScreenShowed: (showed) =>
      set((state) => ({
        systemInfo: { ...state.systemInfo, titleScreenShowed: showed },
      })),
    setGameStarted: (started) =>
      set((state) => ({
        gameStarted: started,
      })),
    updateSystemInfo: (updates) =>
      set((state) => ({
        systemInfo: { ...state.systemInfo, ...updates },
      })),
    importantPhaseRecord: "",
    setImportantPhaseRecord: (phase) => set({ importantPhaseRecord: phase }),
    reSetBackgroundDisplayTexts: () => {
      PubSub.publish("reSetBackgroundDisplayTexts");
    },
    clearBackgroundDisplayTexts: () => {
      PubSub.publish("clearBackgroundDisplayTexts");
    },
    isFinaleConfirmed: false,
    setFinaleConfirmed: (value) =>
      set((state) => ({
        isFinaleConfirmed: value,
      })),
    startDestroyOnlineResultAnimation: false,
    setStartDestroyOnlineResultAnimation: (value) =>
      set((state) => ({
        startDestroyOnlineResultAnimation: value,
      })),
    startDestroyPlayerSummaryAnimation: false,
    setStartDestroyPlayerSummaryAnimation: (value) =>
      set((state) => ({
        startDestroyPlayerSummaryAnimation: value,
      })),
    postEffects: true,
    setPostEffects: (value) =>
      set((state) => ({
        postEffects: value,
      })),
  }))
);

export default systemInfoStore;
