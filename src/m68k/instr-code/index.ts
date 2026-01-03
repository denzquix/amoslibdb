import MnemonicCode from "../mnemonic.js";
import { bit, bit_duo, bit_trio, nibble, Size } from "../util.js";
import EaCode from "./ea-code.js";
import * as InstrCode from './all.js';

export const unpack = (ic: number) => {
  return {
    mnemonicCode: (ic & 0xff) as MnemonicCode,
    size: (['B', 'W', 'L', null] as const)[bit_duo(ic, 8)],
    extensionWords: bit_duo(ic, 10) as number,
    overload: bit_trio(ic, 12) as number,
  };
};

// Intentionally designed to always return -1 for Size.NONE
const sizeSelect = (sz: Size, from: {B: number, W?: number, L?: number} | {B?: number, W: number, L?: number} | {B?: number, W?: number, L: number}) => {
  switch (sz) {
    case Size.BYTE: return from.B ?? -1;
    case Size.WORD: return from.W ?? -1;
    case Size.LONG: return from.L ?? -1;
    case Size.NONE: default: return -1;
  }
};

export function fromOpcode(opcode: number): number {
  opcode &= 0xffff;

  const top = nibble(opcode, 12);

  // Reserved/unimplemented instruction lines on plain 68000
  if (top === 0xA || top === 0xF) return -1;

  const mode = bit_trio(opcode, 3);
  const reg = bit_trio(opcode, 0);
  const ea = EaCode.create(mode, reg);

  switch (top) {
    case 0x1:
    case 0x2:
    case 0x3: {
      // MOVE lines: destination EA is split across bits 11..6
      const destReg = bit_trio(opcode, 9);
      const destMode = bit_trio(opcode, 6);
      const srcMode = bit_trio(opcode, 3);
      const srcReg = bit_trio(opcode, 0);

      const srcEA = EaCode.create(srcMode, srcReg);
      const destEA = EaCode.create(destMode, destReg);

      if (srcEA === EaCode.Invalid) return -1;
      // MOVE destination must be alterable
      if (!(destEA & EaCode.Alterable)) return -1;

      const sizeCode = (top === 0x1) ? Size.BYTE : (top === 0x3) ? Size.WORD : Size.LONG;

      // MOVEA exists only for word/long when destination is An direct
      if (destMode === 1) {
        return sizeSelect(sizeCode, InstrCode.MOVEA);
      }

      // MOVE special destinations (CCR/SR) are in 0x4 line, not here.
      return sizeSelect(sizeCode, InstrCode.MOVE_EA_EA);
    }

    case 0x6: {
      // Branches: 0110 cccc dddddddd  (disp=0 => word extension)
      const cc = nibble(opcode, 8);
      const disp8 = opcode & 0xff;
      const sizeCode = disp8 === 0x00 ? Size.WORD : Size.BYTE;

      // Note: on 68020+, disp8 == 0xFF indicates LONG mode, but
      // on 68000 it means -1
      switch (cc) {
        case 0x0: return sizeSelect(sizeCode, InstrCode.BRA);
        case 0x1: return sizeSelect(sizeCode, InstrCode.BSR);
        case 0x2: return sizeSelect(sizeCode, InstrCode.BHI);
        case 0x3: return sizeSelect(sizeCode, InstrCode.BLS);
        case 0x4: return sizeSelect(sizeCode, InstrCode.BCC);
        case 0x5: return sizeSelect(sizeCode, InstrCode.BCS);
        case 0x6: return sizeSelect(sizeCode, InstrCode.BNE);
        case 0x7: return sizeSelect(sizeCode, InstrCode.BEQ);
        case 0x8: return sizeSelect(sizeCode, InstrCode.BVC);
        case 0x9: return sizeSelect(sizeCode, InstrCode.BVS);
        case 0xA: return sizeSelect(sizeCode, InstrCode.BPL);
        case 0xB: return sizeSelect(sizeCode, InstrCode.BMI);
        case 0xC: return sizeSelect(sizeCode, InstrCode.BGE);
        case 0xD: return sizeSelect(sizeCode, InstrCode.BLT);
        case 0xE: return sizeSelect(sizeCode, InstrCode.BGT);
        case 0xF: return sizeSelect(sizeCode, InstrCode.BLE);
      }
    }

    case 0x7: {
      // MOVEQ: 0111 rrr 0 iiiiiiii
      if (bit(opcode, 8) !== 0) return -1;
      return InstrCode.MOVEQ;
    }

    case 0x5: {
      const sizeCode = bit_duo(opcode, 6);

      // Scc / DBcc when size field is 11
      if (sizeCode === 0b11) {
        const cc = nibble(opcode, 8);

        // DBcc: 0101 cccc 11001 rrr  (bits 7..3 == 11001)
        if (((opcode >>> 3) & 0x1f) === 0x19) {
          switch (cc) {
            case 0x0: return InstrCode.DBT;
            case 0x1: return InstrCode.DBF;
            case 0x2: return InstrCode.DBHI;
            case 0x3: return InstrCode.DBLS;
            case 0x4: return InstrCode.DBCC;
            case 0x5: return InstrCode.DBCS;
            case 0x6: return InstrCode.DBNE;
            case 0x7: return InstrCode.DBEQ;
            case 0x8: return InstrCode.DBVC;
            case 0x9: return InstrCode.DBVS;
            case 0xA: return InstrCode.DBPL;
            case 0xB: return InstrCode.DBMI;
            case 0xC: return InstrCode.DBGE;
            case 0xD: return InstrCode.DBLT;
            case 0xE: return InstrCode.DBGT;
            case 0xF: return InstrCode.DBLE;
          }
          return -1;
        }

        // Scc: destination must be data-alterable (Dn or memory), not An direct
        if (!(ea & EaCode.DataAlterable)) return -1;
        switch (cc) {
          case 0x0: return InstrCode.ST;
          case 0x1: return InstrCode.SF;
          case 0x2: return InstrCode.SHI;
          case 0x3: return InstrCode.SLS;
          case 0x4: return InstrCode.SCC;
          case 0x5: return InstrCode.SCS;
          case 0x6: return InstrCode.SNE;
          case 0x7: return InstrCode.SEQ;
          case 0x8: return InstrCode.SVC;
          case 0x9: return InstrCode.SVS;
          case 0xA: return InstrCode.SPL;
          case 0xB: return InstrCode.SMI;
          case 0xC: return InstrCode.SGE;
          case 0xD: return InstrCode.SLT;
          case 0xE: return InstrCode.SGT;
          case 0xF: return InstrCode.SLE;
        }
        return -1;
      }

      // ADDQ/SUBQ
      if (!(ea & EaCode.Alterable)) return -1;

      // byte size cannot target An direct (but may target memory)
      if (sizeCode === Size.BYTE && (ea & EaCode.An) && !(ea & EaCode.Mem)) return -1;

      const isSub = bit(opcode, 8) === 1;

      return sizeSelect(sizeCode, isSub ? InstrCode.SUBQ : InstrCode.ADDQ);
    }

    case 0xE: {
      // Shifts/rotates
      const sizeCode = bit_duo(opcode, 6);
      const isMemoryForm = sizeCode === Size.NONE;

      const group = bit_duo(opcode, 9);
      const left = bit(opcode, 8) === 1;

      if (isMemoryForm) {
        if (bit(opcode, 11) !== 0) return -1;
        if (!(ea & EaCode.MemAlterable)) return -1;
        switch (group) {
          case 0b00: return left ? InstrCode.ASL_MEM.W : InstrCode.ASR_MEM.W;
          case 0b01: return left ? InstrCode.LSL_MEM.W : InstrCode.LSR_MEM.W;
          case 0b10: return left ? InstrCode.ROXL_MEM.W : InstrCode.ROXR_MEM.W;
          case 0b11: return left ? InstrCode.ROL_MEM.W : InstrCode.ROR_MEM.W;
        }
      }

      switch (group) {
        case 0b00: return sizeSelect(sizeCode, left ? InstrCode.ASL_REG : InstrCode.ASR_REG);
        case 0b01: return sizeSelect(sizeCode, left ? InstrCode.LSL_REG : InstrCode.LSR_REG);
        case 0b10: return sizeSelect(sizeCode, left ? InstrCode.ROXL_REG : InstrCode.ROXR_REG);
        case 0b11: return sizeSelect(sizeCode, left ? InstrCode.ROL_REG : InstrCode.ROR_REG);
      }
    }

    case 0x4: {
      // Fully-specified
      switch (opcode) {
        case 0x4AFC: return InstrCode.ILLEGAL;
        case 0x4E70: return InstrCode.RESET;
        case 0x4E71: return InstrCode.NOP;
        case 0x4E72: return InstrCode.STOP;
        case 0x4E73: return InstrCode.RTE;
        case 0x4E75: return InstrCode.RTS;
        case 0x4E76: return InstrCode.TRAPV;
        case 0x4E77: return InstrCode.RTR;
      }

      // Register-only (mask 0xFFF8)
      // NB: "SWAP" MUST precede "PEA"!
      switch (opcode & 0xfff8) {
        case 0x4880: return InstrCode.EXT.W;
        case 0x48c0: return InstrCode.EXT.L;
        case 0x4840: return InstrCode.SWAP;
        case 0x4e50: return InstrCode.LINK;
        case 0x4e58: return InstrCode.UNLK;
        case 0x4e60: return InstrCode.MOVE_USP_An_L;
        case 0x4e68: return InstrCode.MOVE_An_USP_L;
      }

      // 4-bit register field (mask 0xFFF0)
      switch (opcode & 0xfff0) {
        case 0x4e40: return InstrCode.TRAP;
      }

      // EA-based, 6-bit EA field (mask 0xFFC0)
      switch (opcode & 0xffc0) {
        case 0x4e80:
          if (!(ea & EaCode.Control)) return -1;
          return InstrCode.JSR;
        case 0x4ec0:
          if (!(ea & EaCode.Control)) return -1;
          return InstrCode.JMP;
        case 0x4800:
          if (!(ea & EaCode.DataAlterable)) return -1;
          return InstrCode.NBCD;
        case 0x4840:
          if (!(ea & EaCode.Control)) return -1;
          return InstrCode.PEA;
        case 0x4ac0:
          if (!(ea & EaCode.DataAlterable)) return -1;
          return InstrCode.TAS;
        case 0x40c0:
          if (!(ea & EaCode.DataAlterable)) return -1;
          return InstrCode.MOVE_SR_EA_W;
        case 0x46c0:
          if (!(ea & EaCode.Data)) return -1;
          return InstrCode.MOVE_EA_SR_W;
        case 0x44c0:
          if (!(ea & EaCode.Data)) return -1;
          return InstrCode.MOVE_EA_CCR_W;
      }

      // EA-based with upper register field (mask 0xF1C0)
      switch (opcode & 0xf1c0) {
        case 0x41c0:
          if (!(ea & EaCode.Control)) return -1;
          return InstrCode.LEA;
        case 0x4180:
          if (!(ea & EaCode.Data)) return -1;
          return InstrCode.CHK;
      }

      // Sized unary ops (mask 0xFF00, bits 7-6 = size)
      switch (opcode & 0xff00) {
        case 0x4200: {
          if (!(ea & EaCode.DataAlterable)) return -1;
          const sizeCode = bit_duo(opcode, 6);
          return sizeSelect(sizeCode, InstrCode.CLR);
        }
        case 0x4400: {
          if (!(ea & EaCode.DataAlterable)) return -1;
          const sizeCode = bit_duo(opcode, 6);
          return sizeSelect(sizeCode, InstrCode.NEG);
        }
        case 0x4000: {
          if (!(ea & EaCode.DataAlterable)) return -1;
          const sizeCode = bit_duo(opcode, 6);
          return sizeSelect(sizeCode, InstrCode.NEGX);
        }
        case 0x4600: {
          if (!(ea & EaCode.DataAlterable)) return -1;
          const sizeCode = bit_duo(opcode, 6);
          return sizeSelect(sizeCode, InstrCode.NOT);
        }
        case 0x4a00: {
          if (!(ea & EaCode.Data)) return -1;
          const sizeCode = bit_duo(opcode, 6);
          return sizeSelect(sizeCode, InstrCode.TST);
        }
      }

      switch (opcode & 0xff80) {
        case 0x4880: {
          if (!(ea & EaCode.MemAlterable)) return -1;
          if (mode === 0b011) return -1; // (An)+ not allowed as destination
          const movemSize = bit(opcode, 6) === 0 ? Size.WORD : Size.LONG;
          return sizeSelect(movemSize, InstrCode.MOVEM_TO_MEM);
        }
        case 0x4c80: {
          if (!(ea & EaCode.Mem)) return -1;
          if ((ea & EaCode.Immediate)) return -1;
          if (mode === 0b100) return -1; // -(An) not allowed as source
          const movemSize = bit(opcode, 6) === 0 ? Size.WORD : Size.LONG;
          return sizeSelect(movemSize, InstrCode.MOVEM_TO_REG);
        }
      }

      return -1;
    }

    case 0x0: {
      const hiByte = opcode >>> 8;

      // ORI/ANDI/SUBI/ADDI/EORI/CMPI
      if (
        hiByte === 0x00 || hiByte === 0x02 || hiByte === 0x04 ||
        hiByte === 0x06 || hiByte === 0x0a || hiByte === 0x0c
      ) {
        // CCR/SR special cases
        switch (opcode) {
          case 0x003c: return InstrCode.ORI_CCR_B;
          case 0x007c: return InstrCode.ORI_SR_W;
          case 0x023c: return InstrCode.ANDI_CCR_B;
          case 0x027c: return InstrCode.ANDI_SR_W;
          case 0x0a3c: return InstrCode.EORI_CCR_B;
          case 0x0a7c: return InstrCode.EORI_SR_W;
        }

        const sizeCode = bit_duo(opcode, 6);

        const isCmpi = hiByte === 0x0c;
        if (isCmpi) {
          if (!(ea & EaCode.Data)) return -1;
          return sizeSelect(sizeCode, InstrCode.CMPI);
        }

        if (!(ea & EaCode.DataAlterable)) return -1;

        switch (hiByte) {
          case 0x00: return sizeSelect(sizeCode, InstrCode.ORI_EA);
          case 0x02: return sizeSelect(sizeCode, InstrCode.ANDI_EA);
          case 0x04: return sizeSelect(sizeCode, InstrCode.SUBI);
          case 0x06: return sizeSelect(sizeCode, InstrCode.ADDI);
          case 0x0a: return sizeSelect(sizeCode, InstrCode.EORI_EA);
        }
      }

      // Immediate bit ops: 0000 1000 oo mmm rrr
      if ((opcode & 0x0f00) === 0x0800) {
        const which = bit_duo(opcode, 6);

        if (which === 0b00) {
          // BTST #imm,<ea>
          if (!(ea & EaCode.Data)) return -1;
          if (ea & EaCode.Immediate) return -1;
          return InstrCode.BTST_IMM;
        }

        // BCHG/BCLR/BSET #imm,<ea>
        if (!(ea & EaCode.DataAlterable)) return -1;
        return which === 0b01 ? InstrCode.BCHG_IMM
            : which === 0b10 ? InstrCode.BCLR_IMM
            : InstrCode.BSET_IMM;
      }

      // MOVEP
      if ((opcode & 0xf138) === 0x0108) {
        const dirMemToReg = bit(opcode, 7) === 1;
        const sizeCode = bit(opcode, 6) === 1 ? Size.LONG : Size.WORD;
        if (dirMemToReg) {
          return sizeSelect(sizeCode, InstrCode.MOVEP_MEM_REG);
        }
        else {
          return sizeSelect(sizeCode, InstrCode.MOVEP_REG_MEM);
        }
      }

      // Register bit ops (coarse acceptance)
      if (bit(opcode, 8) === 1) {
        const op3 = bit_trio(opcode, 6);
        if (op3 >= 4 && op3 <= 7) {
          const which = (op3 - 4) as (0 | 1 | 2 | 3);

          if (which === 0) {
            // BTST Dn,<ea>
            if (!(ea & EaCode.Data)) return -1;
            if ((ea & EaCode.Immediate)) return -1;
            return InstrCode.BTST_REG;
          }

          if (!(ea & EaCode.DataAlterable)) return -1;
          return which === 1 ? InstrCode.BCHG_REG
              : which === 2 ? InstrCode.BCLR_REG
              : InstrCode.BSET_REG;
        }
      }

      return -1;
    }

    case 0x8: {
      // DIVU/DIVS
      if ((opcode & 0xf1c0) === 0x80c0) {
        if (!(ea & EaCode.Data)) return -1;
        return InstrCode.DIVU;
      }
      if ((opcode & 0xf1c0) === 0x81c0) {
        if (!(ea & EaCode.Data)) return -1;
        return InstrCode.DIVS;
      }

      // SBCD
      switch (opcode & 0xf1f8) {
        case 0x8100: return InstrCode.SBCD_REG;
        case 0x8108: return InstrCode.SBCD_MEM;
      }

      // OR (coarse)
      const sizeCode = bit_duo(opcode, 6);
      if (!(ea & EaCode.Data)) return -1;

      const dirToEa = bit(opcode, 8) === 1;
      if (dirToEa && !(ea & EaCode.DataAlterable)) return -1;
      return sizeSelect(sizeCode, dirToEa ? InstrCode.OR_DN_EA : InstrCode.OR_EA_DN);
    }

    case 0x9: {
      const opmode = bit_trio(opcode, 6);
      switch (opmode) {
        case 0b000:
          return (ea !== EaCode.Invalid) ? InstrCode.SUB_EA_DN.B : -1;
        case 0b001:
          return (ea !== EaCode.Invalid) ? InstrCode.SUB_EA_DN.W : -1;
        case 0b010:
          return (ea !== EaCode.Invalid) ? InstrCode.SUB_EA_DN.L : -1;
        case 0b011:
          return (ea !== EaCode.Invalid) ? InstrCode.SUBA.W : -1;
        case 0b100:
          if (mode === 0) return InstrCode.SUBX_REG.B;
          if (mode === 1) return InstrCode.SUBX_MEM.B;
          return (ea & EaCode.MemAlterable) ? InstrCode.SUB_DN_EA.B : -1;
        case 0b101:
          if (mode === 0) return InstrCode.SUBX_REG.W;
          if (mode === 1) return InstrCode.SUBX_MEM.W;
          return (ea & EaCode.MemAlterable) ? InstrCode.SUB_DN_EA.W : -1;
        case 0b110:
          if (mode === 0) return InstrCode.SUBX_REG.L;
          if (mode === 1) return InstrCode.SUBX_MEM.L;
          return (ea & EaCode.MemAlterable) ? InstrCode.SUB_DN_EA.L : -1;
        case 0b111:
          return (ea !== EaCode.Invalid) ? InstrCode.SUBA.L : -1;
      }
    }

    case 0xB: {
      const opmode = bit_trio(opcode, 6);
      switch (opmode) {
        case 0b000:
          return (ea !== EaCode.Invalid) ? InstrCode.CMP.B : -1;
        case 0b001:
          return (ea !== EaCode.Invalid) ? InstrCode.CMP.W : -1;
        case 0b010:
          return (ea !== EaCode.Invalid) ? InstrCode.CMP.L : -1;
        case 0b011:
          return (ea !== EaCode.Invalid) ? InstrCode.CMPA.W : -1;
        case 0b100:
          if (mode === 1) return InstrCode.CMPM.B;
          return (ea & EaCode.DataAlterable) ? InstrCode.EOR.B : -1;
        case 0b101:
          if (mode === 1) return InstrCode.CMPM.W;
          return (ea & EaCode.DataAlterable) ? InstrCode.EOR.W : -1;
        case 0b110:
          if (mode === 1) return InstrCode.CMPM.L;
          return (ea & EaCode.DataAlterable) ? InstrCode.EOR.L : -1;
        case 0b111:
          return (ea !== EaCode.Invalid) ? InstrCode.CMPA.L : -1;
      }
    }

    case 0xC: {
      // MULU/MULS
      if ((opcode & 0xf1c0) === 0xc0c0) {
        if (!(ea & EaCode.Data)) return -1;
        return InstrCode.MULU;
      }
      if ((opcode & 0xf1c0) === 0xc1c0) {
        if (!(ea & EaCode.Data)) return -1;
        return InstrCode.MULS;
      }

      // EXG (explicit)
      if ((opcode & 0xf1f8) === 0xc140) return InstrCode.EXG_DN_DN;
      if ((opcode & 0xf1f8) === 0xc148) return InstrCode.EXG_AN_AN;
      if ((opcode & 0xf1f8) === 0xc188) return InstrCode.EXG_DN_AN;

      // ABCD
      if ((opcode & 0xf1f0) === 0xc100) {
        const mem = bit(opcode, 3) === 1;
        return mem ? InstrCode.ABCD_MEM : InstrCode.ABCD_REG;
      }

      // AND (coarse)
      const sizeCode = bit_duo(opcode, 6);
      if (!(ea & EaCode.Data)) return -1;

      const dirToEa = bit(opcode, 8) === 1;
      if (dirToEa && !(ea & EaCode.DataAlterable)) return -1;
      return sizeSelect(sizeCode, dirToEa ? InstrCode.AND_DN_EA : InstrCode.AND_EA_DN);
    }

    case 0xD: {
      const opmode = bit_trio(opcode, 6);
      switch (opmode) {
        case 0b000:
          return (ea !== EaCode.Invalid) ? InstrCode.ADD_EA_DN.B : -1;
        case 0b001:
          return (ea !== EaCode.Invalid) ? InstrCode.ADD_EA_DN.W : -1;
        case 0b010:
          return (ea !== EaCode.Invalid) ? InstrCode.ADD_EA_DN.L : -1;
        case 0b011:
          return (ea !== EaCode.Invalid) ? InstrCode.ADDA.W : -1;
        case 0b100:
          if (mode === 0) return InstrCode.ADDX_REG.B;
          if (mode === 1) return InstrCode.ADDX_MEM.B;
          return (ea & EaCode.MemAlterable) ? InstrCode.ADD_DN_EA.B : -1;
        case 0b101:
          if (mode === 0) return InstrCode.ADDX_REG.W;
          if (mode === 1) return InstrCode.ADDX_MEM.W;
          return (ea & EaCode.MemAlterable) ? InstrCode.ADD_DN_EA.W : -1;
        case 0b110:
          if (mode === 0) return InstrCode.ADDX_REG.L;
          if (mode === 1) return InstrCode.ADDX_MEM.L;
          return (ea & EaCode.MemAlterable) ? InstrCode.ADD_DN_EA.L : -1;
        case 0b111:
          return (ea !== EaCode.Invalid) ? InstrCode.ADDA.L : -1;
      }
    }

    default:
      return -1;
  }
}

export default InstrCode;
