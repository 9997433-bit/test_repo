// 渲染适配层 · 枚举常量。数值沿用调用方原本依赖的那套，改动会牵连所有材质开关。

export const NoBlending = 0;
export const NormalBlending = 1;
export const AdditiveBlending = 2;
export const SubtractiveBlending = 3;
export const MultiplyBlending = 4;

export const FrontSide = 0;
export const BackSide = 1;
export const DoubleSide = 2;

export const RepeatWrapping = 1000;
export const ClampToEdgeWrapping = 1001;
export const MirroredRepeatWrapping = 1002;

export const NearestFilter = 1003;
export const NearestMipmapNearestFilter = 1004;
export const NearestMipmapLinearFilter = 1005;
export const LinearFilter = 1006;
export const LinearMipmapNearestFilter = 1007;
export const LinearMipmapLinearFilter = 1008;

export const UnsignedByteType = 1009;
export const FloatType = 1015;
export const HalfFloatType = 1016;

export const AlphaFormat = 1021;
export const RGBFormat = 1022;
export const RGBAFormat = 1023;
export const RedFormat = 1028;

export const NoColorSpace = '';
export const SRGBColorSpace = 'srgb';
export const LinearSRGBColorSpace = 'srgb-linear';

export const BasicShadowMap = 0;
export const PCFShadowMap = 1;
export const PCFSoftShadowMap = 2;
export const VSMShadowMap = 3;

export const NoToneMapping = 0;
export const LinearToneMapping = 1;
export const ReinhardToneMapping = 2;
export const CineonToneMapping = 3;
export const ACESFilmicToneMapping = 4;

export const StaticDrawUsage = 35044;
export const DynamicDrawUsage = 35048;
