import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useOverlayStore } from "./OverlayStore";
import systemInfoStore from "./SystemInfoStore";

interface CutsceneStore {
  isCutsceneActive: boolean;
  cutsceneNextActions: string[];
  actionMap: { [key: string]: () => void };
  startCutscene: (nextAction?: string) => void;
  endCutscene: () => void;
  executeAction: (actionKey: string) => void;
}

export const useCutsceneStore = create<CutsceneStore>()(
  subscribeWithSelector((set, get) => {
    // 获取 overlayStore 的方法
    const setShowOverlay = useOverlayStore.getState().setShowOverlay;
    const resetSystemInfo = systemInfoStore.getState().resetSystemInfo;
    const setStartDestroyOnlineResultAnimation =
      systemInfoStore.getState().setStartDestroyOnlineResultAnimation;
    const setStartDestroyPlayerSummaryAnimation =
      systemInfoStore.getState().setStartDestroyPlayerSummaryAnimation;

    return {
      isCutsceneActive: false,
      cutsceneNextActions: [],
      startCutscene: (nextAction) => {
        set((state) => ({
          isCutsceneActive: true,
          cutsceneNextActions: nextAction
            ? [...state.cutsceneNextActions, nextAction]
            : state.cutsceneNextActions,
        }));
      },
      endCutscene: () => {
        set({ isCutsceneActive: false });
      },
      executeAction: (actionKey) => {
        const actionMap = get().actionMap;
        if (actionMap[actionKey]) {
          actionMap[actionKey](); // 执行对应的动作
        } else {
          console.warn(`Action "${actionKey}" not found in actionMap.`);
        }
      },
      actionMap: {
        showTitleScreen: () => setShowOverlay("mainTitleOverlay", true),
        showContinueOverlay: () => setShowOverlay("continueOverlay", true),
        showRequestOtherPlayerHelpOverlay: () =>
          setShowOverlay("requestHelpOverlay", true),
        showContinueOverlayAndClearSceneObjects: () => {
          setShowOverlay("continueOverlay", true);
          resetSystemInfo();
        },
        resetEnemiesDataByPhase: () => {
          PubSub.publish("resetEnemiesData", {
            type: "resetPhase",
            phase: systemInfoStore.getState().importantPhaseRecord,
          });
        },
        showFinalConfirmTextOverlay: () =>
          setShowOverlay("finalConfirmTextOverlay", true),
        startDestroyOnlineResultOverlay: () => {
          setShowOverlay("onlineResultOverlay", true);
          set((state) => ({
            isCutsceneActive: true,
          }));
          setStartDestroyOnlineResultAnimation(true);
        },
        startDestroyPlayerSummaryOverlay: () => {
          setShowOverlay("playerSummaryOverlay", true);
          set((state) => ({
            isCutsceneActive: true,
          }));
          setStartDestroyPlayerSummaryAnimation(true);
        },
        startPlayerSummary: () => {
          setShowOverlay("playerSummaryOverlay", true);
        },
      },
    };
  })
);
