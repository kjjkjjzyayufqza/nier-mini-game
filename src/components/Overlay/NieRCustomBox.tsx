import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { YoRHaButton } from '../YoRHaButton'
import { useSpring, animated } from '@react-spring/web';
import { GamepadManager } from '../../modules/GamepadManager';
import useAudioStore from '../../store/AudioStore';

export interface IPlayerResult {
    id: string;
    name: string;
    score: number;
}

const gamepadManager = new GamepadManager();
const AnimatedDiv = animated('div');
const AnimatedP = animated('p');

interface NieRCustomBoxProps {
    children?: React.ReactNode
    buttonsConfigs?: INieRButtonsConfigs[]
    startCloseAnimation?: boolean,
    buttonDisabled?: boolean
    disableGamePad?: boolean
}

export interface INieRButtonsConfigs {
    text: string,
    onClick: () => void,
    isNeedAnimationFinish?: boolean
}

export const NieRCustomBox: FC<NieRCustomBoxProps> = ({ children, buttonsConfigs = [], startCloseAnimation, buttonDisabled = false, disableGamePad = false }) => {
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(buttonDisabled);
    const [styles, api] = useSpring(() => ({
        from: { opacity: 0 },
        to: async (next) => {
            await next({ opacity: 0.8 });
        },
        onRest: () => { },
        config: { duration: 1500 },
    }));
    const { play: playAudio, setVolume, stop: stopAudio } = useAudioStore();
    const isGamePadClicked = useRef(false);

    // 防止重复触发的冷却时间
    const inputCooldown = useRef(false);
    const cooldownTime = 200; // 冷却时间，单位：毫秒

    // 记录 D-Pad 的上一次状态
    const dpadState = useRef({
        up: false,
        down: false,
    });

    const buttonCount = buttonsConfigs.length + 1
    useEffect(() => {
        const handleGamepadUpdate = (gamepadState: any) => {
            if (isGamePadClicked.current) return;
            if (!gamepadManager.isConnected()) return;

            const verticalAxis = gamepadState.axes["Left Stick Vertical"];

            // 冷却机制，防止输入过快
            if (!inputCooldown.current) {
                // 检测左摇杆上下移动
                if (verticalAxis < -0.5) {
                    // 向上选择
                    setSelectedIndex((prevIndex) => (prevIndex - 1 + buttonCount) % buttonCount);
                    inputCooldown.current = true;
                    setTimeout(() => (inputCooldown.current = false), cooldownTime);
                } else if (verticalAxis > 0.5) {
                    // 向下选择
                    setSelectedIndex((prevIndex) => (prevIndex + 1) % buttonCount);
                    inputCooldown.current = true;
                    setTimeout(() => (inputCooldown.current = false), cooldownTime);
                }
            }

            // 检测 D-Pad 上下键
            const dpadUp = gamepadState.buttons["D-Pad Up"];
            const dpadDown = gamepadState.buttons["D-Pad Down"];

            if (dpadUp && !dpadState.current.up) {
                // 向上选择
                setSelectedIndex((prevIndex) => (prevIndex - 1 + buttonCount) % buttonCount);
                dpadState.current.up = true;
                inputCooldown.current = true;
                setTimeout(() => (inputCooldown.current = false), cooldownTime);
            } else if (!dpadUp) {
                dpadState.current.up = false; // 重置状态
            }

            if (dpadDown && !dpadState.current.down) {
                // 向下选择
                setSelectedIndex((prevIndex) => (prevIndex + 1) % buttonCount);
                dpadState.current.down = true;
                inputCooldown.current = true;
                setTimeout(() => (inputCooldown.current = false), cooldownTime);
            } else if (!dpadDown) {
                dpadState.current.down = false; // 重置状态
            }

            // 检测 A 键按下
            if (gamepadState.buttons["A"] || gamepadState.buttons["Circle"]) {
                handleButtonsOnClick(buttonsConfigs[selectedIndex - 1])
                isGamePadClicked.current = true;
            }
        };

        if (disableGamePad) return
        // 订阅 GamepadManager 的更新事件
        gamepadManager.on("update", handleGamepadUpdate);

        return () => {
            // 清理订阅
            gamepadManager.off("update", handleGamepadUpdate);
        };
    }, [selectedIndex]);

    useEffect(() => {
        if (startCloseAnimation) {
            api.start({ opacity: 0, onRest: () => { }, config: { duration: 1500 } })
        }
    }, [startCloseAnimation])

    useEffect(() => {
        setIsButtonDisabled(buttonDisabled)
    }, [buttonDisabled])

    const handleButtonsOnClick = (button: INieRButtonsConfigs) => {
        if (!button.onClick) return
        playAudio('buttonClick')
        if (button.isNeedAnimationFinish == false) {
            button?.onClick()
        } else {
            api.start({ opacity: 0, onRest: () => { button?.onClick() }, config: { duration: 1500 } })
        }
    }

    return (
        <AnimatedDiv className='flex flex-col w-full sm:w-auto md:min-w-40  bg-[#DAD4BB] pointer-events-auto' style={{ opacity: styles.opacity }}>
            {children}
            <div className='flex items-center justify-center flex-col'>
                {buttonsConfigs.map((button, index) => (
                    <YoRHaButton
                        key={index + 1}
                        isSelected={(index + 1) === selectedIndex}
                        onClick={() => {
                            handleButtonsOnClick(button)
                        }}
                        text={button.text}
                        disabled={isButtonDisabled}
                    />
                ))}
            </div>
        </AnimatedDiv>
    )
}
