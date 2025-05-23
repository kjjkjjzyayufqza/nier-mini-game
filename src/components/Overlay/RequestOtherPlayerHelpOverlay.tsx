import React, { useContext, useState } from 'react'
import usePlayerStore from '../../store/PlayerStore';
import { INieRButtonsConfigs, NieRCustomBox } from './NieRCustomBox';
import systemInfoStore from '../../store/SystemInfoStore';
import { useTranslations } from 'next-intl';
import { useOverlayStore } from '../../store/OverlayStore';
import { useCutsceneStore } from '../../store/CutsceneStore';
import { useNetworkStore } from '../../store/NetworkStore';

export default function RequestOtherPlayerHelpOverlay() {
  const setShowOverlay = useOverlayStore(state => state.setShowOverlay)
  const startCutscene = useCutsceneStore(state => state.startCutscene)
  const clearBackgroundDisplayTexts = systemInfoStore(state => state.clearBackgroundDisplayTexts)
  const notEnablePlayerNameList = useNetworkStore(state => state.notEnablePlayerNameList)
  const playerInfo = usePlayerStore(state => state.playerInfo)
  const respawnPlayer = usePlayerStore(state => state.respawnPlayer)
  const updatePlayerInfo = usePlayerStore(state => state.updatePlayerInfo)
  const [startCloseAnimation, setStartCloseAnimation] = useState<boolean>(false)
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(false)
  const t = useTranslations()

  const buttonsConfigs: INieRButtonsConfigs[] = [
    {
      text: t('yes'),
      onClick: async () => {
        setButtonDisabled(true)
        setStartCloseAnimation(true)
        setTimeout(() => {
          setShowOverlay('requestHelpOverlay', false)
          startCutscene("resetEnemiesDataByPhase");
          clearBackgroundDisplayTexts();
          PubSub.publish("updateSceneEffectCount", 100);
          setTimeout(() => {
            respawnPlayer()
            updatePlayerInfo({
              needOtherPlayerHelp: true
            })
          }, 1500)
        }, 1500)
      },
      isNeedAnimationFinish: false,
    },
    {
      text: t('no'),
      onClick: async () => {
        setButtonDisabled(true)
        setStartCloseAnimation(true)
        setTimeout(() => {
          setShowOverlay('requestHelpOverlay', false)
          startCutscene("resetEnemiesDataByPhase");
          clearBackgroundDisplayTexts();
          PubSub.publish("updateSceneEffectCount", 30);
          setTimeout(() => {
            respawnPlayer()
          }, 1500)
        }, 1500)
      },
      isNeedAnimationFinish: false,
    }
  ]

  const getNotEnablePlayerName = () => {
    if (notEnablePlayerNameList.length === 0) return 'player'
    return notEnablePlayerNameList[0]
  }

  return (
    <NieRCustomBox buttonsConfigs={buttonsConfigs} startCloseAnimation={startCloseAnimation} buttonDisabled={buttonDisabled}>
      <div className="text-2xl text-[#DAD4BB] bg-[#4E4B42] w-full text-start px-4 py-2">
        {t('notice')}
      </div>
      <div className='p-4 flex flex-col min-h-40 max-h-80 max-w-xs overflow-y-scroll custom-scrollbar'>
        <div className='text-xl text-[#4E4B42] text-clip'>
          <div>
            {t('receiveOfferRescueFrom') + " "}{getNotEnablePlayerName()}{t("'s rescue")}
          </div>
          <div>
            {t('acceptOffer?')}
          </div>
        </div>
      </div>
    </NieRCustomBox>
  )
}
