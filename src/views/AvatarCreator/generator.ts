import configData from "./config/data.json";
import { createSeededRandom, hashString } from "./utils/seeded-random";

interface LayerConfig {
  filename?: string;
  genderType: string;
  weight: number;
  empty?: boolean;
  avaiableColorGroupsKey?: string;
  colorSameAs?: string;
  removeLayers?: string[];
  colorNotSameAs?: string[];
  congratulate?: boolean;
}

interface LayerListItem {
  id: string;
  dir: string;
  zIndex: number;
  layers: LayerConfig[];
  description?: string;
}

interface ProcessedLayer {
  id: string;
  dir: string;
  layer: LayerConfig & { color?: string[] };
}

export interface GenerateOptions {
  size?: number;
  gender?: string;
  seed?: string | number;
}

function getRandomValueInArr(
  arr: Array<Record<string, any>>,
  weightKey = "weight",
  randomFn: () => number = Math.random
): any {
  const tmpArr: Array<number> = [];
  arr.forEach((el, index) => {
    const weight = el[weightKey];
    for (let i = 0; i < weight; i++) tmpArr.push(index);
  });
  tmpArr.sort(() => 0.5 - randomFn());
  const len = tmpArr.length;
  const randomIndex = parseInt((randomFn() * 10000).toFixed(0)) % len;
  return arr[tmpArr[randomIndex]];
}

function resolveColorGroups(
  layer: LayerConfig,
  avaiableColors: Record<string, Array<{ weight: number; value: string[] }>>
): Array<{ weight: number; value: string[] }> | null {
  if (layer.avaiableColorGroupsKey) {
    return avaiableColors[layer.avaiableColorGroupsKey] || null;
  }
  return null;
}

export async function generateAvatar(
  options: GenerateOptions = {},
  svgLoader?: (dir: string, filename: string) => Promise<string>
): Promise<string> {
  const { size = 280, gender = "0", seed } = options;

  const randomFn =
    seed !== undefined
      ? createSeededRandom(typeof seed === "string" ? hashString(seed) : seed)
      : Math.random;

  const layerList: LayerListItem[] = JSON.parse(
    JSON.stringify(configData.layerList)
  );
  const avaiableColors = configData.avaiableColors as Record<
    string,
    Array<{ weight: number; value: string[] }>
  >;

  layerList.sort((a: any, b: any) => a.zIndex - b.zIndex);

  let randomLayerList: ProcessedLayer[] = layerList
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
    .filter((item): item is ProcessedLayer => item !== null)
    .filter(({ layer }) => !layer.empty);

  const removeIdList: string[] = randomLayerList.reduce(
    (res: string[], item) => {
      return res.concat(item.layer.removeLayers || []);
    },
    []
  );

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
      while (target && target.layer.color && target.layer.color[0] === currentColors[0]) {
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

  const loadSvg = svgLoader
    ? svgLoader
    : async (dir: string, filename: string) => {
        throw new Error("SVG loader not provided");
      };

  const groups: string[] = [];
  for (const { layer, dir } of randomLayerList) {
    let svgRaw = await loadSvg(dir, layer.filename || "");

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

    groups.push(
      `<g id="gaoxia-avatar-${dir}">${innerContent}</g>`
    );
  }

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 380 380" fill="none" xmlns="http://www.w3.org/2000/svg">${groups.join("")}</svg>`;

  return svg;
}
