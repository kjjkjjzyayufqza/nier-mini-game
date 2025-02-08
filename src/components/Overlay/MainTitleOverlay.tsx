import React, { useContext, useEffect, useRef, useState } from 'react'
import { YoRHaButton } from '../YoRHaButton'
import { useSpring, animated } from '@react-spring/web';
import systemInfoStore from '../../store/SystemInfoStore';
import { useTranslations } from 'next-intl';
import useAudioStore from '../../store/AudioStore';
import { GamepadManager } from '../../modules/GamepadManager';
import Link from 'next/link';

const gamepadManager = new GamepadManager();
const AnimatedDiv = animated('div');
export default function MainTitleOverlay() {
    const updateSystemInfo = systemInfoStore((state) => state.updateSystemInfo);
    const setShowOverlay = systemInfoStore((state) => state.setShowOverlay);
    const startCutscene = systemInfoStore((state) => state.startCutscene);
    const isButtonClickedRef = useRef<boolean>(false);
    const { play: playAudio, setVolume, stop: stopAudio } = useAudioStore();
    const [isGamePadMoved, setIsGamePadMoved] = useState<boolean>(false);
    const t = useTranslations()
    const [styles, api] = useSpring(() => ({
        from: { mainTitle: 0, },
        to: async (next) => {
            await next({ mainTitle: 1 });
        },
        onRest: () => { },
        config: { duration: 1000 },
    }));

    const handleClickStart = () => {
        if (isButtonClickedRef.current) return;
        isButtonClickedRef.current = true;
        playAudio('buttonClick')
        api.start({
            from: { mainTitle: 1 },
            to: async (next) => {
                await next({ mainTitle: 0 });
            },
            config: { duration: 500 },
            onRest: () => {
                updateSystemInfo({
                    mainOverlayShowed: true,
                })
                setShowOverlay('mainTitleOverlay', false)
                setTimeout(() => {
                    setShowOverlay('titleScreenOverlay', true)
                }, 1000)
            },
        });
    }

    useEffect(() => {
        const handleGamepadUpdate = (gamepadState: any) => {
            if (!gamepadManager.isConnected()) return;
            //有任何按下
            setIsGamePadMoved(true);
            if (gamepadState.buttons["A"] || gamepadState.buttons["Circle"]) {
                handleClickStart();
            }
        }

        gamepadManager.on("update", handleGamepadUpdate);

        return () => {
            // 清理订阅
            gamepadManager.off("update", handleGamepadUpdate);
        };
    })
    return (
        <AnimatedDiv className='absolute md:flex justify-between items-center w-full h-full container mx-auto' style={{ opacity: styles.mainTitle }}>
            <div className='flex flex-col gap-20'>
                <div className='flex flex-col gap-20'>
                    <div className='text-5xl text-[#E5E5E3] max-w-2xl'>
                        {t('mainTitle')}
                    </div>
                    <div className='text-xl text-[#E5E5E3] max-w-2xl flex flex-col gap-2'>
                        <div>{t('control1')}</div>
                        <div>{t('control2')},</div>
                        <div className="flex gap-2">
                            <span className="flex items-center justify-center w-12 h-6 bg-gradient-to-b bg-[#4E4B42] text-white font-bold rounded-md shadow-lg border">
                                R1
                            </span>
                            /
                            <span className="flex items-center justify-center w-12 h-6 bg-gradient-to-b bg-[#4E4B42] text-white font-bold rounded-md shadow-lg border">
                                RB
                            </span>
                            {t('shooting')}
                        </div>
                    </div>
                </div>
                <div className='text-xl text-[#E5E5E3] max-w-2xl pointer-events-auto'>
                    <p>Language</p>
                    <div className='flex flex-col gap-1 '>
                        {[{ lang: 'en', text: 'English' }, { lang: 'zh-hk', text: '中文' }, {
                            lang: 'jp',
                            text: '日本語'
                        }].map((item, index) => (
                            <Link href={item.lang} key={index}>
                                <YoRHaButton
                                    onClick={() => {
                                    }}
                                    text={item.text}
                                />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <div>
                <YoRHaButton
                    onClick={() => {
                        handleClickStart()
                    }}
                    isSelected={isGamePadMoved}
                    text={t('start')}
                    alwaysShowIcon />
            </div>
        </AnimatedDiv>
    )
}


