
import type { LibraryDef } from "../types.js";

namespace Compact {
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
