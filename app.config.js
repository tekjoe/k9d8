const appJson = require('./app.json');

// Mapbox native SDK download token (secret, from https://account.mapbox.com/access-tokens/)
// Required for `expo prebuild` / iOS pod install. Add to .env as MAPBOX_DOWNLOAD_TOKEN.
const mapboxDownloadToken =
  process.env.MAPBOX_DOWNLOAD_TOKEN || 'YOUR_MAPBOX_SECRET_TOKEN';

module.exports = {
  ...appJson.expo,
  plugins: appJson.expo.plugins.map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === '@rnmapbox/maps') {
      return ['@rnmapbox/maps', { RNMapboxMapsDownloadToken: mapboxDownloadToken }];
    }
    return plugin;
  }),
};
