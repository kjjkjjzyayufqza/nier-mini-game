import { animated, useSpring } from '@react-spring/web';
import React, { useContext, useEffect } from 'react'
import systemInfoStore from '../../store/SystemInfoStore';
import { useTranslations } from 'next-intl';

const AnimatedDiv = animated('div');
export default function ConnectNetworkNoticeOverlay() {
    const connectNetworkNoticeOverlay = systemInfoStore((state) => state.isShowOverlay?.connectNetworkNoticeOverlay);
    const fetchOnlineData = systemInfoStore((state) => state.fetchOnlineData);
    const [styles, api] = useSpring(() => ({
        from: { opacity: 0 },
    }));
    const t = useTranslations()

    useEffect(() => {
        if (connectNetworkNoticeOverlay) {
            fetchOnlineData();
            api.start({
                from: { opacity: 0 },
                to: async (next) => {
                    await next({ opacity: 1 });
                },
                onRest: () => {
                    setTimeout(() => {
                        api.start({ from: { opacity: 1 }, to: async (next) => { await next({ opacity: 0 }) }, config: { duration: 1000 } })
                    }, 10000)
                },
                config: { duration: 1000 },
            });
        }
    }, [connectNetworkNoticeOverlay])

    return (
        <AnimatedDiv className="fixed top-0 left-1/2 transform -translate-x-1/2 bg-[#525143] px-2 py-1 z-10 mt-10 text-[#F6F6E3] font-[600]"
            style={styles}
        >
            {t('connectingToNetwork')}
        </AnimatedDiv>
    )
}
