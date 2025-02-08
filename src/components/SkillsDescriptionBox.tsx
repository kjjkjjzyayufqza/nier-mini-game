import React from 'react'
import Image from 'next/image'
import { DescriptionBoxList } from './DescriptionBoxList'
import { PixelArtRIghtArrow } from './PixelArtRIghtArrow'

export default function SkillsDescriptionBox() {
    return (
        <ul className="space-y-4">
            <DescriptionBoxList icon={<PixelArtRIghtArrow />}
                description={
                    <Image alt="test" width={100} height={100} src="https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white" />
                }
            />
            <DescriptionBoxList icon={<PixelArtRIghtArrow />}
                description={
                    <Image alt="test" width={100} height={100} src="https://img.shields.io/badge/Nest.js-%23E0234E.svg?logo=nestjs&logoColor=white" />
                }
            />
            <DescriptionBoxList icon={<PixelArtRIghtArrow />}
                description={
                    <Image alt="test" width={100} height={100} src="https://img.shields.io/badge/React-black?logo=react&logoColor=white" />
                }
            />
            <DescriptionBoxList icon={<PixelArtRIghtArrow />}
                description={
                    <Image alt="test" width={100} height={100} src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff" />
                }
            />
            <DescriptionBoxList icon={<PixelArtRIghtArrow />}
                description={
                    <Image alt="test" width={100} height={100} src="https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=fff" />
                }
            />
            <DescriptionBoxList icon={<PixelArtRIghtArrow />}
                description={
                    <Image alt="test" width={100} height={100} src="https://img.shields.io/badge/MongoDB-%234ea94b.svg?logo=mongodb&logoColor=white" />
                }
            />
        </ul>
    )
}
