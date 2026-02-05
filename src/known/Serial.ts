import type { LibraryDef } from "../types.js";

namespace Serial {
  export const V1_10 = {
    name: 'Serial',
    version: 'V1_10',
    type: 'creator',
    md5: 'ca910488e6880d63791ba3fda1858d54',
    routines: {
      SerialOpen_II: 3,
      SerialOpen_IIIII: 4,
      SerialClose: 6,
      SerialClose_I: 5,
      SerialSpeed: 12,
      SerialCheck: 20,
      SerialSend: 8,
      SerialBits: 14,
      SerialX: 16,
      SerialBuf: 17,
      SerialParity: 15,
      SerialGet: 10,
      SerialInput: 11,
      SerialFast: 18,
      SerialSlow: 19,
      SerialError: 21,
      SerialOut: 9,
    },
  } as const satisfies LibraryDef;
  export const V1_20 = {
    name: 'Serial',
    version: 'V1_20',
    type: 'creator',
    md5: '3473e258886a7f864a78c971995668dd',
    extends: V1_10,
    routines: {
    },
  } as const satisfies LibraryDef;
}

export default Serial;
