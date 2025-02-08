import React from 'react'

export const PixelArtUser = ({ textColor = '#000000' }: { textColor: string }) => {
    return (
        <svg className={`h-6 w-6 flex-none fill-sky-100 text-[${textColor}] dark:text-white stroke-2`} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H9v2H7v6h2V4h6V2zm0 8H9v2h6v-2zm0-6h2v6h-2V4zM4 16h2v-2h12v2H6v4h12v-4h2v6H4v-6z" fill="currentColor" />
        </svg>

    )
}
