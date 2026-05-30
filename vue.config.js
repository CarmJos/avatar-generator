// vue.config.js
const { loadConfig, createApiRouter } = require("./api");

const config = loadConfig(__dirname);

function normalizeBasePath(basePath) {
  const raw = String(basePath || "/").trim();
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  const normalized = withLeading.replace(/\/{2,}/g, "/");
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

const basePath = normalizeBasePath(config.server.basePath);

module.exports = {
  lintOnSave: false,
  // Build-time asset base path for subdirectory deployments (e.g. /avatars/).
  publicPath: basePath,

  devServer: {
    // disableHostCheck: true,
    host: process.env.DEV_SERVER_HOST || "127.0.0.1",
    port: process.env.DEV_SERVER_PORT || config.server.port || 8059,
    before(app) {
      app.use("/api", createApiRouter({ baseDir: __dirname, config }));
    },
  },

  runtimeCompiler: false,

  pages: {
    index: {
      entry: "src/main.ts",
      title: "Wave-头像生成器",
    },
  },

  pluginOptions: {
    i18n: {
      locale: "zh",
      fallbackLocale: "en",
      localeDir: "locales",
      enableInSFC: true,
    },
  },
};
