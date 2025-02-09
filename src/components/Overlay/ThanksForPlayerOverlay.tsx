import { useContext, useEffect, useState } from "react"
import { INieRButtonsConfigs, NieRCustomBox } from "./NieRCustomBox"
import { FrameValue } from "@react-spring/web"
import systemInfoStore from "../../store/SystemInfoStore";
import { useTranslations } from "next-intl";
import { useOverlayStore } from "../../store/OverlayStore";

export default function ThanksForPlayerOverlay() {
    const setShowOverlay = useOverlayStore((state) => state.setShowOverlay)
    const setGameStarted = systemInfoStore((state) => state.setGameStarted)
    const [buttonDisabled, setButtonDisabled] = useState(false)
    const t = useTranslations()

    const buttonsConfigs: INieRButtonsConfigs[] = [
        {
            text: t('finish'),
            onClick: () => {
                setButtonDisabled(true)
                setShowOverlay('thanksForPlayOverlay', false)
                setShowOverlay('mainTitleOverlay', true)
                setGameStarted(false)
            },
            isNeedAnimationFinish: false,
        },
    ]

    return (
        <NieRCustomBox buttonsConfigs={buttonsConfigs} buttonDisabled={buttonDisabled}>
            <div className="text-2xl text-[#DAD4BB] bg-[#4E4B42] w-full text-start px-4 py-2">
                {t('notice')}
            </div>
            <div className='p-4 flex flex-col gap-4 min-h-40 max-h-80 overflow-y-scroll custom-scrollbar'>
                <div className="flex text-[#4E4B42] text-xl items-center">
                    <p>{t('thanksForPlaying')}!</p>
                </div>
            </div>
        </NieRCustomBox>
    )
}
