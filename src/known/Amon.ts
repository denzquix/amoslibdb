import type { LibraryDef } from "../types.js";

namespace Amon {
  export const V1_03 = {
    md5: '520ca2adccb70f14b35233ed3222b360',
    type: 'pro',
    routines: {
      FastAngle_IIIII: 8,
      FastAngle_III: 9,
      FastCircle: 23,
      FastJoy0: 12,
      FastJoy1: 11,
      FastPlot: 21,
      Keycode: 14,
      KeyPress: 15,
      LimitRodent: 5,
      Lrodent: 6,
      MulCos: 17,
      MulSin: 16,
      RodentKey: 18,
      RodentX: 2,
      RodentY: 3,
      Rrodent: 7,
      SetRodent: 19,
      TestAdd: 22,
      VideoWait: 4,
    },
  } as const satisfies LibraryDef;
  export const V1_04 = {
    md5: 'dfa5be99bec25c2e67fdce586b04f47f',
    type: 'pro',
    extends: V1_03,
    routines: {
      ArrayPlot: 24,
      CountColour: 20,
      FastPoint: 22,
      FindColour: 29,
      Joy3: 25,
      Joy4: 26,
    },
  } as const satisfies LibraryDef;
}

export default Amon;
