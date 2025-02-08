import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

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

interface IOnlineData {
    name: string,
    context: string,
    region: string,
    score: number,
}

interface SystemInfoContextType {
    systemInfo: ISystemInfo;
    gameStarted: boolean,
    resetSystemInfo: () => void;
    setCurrentPhase: (newPhase: string) => void;
    setTitleScreenShowed: (showed: boolean) => void;
    setGameStarted: (started: boolean) => void;
    updateSystemInfo: (updates: Partial<ISystemInfo>) => void;
    isCutsceneActive: boolean;
    startCutscene: (nextAction?: string) => void;
    endCutscene: () => void;
    executeAction: (actionKey: string) => void;
    actionMap: { [key: string]: () => void };
    cutsceneNextActions: string[];
    isShowOverlay: {
        mainTitleOverlay: boolean,
        continueOverlay: boolean,
        titleScreenOverlay: boolean,
        requestHelpOverlay: boolean,
        finalConfirmOverlay: boolean,
        onlineResultOverlay: boolean,
        playerSummaryOverlay: boolean,
        requestPlayerInfoOverlay: boolean,
        requestPlayerInfoPhase2Overlay: boolean,
        requestPlayerInfoPhase3Overlay: boolean,
        requestPlayerInfoPhase4Overlay: boolean,
        thanksForPlayOverlay: boolean,
        connectNetworkNoticeOverlay: boolean,
        [key: string]: boolean,
    };
    setShowOverlay: (key: string, value: boolean) => void;
    onlineData: IOnlineData[];
    fetchOnlineData: () => Promise<void>;
    notificationList: { id: string; message: string }[];
    addNotification: (message: string) => void;
    removeNotification: (id: string) => void;
    importantPhaseRecord: string;
    setImportantPhaseRecord: (phase: string) => void;
    isConnectedToNetwork: boolean;
    notEnablePlayerNameList: string[];
    reSetBackgroundDisplayTexts: () => void;
    clearBackgroundDisplayTexts: () => void;
    isFinaleConfirmed: boolean;
    setFinaleConfirmed: (value: boolean) => void;
    startDestroyOnlineResultAnimation: boolean;
    setStartDestroyOnlineResultAnimation: (value: boolean) => void;
    startDestroyPlayerSummaryAnimation: boolean;
    setStartDestroyPlayerSummaryAnimation: (value: boolean) => void;
}

const systemInfoStore = create<SystemInfoContextType>()(
    subscribeWithSelector((set, get) => ({
        gameStarted: false,
        systemInfo: initSystemInfoValue,
        resetSystemInfo: () => {
            set({ systemInfo: { ...initSystemInfoValue } });
            PubSub.publish('resetPlayerPosition');
            PubSub.publish('resetEnemiesData', {
                type: 'empty'
            });
            PubSub.publish('resetPlayerProjectiles');
            PubSub.publish('resetEnemyShootProjectile');
            PubSub.publish('resetEnemyShootUnbrokenProjectileToken');
            PubSub.publish('updateSceneEffectCount', 0);
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
        isCutsceneActive: false,
        cutsceneNextActions: [],
        startCutscene: (nextAction) => {
            set((state) => ({
                isCutsceneActive: true,
                cutsceneNextActions: nextAction
                    ? [...state.cutsceneNextActions, nextAction]
                    : state.cutsceneNextActions
            }));
        },
        endCutscene: () => {
            set({ isCutsceneActive: false });
        },
        executeAction: (actionKey) => {
            const actionMap = get().actionMap;
            if (actionMap[actionKey]) {
                actionMap[actionKey]();
            } else {
                console.warn(`Action "${actionKey}" not found in actionMap.`);
            }
        },
        actionMap: {
            showTitleScreen: () => set((state) => ({ isShowOverlay: { ...state.isShowOverlay, mainTitleOverlay: true } })),
            showContinueOverlay: () => set((state) => ({ isShowOverlay: { ...state.isShowOverlay, continueOverlay: true } })),
            showRequestOtherPlayerHelpOverlay: () =>
                set((state) => ({ isShowOverlay: { ...state.isShowOverlay, requestHelpOverlay: true } })),
            showContinueOverlayAndClearSceneObjects: () => {
                set((state) => ({ isShowOverlay: { ...state.isShowOverlay, continueOverlay: true } }));
                get().resetSystemInfo();
            },
            resetEnemiesDataByPhase: () => {
                PubSub.publish("resetEnemiesData", {
                    type: "resetPhase",
                    phase: get().importantPhaseRecord
                });
            },
            showFinalConfirmTextOverlay: () =>
                set((state) => ({ isShowOverlay: { ...state.isShowOverlay, finalConfirmTextOverlay: true } })),
            startDestroyOnlineResultOverlay: () => {
                set((state) => ({
                    isShowOverlay: {
                        ...state.isShowOverlay,
                        onlineResultOverlay: true
                    },
                    startDestroyOnlineResultAnimation: true,
                }));
            },
            startDestroyPlayerSummaryOverlay: () => {
                set((state) => ({
                    isShowOverlay: { ...state.isShowOverlay, playerSummaryOverlay: true },
                    startDestroyPlayerSummaryAnimation: true,
                }));
            },
            startPlayerSummary: () => {
                set((state) => ({
                    isShowOverlay: { ...state.isShowOverlay, playerSummaryOverlay: true },
                }))
            }
        },
        isShowOverlay: {
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
        },
        setShowOverlay: (key, value) =>
            set((state) => ({
                isShowOverlay: { ...state.isShowOverlay, [key]: value },
            })),
        onlineData: [],
        isConnectedToNetwork: false,
        notEnablePlayerNameList: [],
        fetchOnlineData: async () => {
            try {
                const data = await fetch('/api/getOnlineResult').then((res) =>
                    res.json()
                );
                const notEnablePlayerNameList = await fetch(
                    '/api/getNotEnablePlayerNameList'
                )
                    .then((res) => res.json())
                    .then((json) =>
                        json.data.map((item: { name: string }) => item.name).sort(() => Math.random() - 0.5)
                    );
                set({
                    onlineData: data,
                    isConnectedToNetwork: true,
                    notEnablePlayerNameList
                });
            } catch (e) {
                console.error(e);
            }
        },
        notificationList: [],
        addNotification: (message) => {
            const id = uuid();
            const newMessage = {
                id,
                message: message
            }
            set((state) => ({
                notificationList: [newMessage, ...state.notificationList],
            }));
        },
        removeNotification: (id) =>
            set((state) => ({
                notificationList: state.notificationList.filter((n) => n.id !== id),
            })),
        importantPhaseRecord: '',
        setImportantPhaseRecord: (phase) => set({ importantPhaseRecord: phase }),
        reSetBackgroundDisplayTexts: () => {
            PubSub.publish('reSetBackgroundDisplayTexts');
        },
        clearBackgroundDisplayTexts: () => {
            PubSub.publish('clearBackgroundDisplayTexts');
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
    }))
);

export default systemInfoStore;
