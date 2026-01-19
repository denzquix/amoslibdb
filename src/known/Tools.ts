import type { LibraryDef } from "../types.js";

namespace Tools {
  export const V1_00 = {
    name: 'Tools',
    version: 'V1_00',
    md5: '6a291e6040b90879575c89e914cf3518',
    type: 'pro',
    routines: {
      AddPos: 21,
      ArrayBank: 23,
      ArrayDim: 16,
      ArrayGet: 18,
      ArraySet: 17,
      Decode: 44,
      Encode: 42,
      GetByte: 9,
      GetCrypt: 37,
      GetLong: 12,
      GetPos: 4,
      GetString: 14,
      GetWord: 10,
      OuiBank: 26,
      OuiData: 27,
      OuiEdata: 29,
      OuiInit: 40,
      OuiNew: 39,
      OuiReserveText: 31,
      OuiSetBank: 25,
      OuiSetData: 28,
      OuiSetEdata: 30,
      OuiSetText: 32,
      OuiText: 33,
      Range: 20,
      SetArrayBank: 22,
      SetByte: 5,
      SetCrypt: 35,
      SetLong: 7,
      SetPos: 3,
      SetString: 8,
      SetWord: 6,
    },
  } as const satisfies LibraryDef;
  export const V1_01 = {
    name: 'Tools',
    version: 'V1_01',
    md5: 'bdba5e528c59c7300e517d966ff4889b',
    extends: V1_00,
    type: 'pro',
    routines: {
      Checksum: 46,
    },
  } as const satisfies LibraryDef;
}

export default Tools;
