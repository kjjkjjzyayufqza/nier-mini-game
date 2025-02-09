import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface OverlayStore {
    isShowOverlay: {
      [key: string]: boolean;
    };
    setShowOverlay: (key: string, value: boolean) => void;
  }
  
  const initialOverlayState = {
    mainTitleOverlay: true,
    continueOverlay: false,
    titleScreenOverlay: false,
    requestHelpOverlay: false,
    finalConfirmOverlay: false,
    onlineResultOverlay: false,
    playerSummaryOverlay: false,
    requestPlayerInfoOverlay: false,
    requestPlayerInfoPhase2Overlay: false,
    requestPlayerInfoPhase3Overlay: false,
    requestPlayerInfoPhase4Overlay: false,
    thanksForPlayOverlay: false,
    connectNetworkNoticeOverlay: false,
  };
  
  export const useOverlayStore = create<OverlayStore>()(
    subscribeWithSelector((set) => ({
      isShowOverlay: initialOverlayState,
      setShowOverlay: (key, value) =>
        set((state) => ({
          isShowOverlay: { ...state.isShowOverlay, [key]: value },
        })),
    }))
  );
  