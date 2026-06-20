// Configuración por defecto de Metro para Expo.
// Se deja explícita para poder extenderla en el futuro (p. ej. SVG transformer).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
