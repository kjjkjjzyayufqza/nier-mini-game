import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface NetworkStore {
  onlineData: any[];
  isConnectedToNetwork: boolean;
  notEnablePlayerNameList: string[];
  fetchOnlineData: () => Promise<void>;
}

export const useNetworkStore = create<NetworkStore>()(
  subscribeWithSelector((set) => ({
    onlineData: [],
    isConnectedToNetwork: false,
    notEnablePlayerNameList: [],
    fetchOnlineData: async () => {
      try {
        const data = await fetch("/api/getOnlineResult").then((res) =>
          res.json()
        );
        const notEnablePlayerNameList = await fetch(
          "/api/getNotEnablePlayerNameList"
        )
          .then((res) => res.json())
          .then((json) =>
            json.data
              .map((item: { name: string }) => item.name)
              .sort(() => Math.random() - 0.5)
          );
        set({
          onlineData: data,
          isConnectedToNetwork: true,
          notEnablePlayerNameList,
        });
      } catch (e) {
        console.error(e);
      }
    },
  }))
);
