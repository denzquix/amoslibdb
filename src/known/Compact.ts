
import type { LibraryDef } from "../types.js";

namespace Compact {
  export const V1_20 = {
    name: 'Compact',
    version: 'V1_20',
    md5: 'c1a1000229402f403ee1020ff74a9330',
    type: 'creator',
    routines: {
      Pack_II: 3,
      Pack_IIIIII: 4,
      Spack_II: 5,
      Spack_IIIIII: 6,
      Unpack_I: 7,
      Unpack_II: 10,
      Unpack_III: 8,
    },
  } satisfies LibraryDef;
  export const V1_20_ALT1 = {
    name: 'Compact',
    version: 'V1_20_ALT1',
    md5: '97bcd0cc54e41e74384cb0388394dfc5',
    type: 'creator',
    extends: V1_20,
    routines: {
    },
  } satisfies LibraryDef;
  export const V1_20_ALT2 = {
    name: 'Compact',
    version: 'V1_20_ALT2',
    md5: 'f3a2af3d3f212b2d12b08f631d2889ba',
    type: 'creator',
    extends: V1_20,
    routines: {
    },
  } satisfies LibraryDef;
  export const V1_20_ALT3 = {
    name: 'Compact',
    version: 'V1_20_ALT3',
    md5: '6c02703c2f4ef648490ce60b9afa7392',
    type: 'creator',
    extends: V1_20,
    routines: {
    },
  } satisfies LibraryDef;
  export const ProV2_00 = {
    name: 'Compact',
    version: 'V2_00',
    md5: '57e035efd4d37cb5504bd7d619a99933',
    type: 'pro',
    routines: {
      Pack_II: 2,
      Pack_IIIIII: 3,
      Spack_II: 4,
      Spack_IIIIII: 5,
      Unpack_I: 6,
      Unpack_II: 9,
      Unpack_III: 7,
    },
  } as const satisfies LibraryDef;
}

export default Compact;
