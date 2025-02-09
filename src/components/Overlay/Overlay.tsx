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
import { useOverlayStore } from '../../store/OverlayStore';
import { useCutsceneStore } from '../../store/CutsceneStore';

export default function Overlay() {
    const isShowMainScreen = useOverlayStore((state) => state.isShowOverlay.mainTitleOverlay);
    const isShowTitleScreen = useOverlayStore((state) => state.isShowOverlay.titleScreenOverlay);
    const isShowContinueOverlay = useOverlayStore((state) => state.isShowOverlay.continueOverlay);
    const isShowRequestOtherPlayerHelpOverlay = useOverlayStore((state) => state.isShowOverlay.requestHelpOverlay);
    const isCutsceneActive = useCutsceneStore((state) => state.isCutsceneActive);
    const isShowOnlineResultOverlay = useOverlayStore((state) => state.isShowOverlay.onlineResultOverlay);
    const isShowPlayerSummaryOverlay = useOverlayStore((state) => state.isShowOverlay.playerSummaryOverlay);
    const isShowRequestPlayerInfoOverlay = useOverlayStore((state) => state.isShowOverlay.requestPlayerInfoOverlay);
    const isShowRequestPlayerInfoPhase2Overlay = useOverlayStore((state) => state.isShowOverlay.requestPlayerInfoPhase2Overlay);
    const isShowRequestPlayerInfoPhase3Overlay = useOverlayStore((state) => state.isShowOverlay.requestPlayerInfoPhase3Overlay);
    const isShowRequestPlayerInfoPhase4Overlay = useOverlayStore((state) => state.isShowOverlay.requestPlayerInfoPhase4Overlay);
    const isShowFinalConfirmTextOverlay = useOverlayStore((state) => state.isShowOverlay.finalConfirmTextOverlay);
    const isShowThanksForPlayerOverlay = useOverlayStore((state) => state.isShowOverlay.thanksForPlayOverlay);
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
