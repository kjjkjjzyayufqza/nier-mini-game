import React from 'react'
import { DescriptionBoxList } from './DescriptionBoxList'
import { PixelArtRIghtArrow } from './PixelArtRIghtArrow'

export default function DescriptionBox() {
    return (
        <ul className="text-slate-400 dark:text-slate-500 text-sm space-y-4">
            <DescriptionBoxList icon={<PixelArtRIghtArrow />}
                description={
                    "Experienced in Content Management System and Customer Relationship Management system, focusing on the technology used in the development process.\n" +
                    "Skilled in handling developing components and code review."
                } />
            <DescriptionBoxList icon={<PixelArtRIghtArrow />}
                description={
                    "Like to explore and research new technologies."
                } />
            <DescriptionBoxList icon={<PixelArtRIghtArrow />}
                description={
                    "Hobby is playing video games."
                } />
        </ul>
    )
}
