const express = require("express");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs").promises;

let config;
try {
  config = JSON.parse(
    require("fs").readFileSync(path.join(__dirname, "config.json"), "utf-8")
  );
} catch (e) {
  config = {
    server: { port: 3000 },
    gravatar: {
      mirrorUrl: "https://www.gravatar.cn/avatar/%s",
      defaultSize: 200,
    },
    avatar: { defaultSize: 380, fallbackToGenerated: true },
    cache: { maxAge: 86400 },
  };
}

let avatarConfig;
try {
  avatarConfig = JSON.parse(
    require("fs").readFileSync(
      path.join(
        __dirname,
        "src",
        "views",
        "AvatarCreator",
        "config",
        "data.json"
      ),
      "utf-8"
    )
  );
} catch (e) {
  console.error("Failed to load avatar config:", e.message);
  process.exit(1);
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
    hash = ((hash << 5) - hash) + char;
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
  const randomIndex = parseInt((randomFn() * 10000).toFixed(0)) % len;
  return arr[tmpArr[randomIndex]];
}

async function loadSvgResource(dir, filename) {
  const filePath = path.join(
    __dirname,
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

async function generateAvatarSvg(seed, size) {
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
    let svgRaw = await loadSvgResource(dir, layer.filename || "");

    const matchColorReg = /{{color\[\d+\]}}/;
    let matchRes = svgRaw.match(matchColorReg);
    while (matchRes) {
      const str = matchRes[0];
      const index = parseInt(str.replace(/^{{color\[(\d+)\]}}$/, "$1"));
      const colors = layer.color;
      if (colors && colors[index]) {
        svgRaw = svgRaw.replace(matchColorReg, colors[index]);
      } else {
        svgRaw = svgRaw.replace(matchColorReg, "#000000");
      }
      matchRes = svgRaw.match(matchColorReg);
    }

    const innerContent = svgRaw
      .replace(/<svg[^>]*>/, "")
      .replace("</svg>", "");

    groups.push(`<g id="gaoxia-avatar-${dir}">${innerContent}</g>`);
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 380 380" fill="none" xmlns="http://www.w3.org/2000/svg">${groups.join("")}</svg>`;
}

async function checkGravatar(emailOrMd5) {
  let md5;
  if (emailOrMd5.includes("@")) {
    md5 = crypto
      .createHash("md5")
      .update(emailOrMd5.trim().toLowerCase())
      .digest("hex");
  } else {
    md5 = emailOrMd5;
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
    // Request failed, continue to generate
  }

  return { found: false, md5 };
}

const app = express();

app.get("/api", async (req, res) => {
  const { seed, size } = req.query;

  if (!seed) {
    return res.status(400).json({
      error: "Missing seed parameter",
      usage: "GET /api?seed=<email|md5>&size=<optional>",
    });
  }

  const avatarSize = parseInt(size) || config.avatar.defaultSize;
  const cacheMaxAge = config.cache.maxAge || 86400;

  try {
    const gravatarResult = await checkGravatar(seed);

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
        // Fetch failed, fall through to generated avatar
      }
    }

    const svg = await generateAvatarSvg(seed, avatarSize);
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", `public, max-age=${cacheMaxAge}`);
    res.setHeader("X-Source", "generated");
    return res.send(svg);
  } catch (error) {
    console.error("Error generating avatar:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

const PORT = config.server.port || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api?seed=<email|md5>`);
  console.log(`Gravatar mirror: ${config.gravatar.mirrorUrl}`);
  console.log(`Cache max-age: ${config.cache.maxAge}s`);
});
