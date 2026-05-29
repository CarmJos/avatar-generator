export function getRandomValueInArr(
  arr: Array<Record<string, any>>,
  weightKey = 'weight',
  randomFn: () => number = Math.random
) {
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
