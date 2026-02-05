
import type { LibraryDef } from "../types.js";

namespace Requester {
  export const V1_30 = {
    md5: 'c87323faf80aca2b869fc0ccf52f60bd',
    name: 'Requester',
    version: 'V1_30',
    type: 'creator',
    routines: {
      RequestOn: 5,
      RequestOff: 6,
      RequestWb: 4,
    },
  } as const satisfies LibraryDef;
  export const V1_30_ALT = {
    md5: '8235038ba98c91a1382487dbb2de50a9',
    name: 'Requester',
    version: 'V1_30_ALT',
    type: 'creator',
    extends: V1_30,
    routines: {
    },
  } as const satisfies LibraryDef;
  export const V1_41 = {
    md5: 'c62e6076187fcc309f4e32c0259c63de',
    name: 'Requester',
    version: 'V1_41',
    type: 'creator',
    extends: V1_30,
    routines: {
    },
  } as const satisfies LibraryDef;
  export const ProV2_00 = {
    md5: '7d3df35f6a37886c2d4c84542b9300e0',
    name: 'Requester',
    version: 'V2_00',
    type: 'pro',
    routines: {
      RequestWb: 2,
      RequestOn: 3,
      RequestOff: 4,
    },
  } as const satisfies LibraryDef;
}

export default Requester;
