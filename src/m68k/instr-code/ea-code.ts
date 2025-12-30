import type { bit_trio } from "../util.js";

enum EaCode {
  Invalid = -1,

  Dn = 1 << 0,
  An = 1 << 1,
  Mem = 1 << 2,
  Control = 1 << 3,
  Immediate = 1 << 4,

  Alterable = 1 << 5,
  Data = 1 << 6,
  DataAlterable = 1 << 7,
  MemAlterable = 1 << 8,
}

namespace EaCode {
  export function create(mode: bit_trio, reg: bit_trio): EaCode {
    switch (mode) {
      case 0: // Dn
        return (
          EaCode.Dn | EaCode.Data | EaCode.Alterable | EaCode.DataAlterable
        );
      case 1: // An
        return (
          EaCode.An | EaCode.Alterable
        );    
      case 2: // (An)
        return (
          EaCode.Mem | EaCode.Data | EaCode.Alterable | EaCode.MemAlterable | EaCode.DataAlterable | EaCode.Control
        );
      case 3: // (An)+
        return (
          EaCode.Mem | EaCode.Data | EaCode.Alterable | EaCode.MemAlterable | EaCode.DataAlterable
        );
      case 4: // -(An)
        return (
          EaCode.Mem | EaCode.Data | EaCode.Alterable | EaCode.MemAlterable | EaCode.DataAlterable
        );
      case 5: // (d16,An)
        return (
          EaCode.Mem | EaCode.Data | EaCode.Alterable | EaCode.MemAlterable | EaCode.DataAlterable | EaCode.Control
        );
      case 6: // (d8,An,Xn)
        return (
          EaCode.Mem | EaCode.Data | EaCode.Alterable | EaCode.MemAlterable | EaCode.DataAlterable | EaCode.Control
        );
      case 7:
        switch (reg) {
          case 0: // (xxx).W
          case 1: // (xxx).L
            return (
              EaCode.Mem | EaCode.Control | EaCode.Data | EaCode.Alterable | EaCode.MemAlterable | EaCode.DataAlterable
            );
          case 2: // (d16,PC)
          case 3: // (d8,PC,Xn)
            return EaCode.Mem | EaCode.Control | EaCode.Data;
          case 4: // #<data>
            return EaCode.Immediate | EaCode.Data;
          default:
            // Invalid EA encodings on 68000: mode=111, reg=101..111 are reserved.
            return EaCode.Invalid;
        }
    }
  }
}

export default EaCode;
