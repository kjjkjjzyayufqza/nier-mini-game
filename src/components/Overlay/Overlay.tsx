import React, { useContext, useEffect } from 'react'
import StartTitleOverlay from './StartTitleOverlay';
import ContinueOverlay from './ContinueOverlay';
import CutsceneOverlay from './CutsceneOverlay';
import MainTitleOverlay from './MainTitleOverlay';
import RequestOtherPlayerHelpOverlay from './RequestOtherPlayerHelpOverlay';
import ResultOverlay from './OnlineResultOverlay';
import PlayerSummaryOverlay from './PlayerSummaryOverlay';
import RequestPlayerInfoOverlay from './RequestPlayerInfoOverlay';
import RequestPlayerInfoPhase2Overlay from './RequestPlayerInfoPhase2Overlay';
import RequestPlayerInfoPhase3Overlay from './RequestPlayerInfoPhase3Overlay';
import RequestPlayerInfoPhase4Overlay from './RequestPlayerInfoPhase4Overlay';
import FinalConfirmTextOverlay from './FinalConfirmTextOverlay';
import ThanksForPlayerOverlay from './ThanksForPlayerOverlay';
import ConnectNetworkNoticeOverlay from './ConnectNetworkNoticeOverlay';
import NotificationOverlay from './NotificationOverlay';
import systemInfoStore from '../../store/SystemInfoStore';

export default function Overlay() {
    const isShowMainScreen = systemInfoStore((state) => state.isShowOverlay.mainTitleOverlay);
    const isShowTitleScreen = systemInfoStore((state) => state.isShowOverlay.titleScreenOverlay);
    const isShowContinueOverlay = systemInfoStore((state) => state.isShowOverlay.continueOverlay);
    const isShowRequestOtherPlayerHelpOverlay = systemInfoStore((state) => state.isShowOverlay.requestHelpOverlay);
    const isCutsceneActive = systemInfoStore((state) => state.isCutsceneActive);
    const isShowOnlineResultOverlay = systemInfoStore((state) => state.isShowOverlay.onlineResultOverlay);
    const isShowPlayerSummaryOverlay = systemInfoStore((state) => state.isShowOverlay.playerSummaryOverlay);
    const isShowRequestPlayerInfoOverlay = systemInfoStore((state) => state.isShowOverlay.requestPlayerInfoOverlay);
    const isShowRequestPlayerInfoPhase2Overlay = systemInfoStore((state) => state.isShowOverlay.requestPlayerInfoPhase2Overlay);
    const isShowRequestPlayerInfoPhase3Overlay = systemInfoStore((state) => state.isShowOverlay.requestPlayerInfoPhase3Overlay);
    const isShowRequestPlayerInfoPhase4Overlay = systemInfoStore((state) => state.isShowOverlay.requestPlayerInfoPhase4Overlay);
    const isShowFinalConfirmTextOverlay = systemInfoStore((state) => state.isShowOverlay.finalConfirmTextOverlay);
    const isShowThanksForPlayerOverlay = systemInfoStore((state) => state.isShowOverlay.thanksForPlayOverlay);
    return (
        <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center select-none flex-col pointer-events-none">
            <ConnectNetworkNoticeOverlay />
            <NotificationOverlay />
            {isShowMainScreen && <MainTitleOverlay />}
            {isShowTitleScreen && <StartTitleOverlay />}
            {isShowContinueOverlay && <ContinueOverlay />}
            {isShowRequestOtherPlayerHelpOverlay && <RequestOtherPlayerHelpOverlay />}
            {isCutsceneActive && <CutsceneOverlay />}
            {isShowOnlineResultOverlay && <ResultOverlay />}
            {isShowPlayerSummaryOverlay && <PlayerSummaryOverlay />}
            {isShowRequestPlayerInfoOverlay && <RequestPlayerInfoOverlay />}
            {isShowRequestPlayerInfoPhase2Overlay && <RequestPlayerInfoPhase2Overlay />}
            {isShowRequestPlayerInfoPhase3Overlay && <RequestPlayerInfoPhase3Overlay />}
            {isShowRequestPlayerInfoPhase4Overlay && <RequestPlayerInfoPhase4Overlay />}
            {isShowFinalConfirmTextOverlay && <FinalConfirmTextOverlay />}
            {isShowThanksForPlayerOverlay && <ThanksForPlayerOverlay />}
        </div>
    );
};
