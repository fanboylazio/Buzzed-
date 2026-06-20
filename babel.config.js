// Configuración de Babel para Expo + expo-router.
// Los alias de imports ("@/..." -> "./src/...") los resuelve Metro a partir
// de los "paths" definidos en tsconfig.json (soporte nativo de Expo SDK 50+).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
