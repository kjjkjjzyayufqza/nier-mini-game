import { Html, Text } from '@react-three/drei';
import React from 'react';
export const FontPreloader = React.memo(() => (
    <Text
        font="./nier/fonts/Manrope-Light.ttf"
        color="#E7E2DF"
        fontSize={0}
        sdfGlyphSize={128}
        visible={false}
    >
        {""}
    </Text>
));