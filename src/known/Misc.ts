
import type { LibraryDef } from "../types.js";

export namespace Colours {
  export const V1_00 = {
    name: 'Colours',
    version: 'V1_00',
    md5: 'abdae43fb9bcc08a20588f1e588ba5fa',
    type: 'pro',
    routines: {
      Black: 5,
      Blue: 4,
      Brown: 11,
      COrange: 12,
      Cyan: 8,
      DarkBlue: 15,
      DarkBrown: 20,
      DarkCyan: 18,
      DarkGreen: 14,
      DarkGrey: 19,
      DarkMagenta: 17,
      DarkRed: 13,
      DarkYellow: 16,
      Green: 3,
      Grey: 10,
      LightBlue: 23,
      LightBrown: 28,
      LightCyan: 26,
      LightGreen: 22,
      LightGrey: 27,
      LightMagenta: 25,
      LightRed: 21,
      LightYellow: 24,
      Magenta: 7,
      Red: 2,
      White: 9,
      Yellow: 6,
    },
  } as const satisfies LibraryDef;
}

export namespace CoolStars {
  export const V1_00 = {
    name: 'CoolStars',
    version: 'V1_00',
    md5: '3f396c63b5930eb678c608016f85bf58',
    type: 'pro',
    routines: {
      CstarsBclear: 45,
      CstarsBdraw: 46,
      CstarsBdraw_I: 47,
      CstarsBdraw_II: 48,
      CstarsCalc: 49,
      CstarsCalc_I: 50,
      CstarsCalc_II: 51,
      CstarsClear: 41,
      CstarsColour: 40,
      CstarsDraw: 42,
      CstarsDraw_I: 43,
      CstarsDraw_II: 44,
      CstarsLimit: 30,
      CstarsLimit_IIII: 31,
      CstarsMakeOrigins: 32,
      CstarsOriginOff: 33,
      CstarsReserve: 16,
      CstarsReserve_II: 17,
      CstarsSet_III: 18,
      CstarsSet_IIIII: 19,
      CstarsSet_IIIIII: 20,
      CstarsSetColour: 23,
      CstarsSetXSpd: 21,
      CstarsSetYSpd: 22,
      CstarsXDir: 38,
      CstarsXRev: 24,
      CstarsXRev_I: 25,
      CstarsXRev_II: 26,
      CstarsXSpd: 36,
      CstarsXStar: 34,
      CstarsYDir: 39,
      CstarsYRev: 27,
      CstarsYRev_I: 28,
      CstarsYRev_II: 29,
      CstarsYSpd: 37,
      CstarsYStar: 35,
    },
  } as const satisfies LibraryDef;
}

export namespace DBench {
  export const V0_42 = {
    name: 'DBench',
    version: 'V0_42',
    md5: '5c4763ee21d35b109e4f272a9628ff04',
    type: 'pro',
    routines: {
      DbAddress: 4,
      DbClose: 7,
      DbField_I__S: 23,
      DbField_S__I: 24,
      DbFieldno: 10,
      DbFlen: 8,
      DbFtype: 14,
      DbGet: 25,
      DbGoto: 26,
      DbOpencount: 16,
      DbPut: 27,
      DbReccount: 20,
      DbRecle: 22,
      DbRecno: 21,
      DbRecsaved: 13,
      DbSavedOff: 12,
      DbSavedOn: 11,
      DbSel: 5,
      DbSelect: 15,
      DbSelectFirst: 18,
      DbSelectNext: 17,
      DbState: 19,
      DbUse: 6,
    },
  } as const satisfies LibraryDef;
}

export namespace THX {
  export const V0_6 = {
    name: 'THX',
    version: 'V0_6',
    md5: 'dc22ca6e0e626e06a7044963d6a7fa6c',
    type: 'pro',
    routines: {
      ThxEnd: 7,
      ThxLoad: 4,
      ThxPlay: 2,
      ThxStop: 3,
      ThxSubsongs: 6,
      ThxVolume: 5,
    },
  } as const satisfies LibraryDef;
}


export namespace Effects {
  export const V0_15 = {
    name: 'Effects',
    version: 'V0_15',
    md5: '896cfbace7e6e3aacc711e49dd260ce1',
    type: 'pro',
    routines: {
      AgaFadeCmap_I: 8,
      AgaFadeCmap_II: 9,
      BankInterpolateB: 11,
      BankInterpolateL: 13,
      BankInterpolateW: 12,
      CreateScreenTable: 2,
      StarclearOne: 5,
      StarclearTwo: 7,
      StarfieldBank: 3,
      StarfieldOne: 4,
      StarfieldTwo: 6,
      WriteAgaCmap: 10,
    },
  } as const satisfies LibraryDef;
}

export namespace Ercole {
  export const V1_70 = {
    name: 'Ercole',
    version: 'V1_70',
    md5: '598f3c52426d00c38399303cfab5c717',
    type: 'pro',
    routines: {
      Cli: 3,
      ExtFire: 9,
      ExtJoy: 8,
      LibraryClose: 5,
      LibraryOpen: 4,
      Paddle: 6,
      PadFire: 7,
      PropOff: 2,
      PropOn: 1,
      Xfire: 10,
      Yfire: 11,  
    },
  } as const satisfies LibraryDef;
}

export namespace First {
  export const V0_10 = {
    name: 'First',
    version: 'V0_10',
    md5: '5ab1de0fd129b344505f134651a2c3ab',
    type: 'pro',
    routines: {
      ChangeLed: 3,
      ClearBanks: 6,
      WaitJoy: 5,
      WaitMouse: 4,
    },
  } as const satisfies LibraryDef;
}



export namespace Jotre {
  export const V1_00 = {
    name: 'Jotre',
    version: 'V1_00',
    md5: '0128bd165441e7dc3476b33aab15ac2f',
    type: 'pro',
    routines: {
      DeinitThx: 5,
      InitThx: 4,
      PlayThx: 6,
      StopThx: 7,
      VolumeThx: 8,
    },
  } as const satisfies LibraryDef;

  export const V1_00_ALT = {
    name: 'Jotre',
    version: 'V1_00_ALT',
    md5: '458bf8c621cd53d696a913e3a3e1bd3b',
    type: 'pro',
    extends: V1_00,
    routines: {
    },
  } as const satisfies LibraryDef;
}

export namespace JVP {
  export const V1_01 = {
    name: 'JVP',
    version: 'V1_01',
    md5: '7b0f1233dbf051041d8aa9ec256980a5',
    type: 'pro',
    routines: {
      JvpBinSort: 2,
      JvpBinSortType: 12,
      JvpCstr: 8,
      JvpMsg: 15,
      JvpMsg_III: 16,
      JvpMsgBank: 17,
      JvpMsgExists: 14,
      JvpSetMsgBank: 13,
      JvpSetStrLen: 3,
      JvpSetStrSep: 4,
      JvpSetStrSep_I: 5,
      JvpSetStrSep_IIIIII: 6,
      JvpStr: 7,
      JvpVersion: 11,
    },
  } as const satisfies LibraryDef;
}

export namespace Locale {
  export const V0_26 = {
    name: 'Locale',
    version: 'V0_26',
    md5: '1533b53d6fe0018d4a334934c2177609',
    type: 'pro',
    routines: {
      CatalogActive: 13,
      CatalogString: 7,
      CloseCatalog: 11,
      Date: 21,
      Datetime: 23,
      EmitCatalogDescription: 14,
      EmitClose: 15,
      FormatDate: 20,
      LocaleActive: 12,
      LocaleCompare_SS: 17,
      LocaleCompare_SSI: 18,
      LocaleLower: 2,
      LocaleString: 6,
      LocaleUpper: 3,
      Lowerchar: 4,
      OpenCatalog_SS: 9,
      OpenCatalog_SSI: 8,
      ShortDate: 24,
      ShortDatetime: 26,
      ShortTime: 25,
      Time: 22,
      Upperchar: 5,
    },
  } as const satisfies LibraryDef;
}

export namespace Lserial {
  export const V1_00 = {
    name: 'Lserial',
    version: 'V1_00',
    md5: 'cd9a014db36652889319c3599568dedc',
    type: 'pro',
    routines: {
      Lcarrier: 10,
      Linkey: 14,
      LserBaud: 12,
      LserBrk: 11,
      LserClose: 2,
      LserGet: 9,
      LserMulCheck: 8,
      LserMulSend: 7,
      LserOpen: 1,
      LserParams: 15,
      LserQuery: 6,
      LserRead: 4,
      LserSend: 3,
      LserStatus: 16,
      Lxpr: 13,
    },
  } as const satisfies LibraryDef;
  export const V1_00_ALT = {
    name: 'Lserial',
    version: 'V1_00_ALT',
    md5: '7abb0e24b19ecc37375a92a1bcfcc0fb',
    extends: V1_00,
    type: 'pro',
    routines: {
    },
  } as const satisfies LibraryDef;
}

export namespace Misc {
  export const V1_00 = {
    name: 'Misc',
    version: 'V1_00',
    md5: '705ae209c25563aa86997a3ee6bfe915',
    type: 'pro',
    routines: {
      ClearRam: 11,
      DiskWait: 13,
      DisplayOff: 3,
      DisplayOn: 4,
      DledOff: 8,
      DledOn: 7,
      Firewait: 12,
      MouseOff: 9,
      MultiOff: 5,
      MultiOn: 6,
      PalOn: 14,
      Reset: 10,
    },
  } as const satisfies LibraryDef;
}

export namespace P61 {
  export const V1_10 = {
    name: 'P61',
    version: 'V1_10',
    md5: 'bd2ef5bbd17bc80a0ed29573c6b0d1c5',
    type: 'pro',
    routines: {
      P61CiaSpeed: 8,
      P61Continue: 6,
      P61Fade_I: 10,
      P61Fade_II: 11,
      P61Pause: 5,
      P61Play_I: 2,
      P61Play_II: 3,
      P61Pos: 12,
      P61Signal: 9,
      P61Stop: 4,
      P61Volume: 7,
    },
  } as const satisfies LibraryDef;
  export const V1_20 = {
    name: 'P61',
    version: 'V1_20',
    md5: '6e97e9396e27a2716e1e05fecd235beb',
    type: 'pro',
    extends: V1_10,
    routines: {
    },
  } as const satisfies LibraryDef;
}

export namespace TFT {
  export const V0_6 = {
    name: 'TFT',
    version: 'V0_6',
    md5: '1e0403b9b3e49b03d9d2ca7d7a6f7a67',
    type: 'pro',
    routines: {
      CpuClear: 26,
      CpuClearNtsc: 24,
      CpuClearPal: 25,
      GetHighWord: 6,
      GetLowWord: 7,
      GetTimer: 9,
      GetXmouse: 17,
      GetYmouse: 18,
      InitBplScroll: 8,
      InitCpuClear: 27,
      InitTimer: 12,
      MfmLuecke: 4,
      MfmRead: 3,
      Qsort_III: 20,
      Qsort_IIII: 21,
      SetBpl: 5,
      StartInt: 11,
      StartTimer: 13,
      StopInt: 10,
      StopTimer: 14,
      TftError: 19,
      TftVersion: 23,
      VarMask: 22,
    },
  } as const satisfies LibraryDef;
}
