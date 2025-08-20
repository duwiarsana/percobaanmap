// config-overrides.js
module.exports = function override(config, env) {
  // Menambahkan loader untuk file GeoJSON
  config.module.rules.push({
    test: /\.geojson$/,
    use: ['json-loader']
  });

  return config;
};
