import { animated, useSpring } from '@react-spring/web';
import { Html, useGLTF, useProgress, useTexture } from '@react-three/drei'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image';
import { useFrame } from '@react-three/fiber';
import systemInfoStore from '../../store/SystemInfoStore';

const AnimatedDiv = animated('div');
export default function PreLoadAssetsOverlay() {
    const updateSystemInfo = systemInfoStore((state) => state.updateSystemInfo);
    const { active, progress, errors, item, loaded, total } = useProgress()
    const [loadBackgroundStyle, loadBackgroundStyleApi] = useSpring<{
        opacity: number;
        transform: string;
    }>(() => ({
        opacity: 0,
        transform: 'scale(0)',
    }));
    const radius = 120; // 圆的半径
    const speed = 0.035; // 旋转速度
    const [counterPreLoadTime, setCounterPreLoadTime] = useState<number>(3); // 预加载时间,最多3秒

    const angleRef = useRef(0); // 保存当前角度
    const loadRef = useRef<any>(null);

    // 使用 react-spring 更新位置和旋转角度
    const [playerStyle, playerStyledApi] = useSpring<{
        left?: string;
        top?: string;
        transform: string;
        opacity: number;
    }>(() => ({
        transform: `rotate(0deg)`,
        opacity: 0,
    }));

    useEffect(() => {
        const timer = setInterval(() => {
            angleRef.current += speed; // 每帧更新角度
            if (loadRef.current) {
                // 获取加载背景图的位置和尺寸
                const loadRect = loadRef.current.getBoundingClientRect();
                const centerX = loadRect.x + loadRect.width / 3
                const centerY = loadRect.y + loadRect.height / 3

                // 根据当前角度计算飞机的位置和旋转角度
                const x = centerX + radius * Math.cos(angleRef.current);
                const y = centerY + radius * Math.sin(angleRef.current);
                const rotation = (angleRef.current * 180) / Math.PI + 180
                // 使用 react-spring 更新动画
                playerStyledApi.start({
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: `rotate(${rotation}deg)`,
                });
                loadBackgroundStyleApi.start({
                    transform: `scale(${1 + Math.sin(angleRef.current) * 0.1})`,
                })
            }
        }, 1000 / 60);
        const updateCounter = setInterval(() => {
            setCounterPreLoadTime((prev) => {
                if (prev <= 1) {
                    clearInterval(updateCounter); // 在这里清除定时器
                    return 0; // 返回 0，确保状态不再为负数
                }
                return prev - 1; // 继续递减
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            clearInterval(updateCounter);
        };
    }, []);

    useEffect(() => {
        loadBackgroundStyleApi.start({
            opacity: 1,
            config: { duration: 1000 },
        })
        playerStyledApi.start({
            opacity: 1,
            config: { duration: 1000 },
            delay: 1000
        })
    }, [])

    useEffect(() => {
        if (total > 0 && loaded === total && counterPreLoadTime <= 0) {
            loadBackgroundStyleApi.start({
                opacity: 0,
                config: { duration: 1000 },
                onChange: (e) => {
                    if (e.value.opacity <= 0) {
                        updateSystemInfo({ initRes: true });
                    }
                }
            })
            playerStyledApi.start({
                opacity: 0,
                config: { duration: 1000 }
            })
        }
    }, [total, loaded, counterPreLoadTime])

    return (
        <div className='w-screen h-screen flex flex-col items-center justify-center'>
            <div>
                <AnimatedDiv style={{ position: 'absolute', ...playerStyle }}>
                    <Image src="/images/player.png" alt="player" width={64} height={64} />
                </AnimatedDiv>
                <AnimatedDiv style={loadBackgroundStyle} ref={loadRef}>
                    <Image src="/images/load.png" alt="loadBg" width={192} height={192} />
                </AnimatedDiv>
            </div>
        </div>
    )
}
