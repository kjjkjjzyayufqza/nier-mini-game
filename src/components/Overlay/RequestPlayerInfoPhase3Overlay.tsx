import { useContext, useEffect, useRef, useState } from "react"
import { INieRButtonsConfigs, NieRCustomBox } from "./NieRCustomBox"
import Typewriter, { TypewriterClass } from "typewriter-effect";
import usePlayerStore from "../../store/PlayerStore";
import systemInfoStore from "../../store/SystemInfoStore";
import { useTranslations } from "next-intl";

export default function RequestPlayerInfoPhase3Overlay() {
    const setShowOverlay = systemInfoStore(state => state.setShowOverlay)
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
                    setShowOverlay('requestPlayerInfoPhase3Overlay', false)
                    setShowOverlay('requestPlayerInfoPhase4Overlay', true)
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
                    setShowOverlay('requestPlayerInfoPhase3Overlay', false)
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
            <div className='p-4 flex flex-col gap-4 min-h-40 max-h-80 max-w-[30rem] overflow-y-scroll custom-scrollbar'>
                <div className='text-xl text-[#4E4B42] text-clip' >
                    <Typewriter
                        onInit={(typewriter) => {
                            typewriter
                                .typeString(`${playerShareInfo.name}......` + t('pleaseRespondToThisQuery'))
                                .typeString('<br>')
                                .pauseFor(2000)
                                .typeString(t('requestPlayerInfoLongMsg3'))  //you have faced crushing hardship, and suffered greatly for it
                                .typeString('<br>')
                                .pauseFor(1000)
                                .typeString(t('requestPlayerInfoLongMsg4'))
                                .typeString('<br>')
                                .pauseFor(1000)
                                .typeString('<strong>' + t('requestPlayerInfoLongMsg5') + '</strong>')
                                .typeString('<br>')
                                .typeString(t('requestPlayerInfoLongMsg6'))
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
