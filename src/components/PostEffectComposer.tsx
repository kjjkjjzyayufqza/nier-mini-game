import { Bloom, DepthOfField, EffectComposer, Noise, SMAA, SSAO, Vignette } from '@react-three/postprocessing'
import { BlendFunction, KernelSize, Resolution } from 'postprocessing'
import React from 'react'

export default function PostEffectComposer() {
    return (
        <EffectComposer
            enableNormalPass
            enabled
        >
            <Bloom
                intensity={0.5} // 对应 UnrealBloomPass 的 strength
                kernelSize={KernelSize.MEDIUM} // 对应 UnrealBloomPass 的 radius，选择一个合适的模糊内核大小
                luminanceThreshold={0.185} // 对应 UnrealBloomPass 的 threshold
                mipmapBlur // 是否启用 mipmap 模糊
            />
            <SMAA />
            <SSAO
                blendFunction={BlendFunction.MULTIPLY} // blend mode
                samples={30} // amount of samples per pixel (shouldn't be a multiple of the ring count)
                rings={4} // amount of rings in the occlusion sampling pattern
                distanceThreshold={1.0} // global distance threshold at which the occlusion effect starts to fade out. min: 0, max: 1
                distanceFalloff={0.0} // distance falloff. min: 0, max: 1
                rangeThreshold={0.5} // local occlusion range threshold at which the occlusion starts to fade out. min: 0, max: 1
                rangeFalloff={0.1} // occlusion range falloff. min: 0, max: 1
                luminanceInfluence={0.9} // how much the luminance of the scene influences the ambient occlusion
                radius={20} // occlusion sampling radius
                bias={0.5} // occlusion bias
            />
        </EffectComposer>
    )
}
