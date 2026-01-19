import type { LibraryDef } from "../types.js";

namespace AGA {
  export const Pro = {
    md5: '0b00fbcde204d2b6b3597d97d30c8b95',
    type: 'pro',
    routines: {
      AgaBar: 7,
      AgaBox: 6,
      AgaClip: 39,
      AgaCls: 12,
      AgaCls_I: 13,
      AgaColour_IIII__V: 24,
      AgaColour_I__I: 25,
      AgaDelBlock: 42,
      AgaDrawMode: 35,
      AgaFrontScreen: 30,
      AgaGetBankPalette: 38,
      AgaGetBlock_IIIII: 18,
      AgaGetBlock_IIIIII: 19,
      AgaGetPalette: 5,
      AgaInk_I: 9,
      AgaInk_II: 10,
      AgaLoadBitplanes: 29,
      AgaPoint: 55,
      AgaPutBlock: 20,
      AgaScreen: 23,
      AgaScreenClose: 22,
      AgaScreenCopy_II: 3,
      AgaScreenCopy_IIIIIIII: 4,
      AgaScreenOpen: 2,
      AgaSpack: 47,
      AgaSpriteMode: 36,
      AgaText: 8,
      AgaUnpack: 48,
      AgaUseFont: 54,
    },
  } as const satisfies LibraryDef;
}

export default AGA;
