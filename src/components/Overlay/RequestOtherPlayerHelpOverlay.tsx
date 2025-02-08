import React, { useContext, useState } from 'react'
import usePlayerStore from '../../store/PlayerStore';
import { INieRButtonsConfigs, NieRCustomBox } from './NieRCustomBox';
import systemInfoStore from '../../store/SystemInfoStore';
import { useTranslations } from 'next-intl';

export default function RequestOtherPlayerHelpOverlay() {
  const setShowOverlay = systemInfoStore(state => state.setShowOverlay)
  const startCutscene = systemInfoStore(state => state.startCutscene)
  const clearBackgroundDisplayTexts = systemInfoStore(state => state.clearBackgroundDisplayTexts)
  const notEnablePlayerNameList = systemInfoStore(state => state.notEnablePlayerNameList)
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
        setShowOverlay('requestHelpOverlay', false)
        startCutscene("resetEnemiesDataByPhase");
        setButtonDisabled(true)
        setStartCloseAnimation(true)
        setTimeout(() => {
          respawnPlayer()
          updatePlayerInfo({
            needOtherPlayerHelp: true
          })
          clearBackgroundDisplayTexts();
          PubSub.publish("updateSceneEffectCount", 100);
        }, 1000)
      },
      isNeedAnimationFinish: false,
    },
    {
      text: t('no'),
      onClick: async () => {
        setShowOverlay('requestHelpOverlay', false)
        startCutscene("resetEnemiesDataByPhase");
        setButtonDisabled(true)
        setStartCloseAnimation(true)
        setTimeout(() => {
          respawnPlayer()
          clearBackgroundDisplayTexts();
          PubSub.publish("updateSceneEffectCount", 30);
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
