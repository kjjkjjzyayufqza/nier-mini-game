import React, { useContext, useEffect, useRef, useState } from 'react'
import { YoRHaButton } from '../YoRHaButton'
import { useSpring, animated } from '@react-spring/web';
import systemInfoStore from '../../store/SystemInfoStore';
import { useTranslations } from 'next-intl';
import useAudioStore from '../../store/AudioStore';
import { GamepadManager } from '../../modules/GamepadManager';
import Link from 'next/link';
import { useDetectGPU } from '@react-three/drei';
import { TbDivide } from 'react-icons/tb';
import { useOverlayStore } from '../../store/OverlayStore';
import { useNotificationStore } from '../../store/NotificationStore';

const gamepadManager = new GamepadManager();
const AnimatedDiv = animated('div');
export default function MainTitleOverlay() {
    const updateSystemInfo = systemInfoStore((state) => state.updateSystemInfo);
    const setShowOverlay = useOverlayStore((state) => state.setShowOverlay);
    const isButtonClickedRef = useRef<boolean>(false);
    const { play: playAudio, } = useAudioStore();
    const [isGamePadMoved, setIsGamePadMoved] = useState<boolean>(false);
    const postEffects = systemInfoStore((state) => state.postEffects);
    const setPostEffects = systemInfoStore((state) => state.setPostEffects);
    const addNotification = useNotificationStore((state) => state.addNotification);
    const t = useTranslations()
    const [styles, api] = useSpring(() => ({
        from: { mainTitle: 0, },
        to: async (next) => {
            await next({ mainTitle: 1 });
        },
        onRest: () => { },
        config: { duration: 1000 },
    }));
    const GPUTier = useDetectGPU()


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

    const handleGPUSetting = () => {
        const initSetting = localStorage.getItem('initSetting')
        if (!initSetting || initSetting === 'false') {
            localStorage.setItem('initSetting', 'true')
            if (GPUTier.tier <= 2) {
                addNotification('Try disabling post-processing effects to improve performance')
                console.log('Try disabling post-processing effects to improve performance')
                setPostEffects(false)
                localStorage.setItem('gpu_setting_post_effects', 'false')
                return
            }
            setPostEffects(true)
            localStorage.setItem('gpu_setting_post_effects', 'true')
            return
        }
        // use user setting
        localStorage.setItem('initSetting', 'true')
        const gpuSettingPostEffects = localStorage.getItem('gpu_setting_post_effects')
        if (gpuSettingPostEffects == 'true') {
            setPostEffects(true)
        } else if (gpuSettingPostEffects == 'false') {
            setPostEffects(false)
        }
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
    }, [])

    useEffect(() => {
        handleGPUSetting()
    }, [GPUTier])

    return (
        <AnimatedDiv className='absolute md:flex p-4 md:p-0 justify-between items-center w-full h-full container mx-auto overflow-auto pointer-events-auto' style={{ opacity: styles.mainTitle }}>
            <div className='flex flex-col gap-20'>
                <div className='flex flex-col gap-20'>
                    <div className='flex flex-col'>
                        <div className='text-5xl text-[#E5E5E3] max-w-2xl'>
                            {t('mainTitle')}
                        </div>
                        <div className='text-xl text-[#E5E5E3] pointer-events-auto'>
                            <a href="https://github.com/kjjkjjzyayufqza/nier-mini-game" className='text-[#E5E5E3 underline'>Source</a>
                        </div>
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
                <div className='text-xl text-[#E5E5E3] max-w-2xl pointer-events-auto flex flex-col gap-2'>
                    <div>
                        <p>Setting</p>
                        <div className="flex items-center">
                            <label className='flex items-center gap-2'>
                                <input
                                    id="post-effects"
                                    type="checkbox"
                                    checked={postEffects}
                                    onChange={() => {
                                        setPostEffects(!postEffects);
                                        localStorage.setItem('gpu_setting_post_effects', String(!postEffects));
                                    }}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                Post Effects
                            </label>
                        </div>
                    </div>
                    <div>
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
            </div>
            <div className='py-5 md:py-0'>
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


