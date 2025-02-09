import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { INieRButtonsConfigs, NieRCustomBox } from './NieRCustomBox'
import usePlayerStore from '../../store/PlayerStore';
import { animated, useSpring, useSprings } from '@react-spring/web';
import systemInfoStore from '../../store/SystemInfoStore';
import { useTranslations } from 'next-intl';
import useAudioStore from '../../store/AudioStore';
import { useOverlayStore } from '../../store/OverlayStore';
import { useNotificationStore } from '../../store/NotificationStore';

const AnimatedDiv = animated('div');
export default function PlayerSummaryOverlay() {
    const startDestroyPlayerSummaryAnimation = systemInfoStore(state => state.startDestroyOnlineResultAnimation)
    const setShowOverlay = useOverlayStore(state => state.setShowOverlay)
    const setPlayerShareInfo = usePlayerStore(state => state.setPlayerShareInfo)
    const addNotification = useNotificationStore(state => state.addNotification)
    const playerShareInfo = usePlayerStore(state => state.playerShareInfo)
    const [startCloseAnimation, setStartCloseAnimation] = useState<boolean>(false)
    const [formValue, setFormValue] = useState<{ name: string }>({
        name: ''
    })
    const [buttonDisabled, setButtonDisabled] = useState<boolean>(false)
    const { stop: stopAudio } = useAudioStore();
    const t = useTranslations()

    const formatTime = (time: number) => {
        //time = 90 => 01:30
        let minutes = Math.floor(time / 60)
        let seconds = time % 60
        seconds = Math.floor(seconds)
        return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`
    }
    const contextConfigs = useMemo(() => {
        return [{
            title: t("score"),
            value: (playerShareInfo.points ?? 0) - (playerShareInfo.onHitCount ?? 0) - (playerShareInfo.retryCount ?? 0),
        }, {
            title: t("time"),
            value: formatTime(playerShareInfo.playerTime),
        }, {
            title: t("shootCount"),
            value: playerShareInfo.shootCount,
        }, {
            title: t("shootHitCount"),
            value: playerShareInfo.shootHitCount,
        }, {
            title: t("onHitCount"),
            value: playerShareInfo.onHitCount,
        }, {
            title: t("reTryCount"),
            value: playerShareInfo.retryCount,
        }]
    }, [playerShareInfo])

    useEffect(() => {
        if (startDestroyPlayerSummaryAnimation) {
            handleDestroyUI()
        }
    }, [startDestroyPlayerSummaryAnimation])

    useEffect(() => {
        stopAudio('Weight of the World')
    }, [])

    const [springs, api] = useSprings(
        contextConfigs.length,
        () => ({
            from: { opacity: 1 },
        }),
        []
    )

    const [nameDiv, nameDivApi] = useSpring(() => ({
        from: { opacity: 1 },
    }));

    const handleSavePlayerSummary = async () => {
        setButtonDisabled(true)
        try {
            const req = await fetch('/api/saveResult', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formValue.name,
                    score: playerShareInfo.points,
                }),
            });
            setPlayerShareInfo(formValue)
            setStartCloseAnimation(true)
            setTimeout(() => {
                setShowOverlay('playerSummaryOverlay', false)
                setShowOverlay('onlineResultOverlay', true)
            }, 1500)
        } catch (e) {
            setButtonDisabled(false)
            console.log(e)
        }
    }

    const buttonsConfigs: INieRButtonsConfigs[] = [
        {
            text: t('finish'),
            onClick: async () => {
                if (formValue.name == '') return
                handleSavePlayerSummary()
            },
            isNeedAnimationFinish: false,
        },
    ]

    const handleDestroyUI = () => {
        setButtonDisabled(true)
        let lastIndex = contextConfigs.length - 1
        function loopDestroy(index: number) {
            springs[index].opacity.start({
                to: { opacity: 0 },
                config: { duration: 1000 },
                onRest: () => {
                    if (index == 0) {
                        setStartCloseAnimation(true)
                        try { fetch('/api/clear') } catch (e) { console.log(e) }
                        setTimeout(() => {
                            setShowOverlay('playerSummaryOverlay', false)
                            setShowOverlay('thanksForPlayOverlay', true)
                            addNotification(t("unlockDebugMenu"))
                        }, 1500)
                        return
                    }
                    loopDestroy(index - 1)
                }
            })
        }
        nameDivApi.start({
            to: { opacity: 0 },
            config: { duration: 1000 },
            onRest: () => {
                loopDestroy(lastIndex)
            }
        })
    }

    return (
        <NieRCustomBox buttonsConfigs={buttonsConfigs} startCloseAnimation={startCloseAnimation} buttonDisabled={buttonDisabled}>
            <div className="text-2xl text-[#DAD4BB] bg-[#4E4B42] w-full text-start px-4 py-2">
                {t('notice')}
            </div>
            <div className='p-4 flex flex-col gap-4 min-h-40 max-h-full overflow-y-scroll custom-scrollbar'>
                <div className='text-xl text-[#4E4B42] text-clip'>
                    {t('congratulations')}!
                </div>
                <div className='text-xl text-[#4E4B42] text-clip'>
                    {t('youCompleteThisGame')}!
                </div>
                <div className='text-xl text-[#4E4B42] text-clip '>
                    {springs.map((config, index) => {
                        return (
                            <AnimatedDiv key={index} className='flex justify-between' style={{ opacity: config.opacity }}>
                                <div>
                                    {contextConfigs[index].title}:
                                </div>
                                <div>
                                    {contextConfigs[index].value}
                                </div>
                            </AnimatedDiv>
                        )
                    })}
                </div>
                <form>
                    <AnimatedDiv className="mb-4" style={{ opacity: nameDiv.opacity }}>
                        <label className="block text-[#4E4B42] text-sm font-bold mb-2">
                            {t('enterYourNameToSave')}:
                        </label>
                        <div className="flex text-[#4E4B42] items-center">
                            <input className="border w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none"
                                value={formValue.name}
                                onChange={(e) => {
                                    setFormValue({
                                        ...formValue,
                                        name: e.target.value
                                    })
                                }}
                                maxLength={15}
                                disabled={startCloseAnimation}
                            />
                            <p>({formValue.name.length}/15)</p>
                        </div>
                        <p className="text-[#CD664D] text-sm h-3">{formValue.name == '' && t("pleaseFillInfo")}</p>
                    </AnimatedDiv>
                </form>
            </div>
        </NieRCustomBox>
    )
}
