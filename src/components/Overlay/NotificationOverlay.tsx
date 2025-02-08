import { animated, useSpring } from '@react-spring/web';
import React, { useContext, useEffect, useState } from 'react'
import systemInfoStore from '../../store/SystemInfoStore';
import { transform } from 'next/dist/build/swc/generated-native';

const AnimatedDiv = animated('div');
export default function NotificationOverlay() {
    const notificationList = systemInfoStore((state) => state.notificationList);
    const removeNotification = systemInfoStore((state) => state.removeNotification);
    if (notificationList.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-[68%] right-5 flex flex-col-reverse items-end h-10">
            {notificationList.map((message, index) => (
                <NotificationItem key={message.id} index={index} message={message.message} onEnd={() => removeNotification(message.id)} />
            ))}
        </div>
    );
}


const NotificationItem = ({
    index,
    message,
    onEnd
}: {
    index: number,
    message: string,
    onEnd: () => void
}) => {
    const [styles, api] = useSpring(() => ({
        from: {
            opacity: 0,
            transform: 'translateY(0px)'
        },
        to: async (next) => {
            await next({
                opacity: 1,
                config: { duration: 100 }
            });
            await new Promise((resolve) => setTimeout(resolve, 3800));
            await next({
                opacity: 0,
                config: { duration: 300 }
            });
        },
        onRest: () => {
            onEnd();
        },
    }));

    useEffect(() => {
        if (index != 0) {
            api.start({
                from: {
                    transform: 'translateY(30px)'
                },
                to: {
                    transform: 'translateY(0px)'
                },
                config: { duration: 100 }
            });
        }
    }, [index])

    return (
        <AnimatedDiv className="px-2 py-1 z-10 text-[#F6F6E3]"
            style={styles}
        >
            <div className='flex items-center justify-between gap-1 text-xl font-[600]'>
                {message}
                {index == 0 ? <div className='h-[1.35rem] w-[0.5rem] bg-white' /> : <div className='h-5 w-[0.5rem] border-2 border-white' />}
            </div>
        </AnimatedDiv>
    )
}