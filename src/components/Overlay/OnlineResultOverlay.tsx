import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { YoRHaButton } from '../YoRHaButton'
import { useSpring, animated } from '@react-spring/web';
import { GamepadManager } from '../../modules/GamepadManager';
import { PixelArtUser } from '../PixelArtUser';
import { INieRButtonsConfigs, NieRCustomBox } from './NieRCustomBox';
import usePlayerStore from '../../store/PlayerStore';
import systemInfoStore from '../../store/SystemInfoStore';
import { useTranslations } from 'next-intl';
import { useOverlayStore } from '../../store/OverlayStore';
import { useNetworkStore } from '../../store/NetworkStore';
import { useCutsceneStore } from '../../store/CutsceneStore';

export interface IPlayerResult {
  id: string;
  name: string;
  score: number;
}

const AnimatedDiv = animated('div');
const AnimatedP = animated('p');

export default function OnlineResultOverlay() {
  const setShowOverlay = useOverlayStore(state => state.setShowOverlay);
  const onlineData = useNetworkStore(state => state.onlineData);
  const isFinaleConfirmed = systemInfoStore(state => state.isFinaleConfirmed);
  const startDestroyOnlineResultAnimation = systemInfoStore(state => state.startDestroyOnlineResultAnimation);
  const startCutscene = useCutsceneStore(state => state.startCutscene);
  const [resultData, setResultData] = useState<IPlayerResult[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const targetItemRef = useRef<HTMLDivElement | null>(null);
  const playerShareInfo = usePlayerStore(state => state.playerShareInfo)
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(false)
  const [startCloseAnimation, setStartCloseAnimation] = useState<boolean>(false)
  const t = useTranslations()

  const buttonsConfigs: INieRButtonsConfigs[] = [
    {
      text: t('finish'),
      onClick: () => {
        if (startDestroyOnlineResultAnimation) return
        setButtonDisabled(true)
        setStartCloseAnimation(true)
        setTimeout(() => {
          setShowOverlay('onlineResultOverlay', false)
          setShowOverlay('requestPlayerInfoOverlay', true)
        }, 1500)
      },
      isNeedAnimationFinish: false
    }
  ]

  const getOnlineResult = async () => {
    await new Promise(async (resolve) => {
      const res = await fetch('/api/getOnlineResult')
      const resData = await res.json()
      const data = resData.data?.map((e: any, index: number) => {
        return {
          id: index.toString(),
          name: e.name,
          score: e.score
        }
      })
      const playerData = {
        id: 'player_id',
        name: playerShareInfo.name,
        score: playerShareInfo.points
      }
      const sortedData = [...data, playerData].sort((a, b) => b.score - a.score)
      setResultData(sortedData)
      resolve(null);
    })
  }

  const setByStateData = () => {
    const stateData = onlineData
    if (!stateData) return
    const data: any[] = stateData.map((e: any, index: number) => {
      return {
        id: index.toString(),
        name: e.name,
        score: e.score
      }
    })
    const playerData = {
      id: 'player_id',
      name: playerShareInfo.name,
      score: playerShareInfo.points
    }
    const sortedData = [...data, playerData].sort((a, b) => b.score - a.score)
    setResultData(sortedData)
  }

  useEffect(() => {
    if (!isFinaleConfirmed) {
      getOnlineResult();
    } else {
      setByStateData()
    }
  }, [])

  useEffect(() => {
    if (targetItemRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: targetItemRef.current.offsetTop - 500,
        behavior: "smooth", // 平滑滚动
      });
    }
  }, [resultData])

  useEffect(() => {
    if (startDestroyOnlineResultAnimation) {
      setButtonDisabled(true)
    }
  }, [startDestroyOnlineResultAnimation])

  return (
    <NieRCustomBox buttonsConfigs={buttonsConfigs} buttonDisabled={buttonDisabled} startCloseAnimation={startCloseAnimation}>
      <div className="text-2xl text-[#DAD4BB] bg-[#4E4B42] w-full text-start px-4 py-2">
        {t('score')}
      </div>
      <div className='py-1 px-2 flex flex-col gap-1 max-h-80 overflow-y-scroll custom-scrollbar' ref={scrollContainerRef}>
        {resultData.map((item, index) => (
          <PlayerResultItem
            key={item.id}
            {...item}
            index={index}
            ref={item.id === "player_id" ? targetItemRef : null}
            onDestroy={() => {
              setResultData((prev) => prev.filter((prevItem) => prevItem.id !== item.id));
              setTimeout(() => {
                setShowOverlay('onlineResultOverlay', false)
                startCutscene('startDestroyPlayerSummaryOverlay')
              }, 1500)
            }}
          />
        ))}
      </div>
    </NieRCustomBox>
  )
}

interface PlayerResultItemProps extends IPlayerResult {
  index: number;
  onDestroy: () => void;
}
const PlayerResultItem = React.forwardRef<HTMLDivElement, PlayerResultItemProps>(
  (props, ref) => {
    const isYou = ref != null;
    const [styles, api] = useSpring(() => ({
      from: { itemOpacity: 1, itemBg: "transparent", textColor: "#4E4B42" },
    }));
    const startDestroyOnlineResultAnimation = systemInfoStore(state => state.startDestroyOnlineResultAnimation);
    useEffect(() => {
      if (isYou) {
        api.start({
          from: { itemOpacity: 1, itemBg: "#4E4B42", textColor: "#DAD4BB" },
          to: { itemOpacity: 1, itemBg: "#706c5f", textColor: "#DAD4BB" },
          config: { duration: 2500 },
          loop: { reverse: true },
        });
      }
    }, [])

    useEffect(() => {
      if (startDestroyOnlineResultAnimation) {
        setTimeout(() => {
          handleDestroy();
        }, 1000)
      }
    }, [startDestroyOnlineResultAnimation])

    const handleDestroy = () => {
      if (isYou) {
        api.stop(true);
        api.start({
          from: { itemOpacity: 1, },
          to: { itemOpacity: 0, },
          config: { duration: 2500 },
          onRest: () => {
            props.onDestroy();
          },
        })
      }
    }

    return (
      <AnimatedDiv ref={ref} className="p-2 flex justify-between" style={{ opacity: styles.itemOpacity, backgroundColor: styles.itemBg }}>
        <div className="flex items-center gap-2">
          <div>{props.index}</div>
          <PixelArtUser textColor={isYou ? "#DAD4BB" : "#4E4B42"} />
          <AnimatedP className="text-xl text-[#4E4B42] truncate" style={{
            color: styles.textColor,
          }}>{props.name}</AnimatedP>
          {/* max15 string */}
        </div>
        <AnimatedP style={{
          color: styles.textColor,
        }}>{props.score}</AnimatedP>
      </AnimatedDiv>
    );
  }
);