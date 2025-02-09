import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
import { Html, Text } from '@react-three/drei'
import {useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { vec3 } from '@react-three/rapier';
import PubSub from 'pubsub-js';
import { useFixedFrameUpdate } from '../hook/useFixedFrameUpdate';

//https://www.geeksforgeeks.org/how-to-replace-a-character-at-a-particular-index-in-javascript/
function replaceChar(origString: string, replaceChar: string, index: number) {
    let firstPart = origString.substr(0, index);
    let lastPart = origString.substr(index + 1);

    let newString = firstPart + replaceChar + lastPart;
    return newString;
}

const randomString = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'


export default function SceneBackgroundText() {
    const [displayTexts, setDisplayTexts] = useState<string[]>([

    ])

    const getDisplayTexts = async () => {
        await new Promise(async (resolve) => {
            const res = await fetch('/api/getContent')
            const resData = await res.json()
            const formattedData = resData.data.map((e: any) => {
                return `${e.name}  ⌈${e.content}⌋  ${e.region}`
            })
            //随机获取10-20条数据
            const randomData = formattedData.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 10 + 10))
            setDisplayTexts(randomData)
            resolve(null)
        })
    }

    useEffect(() => {
        const reSetBackgroundDisplayTextsToken = PubSub.subscribe('reSetBackgroundDisplayTexts', () => {
            getDisplayTexts()
        })
        const clearDisplayTextsToken = PubSub.subscribe('clearBackgroundDisplayTexts', () => {
            setDisplayTexts([])
        })
        return () => {
            PubSub.unsubscribe(reSetBackgroundDisplayTextsToken)
            PubSub.unsubscribe(clearDisplayTextsToken)
        }
    }, [])

    return (
        <group>
            {displayTexts.map((e, index) => {
                return <group key={index}>
                    <AutoChangeDisplayText displayText={e} />
                </group>
            })}
        </group>
    )
}

interface AutoChangeDisplayTextProps {
    displayText: string
}

const AutoChangeDisplayText: FC<AutoChangeDisplayTextProps> = ({
    displayText,
}) => {
    const groupRef = useRef<any>(null)
    const textRef = useRef<any>(null)
    const textUpdateCoolDownTime = useRef<any>({
        index: 0,
        value: 0,
        coolDownTime: 0.03,
        updateCount: 0,
        spawnDelay: Math.random() * 2,
        spawnStackTime: 1 //固定位置显示时间
    })
    const randomRotation = useMemo(() => {
        const isU = Math.random() > 0.5
        if (isU) {
            return vec3({ x: Math.random() * Math.PI * 2, y: 0, z: Math.random() * Math.PI * 2 })
        } else {
            return vec3({ x: Math.random() * -Math.PI * 2, y: 0, z: Math.random() * -Math.PI * 2 })
        }

    }, [])
    const { size } = useThree()

    const initPosition = useMemo(() => {
        //在屏幕内随机生成位置 x y(0至-1) z
        const x = Math.random() * 2 - size.width / size.height
        const y = -1 + Math.random()
        const z = Math.random() * 2 - size.height / size.width
        return vec3({ x: x, y: y, z: z })
    }, [])

    //根据y轴减少透明度
    useEffect(() => {
        if (groupRef.current) {
            textRef.current.material.opacity = 1 - Math.abs(groupRef.current.position.y)
        }
    }, [])

    useFixedFrameUpdate((state, delta) => {
        if (textRef.current) {
            const textUpCT = textUpdateCoolDownTime.current
            if (textUpCT.spawnDelay > 0) {
                textUpCT.spawnDelay -= delta
                return
            }

            if (textUpCT.index < displayText.length) {
                textUpCT.value += delta
                if (textUpCT.value > textUpCT.coolDownTime) {
                    textUpCT.updateCount += 1
                    textUpCT.value = 0

                    if (textUpCT.updateCount % 2 == 0) {
                        textRef.current.text = replaceChar(textRef.current.text, displayText[textUpCT.index], textUpCT.index)
                        textUpCT.index += 1
                    } else {
                        textRef.current.text = replaceChar(textRef.current.text, randomString[Math.floor(Math.random() * randomString.length)], textUpCT.index)
                    }

                }
            }

            if (textUpCT.spawnStackTime > 0) {
                textUpCT.spawnStackTime -= delta
                return
            } else {
                //往randomRotation方向移动
                groupRef.current.position.lerp(randomRotation, delta * 0.0045);
            }
        }
    })


    return (
        <group rotation={[Math.PI / -2, 0, Math.PI]} position={initPosition} ref={groupRef}>
            <Text
                font={"./nier/fonts/Manrope-Light.ttf"}
                color="#E7E2DF"
                anchorX='center'
                anchorY='middle'
                fontSize={0.05}
                textAlign="center"
                ref={textRef}
                onSync={() => { }}
                sdfGlyphSize={128}
            >
                {""}
            </Text>
        </group>
    )
}
