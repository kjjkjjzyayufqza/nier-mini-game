import { useContext, useState } from "react"
import { INieRButtonsConfigs, NieRCustomBox } from "./NieRCustomBox"
import systemInfoStore from "../../store/SystemInfoStore";
import { useTranslations } from "next-intl";

export default function RequestPlayerInfoPhase2Overlay() {
    const setShowOverlay = systemInfoStore((state) => state.setShowOverlay)
    const [startCloseAnimation, setStartCloseAnimation] = useState(false)
    const [buttonDisabled, setButtonDisabled] = useState(false)
    const [formValue, setFormValue] = useState({
        content: '',
        region: ''
    })
    const t = useTranslations()

    const handleSaveShareInfo = async () => {
        try {
            setButtonDisabled(true)
            const req = await fetch('/api/createShareInfo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: formValue.content,
                    region: formValue.region
                })
            })
            setStartCloseAnimation(true)
            setTimeout(() => {
                setShowOverlay('requestPlayerInfoPhase2Overlay', false)
                setShowOverlay('requestPlayerInfoPhase3Overlay', true)
            }, 1500)
        } catch (e) {
            setButtonDisabled(false)
            console.log(e)
        }
    }

    const handleCheckForm = () => {
        if (formValue.content === '' || formValue.region === '') {
            return
        } else if (formValue.content.length > 30 || formValue.region.length > 15) {
            return
        } else {
            handleSaveShareInfo()
        }
    }

    const buttonsConfigs: INieRButtonsConfigs[] = [
        {
            text: t('end'),
            onClick: () => {
                handleCheckForm()
            },
            isNeedAnimationFinish: false,
        },
    ]

    return (
        <NieRCustomBox buttonsConfigs={buttonsConfigs} startCloseAnimation={startCloseAnimation} buttonDisabled={buttonDisabled} disableGamePad>
            <div className="text-2xl text-[#DAD4BB] bg-[#4E4B42] w-full text-start px-4 py-2">
                <br />
            </div>
            <div className='p-4 flex flex-col gap-4 min-h-40 max-h-80 overflow-y-scroll custom-scrollbar'>
                <form>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            {t('message')}
                        </label>
                        <div className="flex text-[#4E4B42] items-center">
                            <input className="border w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none"
                                value={formValue.content}
                                onChange={(e) => {
                                    setFormValue({
                                        ...formValue,
                                        content: e.target.value
                                    })
                                }}
                                placeholder={t('placeHolderForMessage')}
                                maxLength={30}
                                disabled={startCloseAnimation}
                            />
                            <p>({formValue.content.length}/30)</p>
                        </div>
                        <p className="text-[#CD664D] text-sm h-3">{formValue.content == '' && t('pleaseFillInfo')}</p>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            {t('region')}
                        </label>
                        <div className="flex text-[#4E4B42] items-center">
                            <input className="border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none"
                                value={formValue.region}
                                onChange={(e) => {
                                    setFormValue({
                                        ...formValue,
                                        region: e.target.value
                                    })
                                }}
                                placeholder="USA"
                                maxLength={15}
                                disabled={startCloseAnimation}
                            />
                            <p>({formValue.region.length}/15)</p>
                        </div>
                        <p className="text-[#CD664D] text-sm h-3">{formValue.region == '' && t('pleaseFillInfo')}</p>
                    </div>
                </form>
            </div>
        </NieRCustomBox>
    )
}
