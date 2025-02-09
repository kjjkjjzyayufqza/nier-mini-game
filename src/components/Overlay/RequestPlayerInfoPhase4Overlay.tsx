import { useContext, useEffect, useRef, useState } from "react"
import { INieRButtonsConfigs, NieRCustomBox } from "./NieRCustomBox"
import { FrameValue } from "@react-spring/web"
import Typewriter, { TypewriterClass } from "typewriter-effect";
import PubSub from 'pubsub-js'
import usePlayerStore from "../../store/PlayerStore";
import systemInfoStore from "../../store/SystemInfoStore";
import { useTranslations } from "next-intl";
import { useOverlayStore } from "../../store/OverlayStore";
import { useCutsceneStore } from "../../store/CutsceneStore";

export default function RequestPlayerInfoPhase4Overlay() {
    const setShowOverlay = useOverlayStore(state => state.setShowOverlay)
    const startCutscene = useCutsceneStore(state => state.startCutscene)
    const respawnPlayer = usePlayerStore(state => state.respawnPlayer)
    const playerShareInfo = usePlayerStore(state => state.playerShareInfo)
    const [buttonDisabled, setButtonDisabled] = useState(false)
    const [startCloseAnimation, setStartCloseAnimation] = useState(false)
    const t = useTranslations()

    const buttonsConfigs: INieRButtonsConfigs[] = [
        {
            text: t('yes'),
            onClick: () => {
                setButtonDisabled(true)
                setStartCloseAnimation(true)
                setTimeout(() => {
                    setShowOverlay('requestPlayerInfoPhase4Overlay', false)
                    startCutscene('showFinalConfirmTextOverlay')
                    setTimeout(() => {
                        respawnPlayer()
                    }, 1500)
                }, 1500)
            },
            isNeedAnimationFinish: false,
        },
        {
            text: t('no'),
            onClick: () => {
                setButtonDisabled(true)
                setStartCloseAnimation(true)
                setTimeout(() => {
                    setShowOverlay('requestPlayerInfoPhase4Overlay', false)
                    setShowOverlay('thanksForPlayOverlay', true)
                }, 1500)
            },
            isNeedAnimationFinish: false,
        },
    ]

    return (
        <NieRCustomBox buttonsConfigs={buttonsConfigs} buttonDisabled={buttonDisabled} startCloseAnimation={startCloseAnimation}>
            <div className="text-2xl text-[#DAD4BB] bg-[#4E4B42] w-full text-start px-4 py-2">
                <br />
            </div>
            <div className='p-4 flex flex-col gap-4 min-h-40 max-h-80 overflow-y-scroll custom-scrollbar'>
                <div className='text-xl text-[#4E4B42] text-clip' >
                    <Typewriter
                        onInit={(typewriter) => {
                            typewriter
                                .typeString(`${playerShareInfo.name}......`)
                                .typeString('<br>')
                                .typeString(t('requestConfirmText'))
                                .start();
                        }}
                        options={{
                            delay: 50,
                            cursor: '',
                        }}
                    />
                </div>
            </div>
        </NieRCustomBox>
    )
}
