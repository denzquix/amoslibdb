import type { LibraryDef } from "../types.js";

namespace Make {
  export const V1_20 = {
    name: 'Make',
    version: 'V1_20',
    md5: 'c454b95d20ddc13920cc963a88895c2a',
    type: 'pro',
    routines: {
      MaAddhead: 7,
      MaAddtail: 9,
      MaAllocmem: 4,
      MaAllocvec: 11,
      MaExtb: 21,
      MaExtw: 22,
      MaFilelen: 20,
      MaFirst: 18,
      MaFree: 14,
      MaFreeAll: 15,
      MaFreemem: 5,
      MaFreevec: 12,
      MaLast: 19,
      MaMalloc: 13,
      MaNewlist: 6,
      MaNext: 16,
      MaPasteIcon: 23,
      MaPlot: 25,
      MaPoint: 24,
      MaPrev: 17,
      MaRemhead: 10,
      MaRemove: 8,
      MemChip: 26,
      MemClear: 28,
      MemFast: 27,
      MemPublic: 29,
    },
  } as const satisfies LibraryDef;
  export const V1_30 = {
    name: 'Main',
    version: 'V1_30',
    md5: '39ad8fe2a2eedaf497776fb498602c3d',
    type: 'pro',
    extends: V1_20,
    routines: {
      MaFclose: 31,
      MaFopen: 30,
      MaFread: 33,
      MaFseek: 34,
      MaFwrite: 32,
      MaRealloc: 35,
    },
  } as const satisfies LibraryDef;
}

export default Make;
