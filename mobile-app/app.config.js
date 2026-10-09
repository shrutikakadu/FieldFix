const base = require('./app.json');

module.exports = ({ config }) => ({
  ...base.expo,
  ...config,
  android: {
    ...base.expo.android,
    ...config.android,
    ...(process.env.GOOGLE_MAPS_API_KEY ? {
      config: { ...config.android?.config, googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY } },
    } : {}),
  },
  extra: {
    ...base.expo.extra,
    ...config.extra,
    ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID ? { eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID } } : {}),
  },
});
