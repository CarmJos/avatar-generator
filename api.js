const express = require("express");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs").promises;

const defaultConfig = {
  server: { port: 8059, basePath: "/" },
  gravatar: {
    mirrorUrl: "https://www.gravatar.cn/avatar/%s",
  },
  avatar: { defaultSize: 380 },
  cache: { maxAge: 86400 },
};

function loadJsonWithFallback(filePath, fallbackValue) {
  try {
    return JSON.parse(require("fs").readFileSync(filePath, "utf-8"));
  } catch (e) {
    return fallbackValue;
  }
}

function loadConfig(baseDir) {
  return loadJsonWithFallback(path.join(baseDir, "config.json"), defaultConfig);
}

function loadAvatarConfig(baseDir) {
  const configPath = path.join(
    baseDir,
    "src",
    "views",
    "AvatarCreator",
    "config",
    "data.json"
  );
  const avatarConfig = loadJsonWithFallback(configPath, null);
  if (!avatarConfig) {
    throw new Error(`Failed to load avatar config: ${configPath}`);
  }
  return avatarConfig;
}

function createSeededRandom(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

function getRandomValueInArr(arr, weightKey, randomFn) {
  const tmpArr = [];
  arr.forEach((el, index) => {
    const weight = el[weightKey] || 1;
    for (let i = 0; i < weight; i++) tmpArr.push(index);
  });
  tmpArr.sort(() => 0.5 - randomFn());
  const len = tmpArr.length;
  const randomIndex = parseInt((randomFn() * 10000).toFixed(0), 10) % len;
  return arr[tmpArr[randomIndex]];
}

async function loadSvgResource(baseDir, dir, filename) {
  const filePath = path.join(
    baseDir,
    "src",
    "views",
    "AvatarCreator",
    "resource",
    dir,
    `${filename}.svg`
  );
  return fs.readFile(filePath, "utf-8");
}

function resolveColorGroups(layer, avaiableColors) {
  if (layer.avaiableColorGroupsKey) {
    return avaiableColors[layer.avaiableColorGroupsKey] || null;
  }
  return null;
}

async function generateAvatarSvg(seed, size, avatarConfig, baseDir) {
  const randomFn = createSeededRandom(
    typeof seed === "string" ? hashString(seed) : seed
  );

  const layerList = JSON.parse(JSON.stringify(avatarConfig.layerList));
  const avaiableColors = avatarConfig.avaiableColors;
  const gender = "0";

  layerList.sort((a, b) => a.zIndex - b.zIndex);

  let randomLayerList = layerList
    .map((l) => {
      const filteredLayers = l.layers.filter(
        (layer) =>
          gender === "0" ||
          layer.genderType === gender ||
          layer.genderType === "0"
      );

      if (filteredLayers.length === 0) {
        return null;
      }

      return {
        id: l.id,
        dir: l.dir,
        layer: getRandomValueInArr(filteredLayers, "weight", randomFn),
      };
    })
    .filter((item) => item !== null)
    .filter(({ layer }) => !layer.empty);

  const removeIdList = randomLayerList.reduce((res, item) => {
    return res.concat(item.layer.removeLayers || []);
  }, []);

  randomLayerList = randomLayerList.filter(
    ({ id }) => removeIdList.indexOf(id) < 0
  );

  randomLayerList.forEach(({ layer }) => {
    const colorGroups = resolveColorGroups(layer, avaiableColors);
    if (!colorGroups || !colorGroups.length) return;
    layer.color = getRandomValueInArr(colorGroups, "weight", randomFn).value;
  });

  randomLayerList.forEach(({ layer }) => {
    if (!layer.colorNotSameAs || !layer.colorNotSameAs.length) return;
    const currentColors = layer.color;
    if (!currentColors) return;

    layer.colorNotSameAs.forEach((targetId) => {
      const target = randomLayerList.find((e) => e.id === targetId);
      let tried = 0;
      const maxTry = 10;
      while (
        target &&
        target.layer.color &&
        target.layer.color[0] === currentColors[0]
      ) {
        tried++;
        if (tried > maxTry) break;
        const colorGroups = resolveColorGroups(target.layer, avaiableColors);
        if (colorGroups && colorGroups.length) {
          target.layer.color = getRandomValueInArr(
            colorGroups,
            "weight",
            randomFn
          ).value;
        } else {
          break;
        }
      }
    });
  });

  randomLayerList.forEach(({ layer }) => {
    if (!layer.colorSameAs) return;
    const target = randomLayerList.find((e) => e.id === layer.colorSameAs);
    if (target) {
      layer.color = target.layer.color;
    }
  });

  const groups = [];
  for (const { layer, dir } of randomLayerList) {
    let svgRaw = await loadSvgResource(baseDir, dir, layer.filename || "");

    const matchColorReg = /{{color\[\d+\]}}/;
    let matchRes = svgRaw.match(matchColorReg);
    while (matchRes) {
      const str = matchRes[0];
      const index = parseInt(str.replace(/^{{color\[(\d+)\]}}$/, "$1"), 10);
      const colors = layer.color;
      if (colors && colors[index]) {
        svgRaw = svgRaw.replace(matchColorReg, colors[index]);
      } else {
        svgRaw = svgRaw.replace(matchColorReg, "#000000");
      }
      matchRes = svgRaw.match(matchColorReg);
    }

    const innerContent = svgRaw.replace(/<svg[^>]*>/, "").replace("</svg>", "");
    groups.push(`<g id="gaoxia-avatar-${dir}">${innerContent}</g>`);
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 380 380" fill="none" xmlns="http://www.w3.org/2000/svg">${groups.join("")}</svg>`;
}

function parseBooleanQuery(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
}

async function checkGravatar(seed, config) {
  let md5;
  if (seed.includes("@")) {
    md5 = crypto
      .createHash("md5")
      .update(seed.trim().toLowerCase())
      .digest("hex");
  } else {
    md5 = seed;
  }

  const url = config.gravatar.mirrorUrl.replace("%s", md5) + "?d=404";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        found: true,
        url: config.gravatar.mirrorUrl.replace("%s", md5),
      };
    }
  } catch (e) {
    // Request failed, continue to generate avatar.
  }

  return { found: false, md5 };
}

function createApiRouter(options = {}) {
  const baseDir = options.baseDir || __dirname;
  const config = options.config || loadConfig(baseDir);
  const avatarConfig = options.avatarConfig || loadAvatarConfig(baseDir);

  const router = express.Router();

  router.get("/", async (req, res) => {
    const { seed, size, gravatar } = req.query;

    if (!seed) {
      return res.status(400).json({
        error: "Missing seed parameter",
        usage: "GET /api?seed=<email|md5>&size=<optional>&gravatar=<true|false>",
      });
    }

    const shouldUseGravatar = parseBooleanQuery(gravatar, false);
    const avatarSize = parseInt(size, 10) || config.avatar.defaultSize;
    const cacheMaxAge = config.cache.maxAge || 86400;

    try {
      if (shouldUseGravatar) {
        const gravatarResult = await checkGravatar(seed, config);

        if (gravatarResult.found) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(gravatarResult.url, {
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const imageBuffer = await response.arrayBuffer();
              const contentType = response.headers.get("content-type") || "image/png";

              res.setHeader("Content-Type", contentType);
              res.setHeader("Cache-Control", `public, max-age=${cacheMaxAge}`);
              res.setHeader("X-Source", "gravatar");
              return res.send(Buffer.from(imageBuffer));
            }
          } catch (e) {
            // Fetch failed, fall through to generated avatar.
          }
        }
      }

      const svg = await generateAvatarSvg(seed, avatarSize, avatarConfig, baseDir);
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", `public, max-age=${cacheMaxAge}`);
      res.setHeader("X-Source", "generated");
      return res.send(svg);
    } catch (error) {
      console.error("Error generating avatar:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });

  router.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return router;
}

module.exports = {
  createApiRouter,
  loadConfig,
};
