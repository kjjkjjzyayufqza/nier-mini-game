import { animated, useSpring } from "@react-spring/web"
import usePlayerStore from "../../store/PlayerStore";
import systemInfoStore from "../../store/SystemInfoStore";
import { useTranslations } from "next-intl";

const AnimatedDiv = animated('div');

export default function FinalConfirmTextOverlay() {
    const setShowOverlay = systemInfoStore(state => state.setShowOverlay)
    const playerShareInfo = usePlayerStore(state => state.playerShareInfo)
    const t = useTranslations()

    const [styles, api] = useSpring(() => ({
        from: { opacity: 0 },
        to: async (next) => {
            await next({ opacity: 1 });
            await new Promise(resolve => setTimeout(resolve, 6000)); //6000
            await next({ opacity: 0 });
        },
        onRest: () => {
            PubSub.publish('setFinalConfirmEnemiesData')
            setShowOverlay('finalConfirmTextOverlay', false)
        },
        config: { duration: 2000, },
    }));

    return (
        <div className="flex flex-col justify-between min-h-screen py-28"> {/* 设置最小高度和内边距 */}
            <div className="flex-grow" /> {/* 占据剩余空间 */}
            <AnimatedDiv className='flex flex-col w-full sm:w-auto md:min-w-40 bg-transparent pointer-events-auto' style={{ opacity: styles.opacity }}>
                <div className='flex items-center justify-center flex-col text-2xl text-[#DAD4BB]'>
                    <div>
                        {`${playerShareInfo.name}... `}{t('finalLongMsg1')}
                    </div>
                    <center>
                        {t('finalLongMsg2')}
                    </center>
                </div>
            </AnimatedDiv>
        </div>
    )
}

