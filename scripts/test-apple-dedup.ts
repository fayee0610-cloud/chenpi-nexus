import { isSameEvent, extractEntities, bigramsOf, jaccardSim } from "../src/lib/intelDedup";

const a = {
  titleZh: "苹果HomePod mini 2大马开卖RM649",
  titleEn: "Apple HomePod mini 2 Malaysia: S10 chip, 4-speaker surround sound and Mac support",
  summary: "苹果发布第二代HomePod mini，搭载S10芯片、支持四扬声器环绕声与Mac联动，马来西亚售价RM649，较上代涨价。",
};
const b = {
  titleZh: "苹果新Apple TV 4K大马开售",
  titleEn: "Apple TV 4K Malaysia: A19 chip, 4-speaker surround sound and smarter Siri Remote",
  summary: "苹果发布第四代Apple TV 4K，搭载A19芯片、四扬声器环绕声与新款Siri Remote，马来西亚售价RM1,349。",
};

console.log("A entities:", [...extractEntities(a.titleZh), ...extractEntities(a.titleEn)]);
console.log("B entities:", [...extractEntities(b.titleZh), ...extractEntities(b.titleEn)]);

const aEnt = new Set([...extractEntities(a.titleZh), ...extractEntities(a.titleEn)]);
const bEnt = new Set([...extractEntities(b.titleZh), ...extractEntities(b.titleEn)]);
let shared = 0;
for (const x of aEnt) if (bEnt.has(x)) { shared++; console.log("  shared:", x); }
console.log("shared count:", shared);

console.log("titleZh jaccard:", jaccardSim(bigramsOf(a.titleZh), bigramsOf(b.titleZh)));
console.log("titleEn jaccard:", jaccardSim(bigramsOf(a.titleEn), bigramsOf(b.titleEn)));
console.log("summary jaccard:", jaccardSim(bigramsOf(a.summary.slice(0,120)), bigramsOf(b.summary.slice(0,120))));
console.log("isSameEvent:", isSameEvent(a, b));
