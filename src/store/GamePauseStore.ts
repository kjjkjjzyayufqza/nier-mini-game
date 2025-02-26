import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface GamePauseState {
  isPaused: boolean;
  togglePause: () => void;
}

const useGamePauseStore = create<GamePauseState>()(
  subscribeWithSelector((set) => ({
    isPaused: false,
    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  }))
);

export default useGamePauseStore;
