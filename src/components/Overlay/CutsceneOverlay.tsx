import { animated, useSpring } from '@react-spring/web';
import React, { useContext } from 'react'
import systemInfoStore from '../../store/SystemInfoStore';
import { useCutsceneStore } from '../../store/CutsceneStore';

const AnimatedDiv = animated('div');
export default function CutsceneOverlay() {
    const endCutscene = useCutsceneStore(state => state.endCutscene);
    const cutsceneNextActions = useCutsceneStore(state => state.cutsceneNextActions);
    const executeAction = useCutsceneStore(state => state.executeAction);
    const [styles, api] = useSpring(() => ({
        from: { cutscene: 0 },
        to: async (next) => {
            await next({ cutscene: 1 });
            if (cutsceneNextActions.length > 0) {
                executeAction(cutsceneNextActions[cutsceneNextActions.length - 1]);
            }
            await new Promise((resolve) => setTimeout(resolve, 500))
            await next({ cutscene: 0 });
        },
        onRest: () => {
            endCutscene();
        },
        config: { duration: 1500 },
    }));
    return (
        <AnimatedDiv className='w-full h-full absolute bg-black' style={{ opacity: styles.cutscene }} />
    )
}
