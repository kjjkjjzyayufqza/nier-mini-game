import React, { ReactNode } from 'react'

export const DescriptionBoxList: React.FC<{
    icon: ReactNode,
    description: ReactNode
}> = ({ icon, description }) => {
    return <li className="flex items-center">
        {icon}
        {description}
    </li>
}
