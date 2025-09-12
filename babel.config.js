// babel.config.js
module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            // ✅ ตามเอกสาร NativeWind v4: ใส่เป็น "preset" และตั้ง jsxImportSource
            ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
            'nativewind/babel',
        ],
        // ✅ expo-router เป็น plugin (reanimated v4 ไม่ต้องการ plugin แล้ว)
        plugins: ['expo-router/babel'],
    };
};
