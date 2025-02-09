import React, { useContext, useState } from 'react'
import { INieRButtonsConfigs, NieRCustomBox } from './NieRCustomBox'
import Typewriter from "typewriter-effect";
import usePlayerStore from '../../store/PlayerStore';
import systemInfoStore from '../../store/SystemInfoStore';
import { useTranslations } from 'next-intl';
import { useOverlayStore } from '../../store/OverlayStore';

export default function RequestPlayerInfoOverlay() {
    const setShowOverlay = useOverlayStore(state => state.setShowOverlay)
    const playerShareInfo = usePlayerStore(state => state.playerShareInfo)
    const [buttonDisabled, setButtonDisabled] = useState<boolean>(false)
    const [startCloseAnimation, setStartCloseAnimation] = useState<boolean>(false)
    const t = useTranslations()

    const buttonsConfigs: INieRButtonsConfigs[] = [
        {
            text: t('iHaveSomethingIWantToSay'),
            onClick: () => {
                setButtonDisabled(true)
                setStartCloseAnimation(true)
                setTimeout(() => {
                    setShowOverlay('requestPlayerInfoOverlay', false)
                    setShowOverlay('requestPlayerInfoPhase2Overlay', true)
                }, 1500)
            },
            isNeedAnimationFinish: false,
        },
        {
            text: t('nopeNothingAtAll'),
            onClick: () => {
                setButtonDisabled(true)
                setStartCloseAnimation(true)
                setTimeout(() => {
                    setShowOverlay('requestPlayerInfoOverlay', false)
                    setShowOverlay('thanksForPlayOverlay', true)
                }, 1500)
            },
            isNeedAnimationFinish: false,
        }
    ]

    return (
        <NieRCustomBox buttonsConfigs={buttonsConfigs} buttonDisabled={buttonDisabled} startCloseAnimation={startCloseAnimation}>
            <div className="text-2xl text-[#DAD4BB] bg-[#4E4B42] w-full text-start px-4 py-2">
                {t('notice')}
            </div>
            <div className='p-4 flex flex-col gap-4 min-h-40 max-h-80 overflow-y-scroll custom-scrollbar max-w-sm'>
                <div className='text-xl text-[#4E4B42] text-clip'>
                    <Typewriter
                        onInit={(typewriter) => {
                            typewriter
                                .typeString(t('pleaseRespondToThisQuery'))
                                .typeString('<br>')
                                .pauseFor(1000)
                                .typeString(`${playerShareInfo.name}......`)
                                .typeString('<br>')
                                .pauseFor(1000)
                                .typeString(t('requestPlayerInfoLongMsg1'))
                                .typeString('<br>')
                                .typeString(t('requestPlayerInfoLongMsg2') + "?")
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
