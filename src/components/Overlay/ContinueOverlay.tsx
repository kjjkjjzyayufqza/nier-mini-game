import React, { useEffect, useMemo, useRef, useState } from 'react'
import usePlayerStore from '../../store/PlayerStore';
import { INieRButtonsConfigs, NieRCustomBox } from './NieRCustomBox';
import systemInfoStore from '../../store/SystemInfoStore';
import { useTranslations } from 'next-intl';
import useAudioStore from '../../store/AudioStore';
import { useCutsceneStore } from '../../store/CutsceneStore';
import { useOverlayStore } from '../../store/OverlayStore';
import { useNetworkStore } from '../../store/NetworkStore';

const textList = [
  'giveUpMsg1',
  'giveUpMsg2',
  'giveUpMsg3',
  'giveUpMsg4',
  'giveUpMsg5',
]
export default function ContinueOverlay() {
  const startCutscene = useCutsceneStore((state) => state.startCutscene);
  const setShowOverlay = useOverlayStore((state) => state.setShowOverlay);
  const clearBackgroundDisplayTexts = systemInfoStore((state) => state.clearBackgroundDisplayTexts);
  const isConnectedToNetwork = useNetworkStore((state) => state.isConnectedToNetwork);
  const reSetBackgroundDisplayTexts = systemInfoStore((state) => state.reSetBackgroundDisplayTexts);
  const playerShareInfo = usePlayerStore(state => state.playerShareInfo)
  const setGameStarted = systemInfoStore(state => state.setGameStarted)
  const setPlayerShareInfo = usePlayerStore(state => state.setPlayerShareInfo)
  const respawnPlayer = usePlayerStore(state => state.respawnPlayer)
  const resetPlayerInfo = usePlayerStore(state => state.resetPlayerInfo)
  const resetPlayerShareInfo = usePlayerStore(state => state.resetPlayerShareInfo)
  const playerRetryCount = usePlayerStore(state => state.playerShareInfo.retryCount)
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(false)
  const [startCloseAnimation, setStartCloseAnimation] = useState<boolean>(false)
  const t = useTranslations()
  const { stop: stopAudio } = useAudioStore();

  const buttonsConfigs: INieRButtonsConfigs[] = [
    {
      text: t('no'),
      onClick: async () => {
        setButtonDisabled(true)
        setStartCloseAnimation(true)
        setPlayerShareInfo({
          retryCount: playerRetryCount + 1
        })
        setTimeout(() => {
          if (playerShareInfo.deathCount >= 2) {
            startCutscene("showRequestOtherPlayerHelpOverlay");
            setShowOverlay('continueOverlay', false);
          } else {
            startCutscene("resetEnemiesDataByPhase");
            setShowOverlay('continueOverlay', false);
            clearBackgroundDisplayTexts();
            setTimeout(() => {
              respawnPlayer()
            }, 1500)
          }
        }, 1500)

      },
      isNeedAnimationFinish: false,
    },
    {
      text: t('yes'),
      onClick: async () => {
        setButtonDisabled(true)
        setStartCloseAnimation(true)
        setTimeout(() => {
          stopAudio('Weight of the World')
          startCutscene("showTitleScreen");
          setShowOverlay('continueOverlay', false);
          clearBackgroundDisplayTexts();
          respawnPlayer()
          resetPlayerInfo();
          resetPlayerShareInfo();
          setGameStarted(false)
        }, 1500)
      },
      isNeedAnimationFinish: false,
    },
  ]

  const getText = useMemo(() => {
    if (playerShareInfo.deathCount <= 1) {
      return t(textList[0])
    } else {
      let index = playerShareInfo.deathCount
      if (index > textList.length - 1) index = Math.floor(Math.random() * textList.length)
      return t(textList[index])
    }
  }, [])

  useEffect(() => {
    if (!isConnectedToNetwork) {
      //connect network
      setShowOverlay('connectNetworkNoticeOverlay', true)
    }
    if (isConnectedToNetwork && playerShareInfo.deathCount >= 2) {
      reSetBackgroundDisplayTexts()
    }
  }, [isConnectedToNetwork])

  return (
    <NieRCustomBox buttonsConfigs={buttonsConfigs} buttonDisabled={buttonDisabled} startCloseAnimation={startCloseAnimation} disableGamePad={false}>
      <div className="text-2xl text-[#DAD4BB] bg-[#4E4B42] w-full text-start px-4 py-2">
        {t('notice')}
      </div>
      <div className='p-4 flex flex-col gap-4 min-h-40 max-h-80 overflow-y-scroll custom-scrollbar'>
        <div className='text-xl text-[#4E4B42] text-clip max-w-sm'>
          {getText}
        </div>
      </div>
    </NieRCustomBox>
  )
}
