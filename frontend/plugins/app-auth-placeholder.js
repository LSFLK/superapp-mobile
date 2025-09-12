// Minimal plugin to ensure manifestPlaceholders include appAuthRedirectScheme
// Adds: android.defaultConfig.manifestPlaceholders.appAuthRedirectScheme = config.scheme
const { withAppBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');

function withAppAuthPlaceholder(config) {
  return withAppBuildGradle(config, ({ modResults, ...rest }) => {
    if (typeof modResults.contents === 'string' && !modResults.contents.includes('appAuthRedirectScheme')) {
      modResults.contents = modResults.contents.replace(
        /defaultConfig {([\s\S]*?)}/,
        (match) => {
          if (match.includes('manifestPlaceholders')) {
            return match.replace(/manifestPlaceholders *= *\{/, (m) => `${m}\n            appAuthRedirectScheme: '${config.scheme}',`);
          }
          return match.replace(/defaultConfig {/, `defaultConfig {\n        manifestPlaceholders appAuthRedirectScheme: '${config.scheme}'`);
        }
      );
    }
    return { modResults, ...rest };
  });
}

module.exports = createRunOncePlugin(withAppAuthPlaceholder, 'app-auth-placeholder', '1.0.0');
