/**
 * 基于种子的伪随机数生成器 (Mulberry32)
 * 确保相同种子永远产生相同的随机序列
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed | 0;
  return function(): number {
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * 将字符串转换为数字种子
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}
