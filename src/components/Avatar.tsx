import React from 'react'
import Image from 'next/image'

export default function Avatar() {
    return (
        <div>
            <Image src='/images/you.jpg' alt='avatar' width={200} height={200} className='rounded-full' />
        </div>
    )
}
