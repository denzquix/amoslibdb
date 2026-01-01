
import assert from "node:assert";
import InstrCode, { fromOpcode, unpack } from "../instr-code/index.js";
import MnemonicCode from "../mnemonic.js";
import { bit_trio } from "../util.js";
import type { ASL, Instruction, LSL, ROL, ROXL } from "./all.js";
import { EffectiveAddress as EA, Operand, parseRegSet } from "./operand.js";

const Dn = (reg: bit_trio) => ({type:'Dn' as const, reg, mode:'direct' as const});
const An = (reg: bit_trio) => ({type:'An' as const, reg, mode:'direct' as const});
const AnPreDec = (reg: bit_trio) => ({type:'An' as const, reg, mode:'indirect-pre-dec' as const});
const AnPostInc = (reg: bit_trio) => ({type:'An' as const, reg, mode:'indirect-post-inc' as const});

export const instrExtWords = (i: Instruction): number => {
  let count = 0;

  // These have embedded immediates/displacements, not extension words
  switch (i.mnemonic) {
    case MnemonicCode.MOVEQ:
    case MnemonicCode.TRAP:
      return 0;  // These truly have no operands that need extension words
    
    case MnemonicCode.ADDQ:
    case MnemonicCode.SUBQ:
      // The immediate (1-8) is embedded in opcode, but dst may need extension words
      return Operand.requiredExtWords(i.dst);
  }

  // Shifts with immediate count have it embedded
  if ('src' in i && i.src.type === 'Imm') {
    switch (i.mnemonic) {
      case MnemonicCode.ASL:
      case MnemonicCode.ASR:
      case MnemonicCode.LSL:
      case MnemonicCode.LSR:
      case MnemonicCode.ROL:
      case MnemonicCode.ROR:
      case MnemonicCode.ROXL:
      case MnemonicCode.ROXR:
        // Only count dst, not src
        if ('dst' in i) count += Operand.requiredExtWords(i.dst);
        return count;
    }
  }


  if ('src' in i) count += Operand.requiredExtWords(i.src);
  if ('dst' in i) count += Operand.requiredExtWords(i.dst);
  if ('target' in i) count += Operand.requiredExtWords(i.target);
  if ('counter' in i) count += Operand.requiredExtWords(i.counter);
  if ('lhs' in i) count += Operand.requiredExtWords(i.lhs);
  if ('rhs' in i) count += Operand.requiredExtWords(i.rhs);
  if ('reg' in i) count += Operand.requiredExtWords(i.reg);
  if ('disp' in i && i.mnemonic === MnemonicCode.LINK) count += Operand.requiredExtWords(i.disp);
  if ('imm' in i) count += Operand.requiredExtWords(i.imm);

  return count;
};

export const readInstruction = (raw: Buffer, offset = 0, instrCode = -1): Instruction | null => {
  if ((offset + 2) > raw.length) {
    return null;
  }
  const opcode = raw.readUint16BE(offset);
  offset += 2;
  if (instrCode === -1) {
    instrCode = fromOpcode(opcode);
    if (instrCode === -1) {
      return null;
    }
  }
  const unpacked = unpack(instrCode);
  const { size, mnemonicCode: mnemonic } = unpacked;
  if (typeof MnemonicCode[mnemonic] !== 'string') {
    return null;
  }
  const totalSize = (1 + unpacked.extensionWords)*2;
  if ((offset+totalSize) > raw.length) {
    return null;
  }
  const getExtWord = () => {
    if ((offset + 2) > raw.length) {
      throw new Error('out of input');
    }
    const v = raw.readUint16BE(offset);
    offset += 2;
    return v;
  };
  switch (instrCode) {
    case InstrCode.MOVE_EA_EA.B:
    case InstrCode.MOVE_EA_EA.W:
    case InstrCode.MOVE_EA_EA.L: {
      assert(size !== null);
      const dstReg = bit_trio(opcode, 9);
      const dstMode = bit_trio(opcode, 6);
      const srcMode = bit_trio(opcode, 3);
      const srcReg = bit_trio(opcode, 0);
      const src = EA.create(srcMode, srcReg, getExtWord, size);
      const dst = EA.create(dstMode, dstReg, getExtWord, size);
      assert(EA.isDataAlterable(dst));
      return {mnemonic:MnemonicCode.MOVE, size, src, dst};
    }
    case InstrCode.MOVE_EA_CCR_W: case InstrCode.MOVE_EA_SR_W: {
      const srcMode = bit_trio(opcode, 3);
      const srcReg = bit_trio(opcode, 0);
      const src = EA.create(srcMode, srcReg, getExtWord, size);
      assert(EA.isData(src));
      switch (instrCode) {
        case InstrCode.MOVE_EA_CCR_W: {
          return {mnemonic:MnemonicCode.MOVE, size:'W', src, dst:{type:'CCR'}};
        }
        case InstrCode.MOVE_EA_SR_W: {
          return {mnemonic:MnemonicCode.MOVE, size:'W', src, dst:{type:'SR'}};
        }
      }
      throw new Error('unreachable');
    }
    case InstrCode.MOVE_SR_EA_W: {
      const dstMode = bit_trio(opcode, 3);
      const dstReg = bit_trio(opcode, 0);
      const dst = EA.create(dstMode, dstReg, getExtWord, size);
      assert(EA.isDataAlterable(dst));
      return {mnemonic:MnemonicCode.MOVE, size:'W', src: {type:'SR'}, dst};
    }
    case InstrCode.MOVE_USP_An_L: {
      const reg = bit_trio(opcode, 0);
      return {mnemonic:MnemonicCode.MOVE, size:'L', src:{type:'USP'}, dst:{type:'An', reg, mode:'direct'}};
    }
    case InstrCode.MOVE_An_USP_L: {
      const reg = bit_trio(opcode, 0);
      return {mnemonic:MnemonicCode.MOVE, size:'L', src:{type:'An', reg, mode:'direct'}, dst:{type:'USP'}};
    }
    case InstrCode.MOVEA.W:
    case InstrCode.MOVEA.L: {
      assert(size === 'W' || size === 'L');
      const srcMode = bit_trio(opcode, 3);
      const srcReg = bit_trio(opcode, 0);
      const src = EA.create(srcMode, srcReg, getExtWord, size);
      const dst = An(bit_trio(opcode, 9));
      return {mnemonic:MnemonicCode.MOVEA, size, src, dst};
    }
    case InstrCode.MOVEQ: {
      const dst = Dn(bit_trio(opcode, 9));
      const imm = opcode << 24 >> 24;
      return {mnemonic:MnemonicCode.MOVEQ, size:'L', src:{type:'Imm', size:'B', value:imm}, dst};
    }
    case InstrCode.MOVEM_TO_REG.W:
    case InstrCode.MOVEM_TO_REG.L: {
      assert(size === 'W' || size === 'L');
      const srcMode = bit_trio(opcode, 3);
      const srcReg = bit_trio(opcode, 0);
      const regMask = getExtWord();
      const src = EA.create(srcMode, srcReg, getExtWord, null);
      assert(EA.isMovemToReg(src));
      return {mnemonic:MnemonicCode.MOVEM, size, src, dst:parseRegSet(regMask, false)};
    }
    case InstrCode.MOVEM_TO_MEM.W:
    case InstrCode.MOVEM_TO_MEM.L: {
      assert(size === 'W' || size === 'L');
      const regMask = getExtWord();
      const dstMode = bit_trio(opcode, 3);
      const dstReg = bit_trio(opcode, 0);
      const dst = EA.create(dstMode, dstReg, getExtWord, null);
      const reversed = dst.type === "An" && dst.mode === 'indirect-pre-dec';
      assert(EA.isMovemToMem(dst));
      return {
        mnemonic: MnemonicCode.MOVEM,
        size,
        src: parseRegSet(regMask, reversed),
        dst,
      };
    }
    case InstrCode.MOVEP_MEM_REG.W:
    case InstrCode.MOVEP_MEM_REG.L: {
      assert(size === 'W' || size === 'L');
      const srcReg = bit_trio(opcode, 0);
      const dst = Dn(bit_trio(opcode, 9));
      const disp = getExtWord() << 16 >> 16;
      return {
        mnemonic: MnemonicCode.MOVEP,
        size,
        src: {type:'An', reg:srcReg, mode:'indirect-displaced', disp},
        dst,
      };
    }
    case InstrCode.MOVEP_REG_MEM.W:
    case InstrCode.MOVEP_REG_MEM.L: {
      assert(size === 'W' || size === 'L');
      const dstReg = bit_trio(opcode, 0);
      const src = Dn(bit_trio(opcode, 9));
      const disp = getExtWord() << 16 >> 16;
      return {
        mnemonic: MnemonicCode.MOVEP,
        size,
        src,
        dst: {type:'An', reg:dstReg, mode:'indirect-displaced', disp},
      };
    }
    case InstrCode.ADD_EA_DN.B:
    case InstrCode.ADD_EA_DN.W:
    case InstrCode.ADD_EA_DN.L:
    case InstrCode.SUB_EA_DN.B:
    case InstrCode.SUB_EA_DN.W:
    case InstrCode.SUB_EA_DN.L:
    case InstrCode.CMP.B:
    case InstrCode.CMP.W:
    case InstrCode.CMP.L:
    case InstrCode.AND_EA_DN.B:
    case InstrCode.AND_EA_DN.W:
    case InstrCode.AND_EA_DN.L:
    case InstrCode.OR_EA_DN.B:
    case InstrCode.OR_EA_DN.W:
    case InstrCode.OR_EA_DN.L: {
      assert(size !== null);
      const srcMode = bit_trio(opcode, 3);
      const srcReg = bit_trio(opcode, 0);
      const src = EA.create(srcMode, srcReg, getExtWord, size);
      const dst = Dn(bit_trio(opcode, 9));
      return {
        mnemonic: mnemonic as any,
        size,
        src,
        dst,
      };
    }
    case InstrCode.CMPM.B:
    case InstrCode.CMPM.W:
    case InstrCode.CMPM.L: {
      assert(size !== null);
      const src = AnPostInc(bit_trio(opcode, 0));
      const dst = AnPostInc(bit_trio(opcode, 9));
      return {mnemonic: MnemonicCode.CMPM, size, src, dst};
    }
    case InstrCode.ADD_DN_EA.B:
    case InstrCode.ADD_DN_EA.W:
    case InstrCode.ADD_DN_EA.L:
    case InstrCode.SUB_DN_EA.B:
    case InstrCode.SUB_DN_EA.W:
    case InstrCode.SUB_DN_EA.L:
    case InstrCode.AND_DN_EA.B:
    case InstrCode.AND_DN_EA.W:
    case InstrCode.AND_DN_EA.L:
    case InstrCode.OR_DN_EA.B:
    case InstrCode.OR_DN_EA.W:
    case InstrCode.OR_DN_EA.L:
    case InstrCode.EOR.B:
    case InstrCode.EOR.W:
    case InstrCode.EOR.L: {
      assert(size !== null);
      const dstMode = bit_trio(opcode, 3);
      const dstReg = bit_trio(opcode, 0);
      const dst = EA.create(dstMode, dstReg, getExtWord, size);
      const src = Dn(bit_trio(opcode, 9));
      assert(EA.isDataAlterable(dst));
      return {
        mnemonic: mnemonic as any,
        size,
        src,
        dst,
      };
    }
    case InstrCode.ADDA.W:
    case InstrCode.ADDA.L:
    case InstrCode.SUBA.W:
    case InstrCode.SUBA.L:
    case InstrCode.CMPA.W:
    case InstrCode.CMPA.L: {
      assert(size === 'W' || size === 'L');
      const srcMode = bit_trio(opcode, 3);
      const srcReg = bit_trio(opcode, 0);
      const dst = An(bit_trio(opcode, 9));
      const src = EA.create(srcMode, srcReg, getExtWord, size);
      return {mnemonic:mnemonic as any, size, src, dst};
    }
    case InstrCode.ADDI.B:
    case InstrCode.ADDI.W:
    case InstrCode.ADDI.L:
    case InstrCode.SUBI.B:
    case InstrCode.SUBI.W:
    case InstrCode.SUBI.L:
    case InstrCode.CMPI.B:
    case InstrCode.CMPI.W:
    case InstrCode.CMPI.L:
    case InstrCode.ANDI_EA.B:
    case InstrCode.ANDI_EA.W:
    case InstrCode.ANDI_EA.L:
    case InstrCode.ORI_EA.B:
    case InstrCode.ORI_EA.W:
    case InstrCode.ORI_EA.L:
    case InstrCode.EORI_EA.B:
    case InstrCode.EORI_EA.W:
    case InstrCode.EORI_EA.L: {
      assert(size !== null);
      const dstMode = bit_trio(opcode, 3);
      const dstReg = bit_trio(opcode, 0);
      const src = EA.createImmediate(getExtWord, size);
      const dst = EA.create(dstMode, dstReg, getExtWord, null);
      assert(EA.isDataAlterable(dst));
      return {mnemonic:mnemonic as any, size, src, dst};
    }
    case InstrCode.ADDQ.B:
    case InstrCode.ADDQ.W:
    case InstrCode.ADDQ.L:
    case InstrCode.SUBQ.B:
    case InstrCode.SUBQ.W:
    case InstrCode.SUBQ.L: {
      assert(size !== null);
      const dstMode = bit_trio(opcode, 3);
      const dstReg = bit_trio(opcode, 0);
      const data = bit_trio(opcode, 9);
      const imm = data === 0 ? 8 : data;
      const dst = EA.create(dstMode, dstReg, getExtWord, null);
      assert(EA.isAlterable(dst));
      return {mnemonic:mnemonic as any, size, src:{type:'Imm', size:'B', value:imm}, dst};
    }
    case InstrCode.ADDX_REG.B:
    case InstrCode.ADDX_REG.W:
    case InstrCode.ADDX_REG.L:
    case InstrCode.SUBX_REG.B:
    case InstrCode.SUBX_REG.W:
    case InstrCode.SUBX_REG.L: {
      assert(size !== null);
      const src = Dn(bit_trio(opcode, 0));
      const dst = Dn(bit_trio(opcode, 9));
      return {mnemonic: mnemonic as any, size, src, dst};
    }
    case InstrCode.ADDX_MEM.B:
    case InstrCode.ADDX_MEM.W:
    case InstrCode.ADDX_MEM.L:
    case InstrCode.SUBX_MEM.B:
    case InstrCode.SUBX_MEM.W:
    case InstrCode.SUBX_MEM.L: {
      assert(size !== null);
      const src = AnPreDec(bit_trio(opcode, 0));
      const dst = AnPreDec(bit_trio(opcode, 9));
      return {mnemonic: mnemonic as any, size, src, dst};
    }
    case InstrCode.MULU:
    case InstrCode.MULS:
    case InstrCode.DIVU:
    case InstrCode.DIVS: {
      const srcMode = bit_trio(opcode, 3);
      const srcReg = bit_trio(opcode, 0);
      const src = EA.create(srcMode, srcReg, getExtWord, 'W');
      const dst = Dn(bit_trio(opcode, 9));
      assert(EA.isData(src));
      return {
        mnemonic: mnemonic as any,
        size: 'W',
        src,
        dst,
      };
    }
    case InstrCode.ANDI_CCR_B:
    case InstrCode.ORI_CCR_B:
    case InstrCode.EORI_CCR_B: {
      const src = EA.createImmediate(getExtWord, 'B');
      return {mnemonic:mnemonic as any, size:'B', src, dst:{type:'CCR'}};
    }
    case InstrCode.ANDI_SR_W:
    case InstrCode.ORI_SR_W:
    case InstrCode.EORI_SR_W: {
      const src = EA.createImmediate(getExtWord, 'W');
      return {mnemonic:mnemonic as any, size:'W', src, dst:{type:'SR'}};
    }
    case InstrCode.ABCD_REG:
    case InstrCode.SBCD_REG: {
      const src = Dn(bit_trio(opcode, 0));
      const dst = Dn(bit_trio(opcode, 9));
      return {mnemonic:mnemonic as any, src, dst};
    }
    case InstrCode.ABCD_MEM:
    case InstrCode.SBCD_MEM: {
      const src = AnPreDec(bit_trio(opcode, 0));
      const dst = AnPreDec(bit_trio(opcode, 9));
      return {mnemonic:mnemonic as any, src, dst};
    }
    case InstrCode.ASL_REG.B:
    case InstrCode.ASL_REG.W:
    case InstrCode.ASL_REG.L:
    case InstrCode.ASR_REG.B:
    case InstrCode.ASR_REG.W:
    case InstrCode.ASR_REG.L:
    case InstrCode.LSL_REG.B:
    case InstrCode.LSL_REG.W:
    case InstrCode.LSL_REG.L:
    case InstrCode.LSR_REG.B:
    case InstrCode.LSR_REG.W:
    case InstrCode.LSR_REG.L:
    case InstrCode.ROL_REG.B:
    case InstrCode.ROL_REG.W:
    case InstrCode.ROL_REG.L:
    case InstrCode.ROR_REG.B:
    case InstrCode.ROR_REG.W:
    case InstrCode.ROR_REG.L:
    case InstrCode.ROXL_REG.B:
    case InstrCode.ROXL_REG.W:
    case InstrCode.ROXL_REG.L:
    case InstrCode.ROXR_REG.B:
    case InstrCode.ROXR_REG.W:
    case InstrCode.ROXR_REG.L: {
      assert(size !== null);
      const dst = Dn(bit_trio(opcode, 0));
      const countOrReg = bit_trio(opcode, 9);
      const ir = (opcode >>> 5) & 1;
      if (ir) {
        const src = Dn(countOrReg);
        return {mnemonic:mnemonic as any, size, src, dst};
      } else {
        const imm = countOrReg === 0 ? 8 : countOrReg;
        return {mnemonic:mnemonic as any, size, src:{type:'Imm', size:'B', value:imm}, dst};
      }
    }
    case InstrCode.ASL_MEM.W:
    case InstrCode.ASR_MEM.W:
    case InstrCode.LSL_MEM.W:
    case InstrCode.LSR_MEM.W:
    case InstrCode.ROL_MEM.W:
    case InstrCode.ROR_MEM.W:
    case InstrCode.ROXL_MEM.W:
    case InstrCode.ROXR_MEM.W: {
      const dstMode = bit_trio(opcode, 3);
      const dstReg = bit_trio(opcode, 0);
      const dst = EA.create(dstMode, dstReg, getExtWord, null);
      assert(EA.isMemoryAlterable(dst));
      return {mnemonic:mnemonic as any, size:'W', dst};
    }
    case InstrCode.BTST_REG:
    case InstrCode.BCHG_REG:
    case InstrCode.BCLR_REG:
    case InstrCode.BSET_REG: {
      const src = Dn(bit_trio(opcode, 9));
      const dstMode = bit_trio(opcode, 3);
      const dstReg = bit_trio(opcode, 0);
      const dst = EA.create(dstMode, dstReg, getExtWord, null);
      assert(EA.isData(dst));
      return {mnemonic:mnemonic as any, src, dst};
    }
    // split out for different constraints on dst
    case InstrCode.BTST_IMM: {
      const dstMode = bit_trio(opcode, 3);
      const dstReg = bit_trio(opcode, 0);
      const src = EA.createImmediate(getExtWord, 'B');
      const dst = EA.create(dstMode, dstReg, getExtWord, null);
      assert(EA.isData(dst) && dst.type !== 'Imm');
      return {mnemonic:MnemonicCode.BTST, src, dst};
    }
    case InstrCode.BCHG_IMM:
    case InstrCode.BCLR_IMM:
    case InstrCode.BSET_IMM: {
      const dstMode = bit_trio(opcode, 3);
      const dstReg = bit_trio(opcode, 0);
      const src = EA.createImmediate(getExtWord, 'B');
      const dst = EA.create(dstMode, dstReg, getExtWord, null);
      assert(EA.isDataAlterable(dst));
      return {mnemonic:mnemonic as any, src, dst};
    }    
    case InstrCode.NEG.B:
    case InstrCode.NEG.W:
    case InstrCode.NEG.L:
    case InstrCode.NEGX.B:
    case InstrCode.NEGX.W:
    case InstrCode.NEGX.L:
    case InstrCode.NOT.B:
    case InstrCode.NOT.W:
    case InstrCode.NOT.L:
    case InstrCode.CLR.B:
    case InstrCode.CLR.W:
    case InstrCode.CLR.L:
    case InstrCode.TST.B:
    case InstrCode.TST.W:
    case InstrCode.TST.L: {
      assert(size !== null);
      const dstMode = bit_trio(opcode, 3);
      const dstReg = bit_trio(opcode, 0);
      const dst = EA.create(dstMode, dstReg, getExtWord, size);
      assert(EA.isData(dst));
      return {mnemonic:mnemonic as any, size, dst};
    }
    case InstrCode.EXT.W:
    case InstrCode.EXT.L: {
      assert(size === 'W' || size === 'L');
      const dst = Dn(bit_trio(opcode, 0));
      return {mnemonic:MnemonicCode.EXT, size, dst};
    }
    case InstrCode.NBCD: {
      const dstMode = bit_trio(opcode, 3);
      const dstReg = bit_trio(opcode, 0);
      const dst = EA.create(dstMode, dstReg, getExtWord, null);
      assert(EA.isDataAlterable(dst));
      return {mnemonic:MnemonicCode.NBCD, dst};
    }
    case InstrCode.TAS: {
      const dstMode = bit_trio(opcode, 3);
      const dstReg = bit_trio(opcode, 0);
      const dst = EA.create(dstMode, dstReg, getExtWord, null);
      assert(EA.isDataAlterable(dst));
      return {mnemonic:MnemonicCode.TAS, dst};
    }
    case InstrCode.SWAP: {
      const dst = Dn(bit_trio(opcode, 0));
      return {mnemonic:MnemonicCode.SWAP, dst};
    }
    case InstrCode.DBT:
    case InstrCode.DBF:
    case InstrCode.DBHI:
    case InstrCode.DBLS:
    case InstrCode.DBCC:
    case InstrCode.DBCS:
    case InstrCode.DBNE:
    case InstrCode.DBEQ:
    case InstrCode.DBVC:
    case InstrCode.DBVS:
    case InstrCode.DBPL:
    case InstrCode.DBMI:
    case InstrCode.DBGE:
    case InstrCode.DBLT:
    case InstrCode.DBGT:
    case InstrCode.DBLE: {
      const counter = Dn(bit_trio(opcode, 0));
      const disp = getExtWord() << 16 >> 16;
      return {
        mnemonic: mnemonic as any,
        counter,
        target: {type:'Disp', size:'W', value:disp},
      };
    }
    case InstrCode.ST:
    case InstrCode.SF:
    case InstrCode.SHI:
    case InstrCode.SLS:
    case InstrCode.SCC:
    case InstrCode.SCS:
    case InstrCode.SNE:
    case InstrCode.SEQ:
    case InstrCode.SVC:
    case InstrCode.SVS:
    case InstrCode.SPL:
    case InstrCode.SMI:
    case InstrCode.SGE:
    case InstrCode.SLT:
    case InstrCode.SGT:
    case InstrCode.SLE: {
      const dstMode = bit_trio(opcode, 3);
      const dstReg = bit_trio(opcode, 0);
      const dst = EA.create(dstMode, dstReg, getExtWord, null);
      assert(EA.isDataAlterable(dst));
      return {mnemonic:mnemonic as any, dst};
    }
    case InstrCode.BRA.B:
    case InstrCode.BSR.B:
    case InstrCode.BHI.B:
    case InstrCode.BLS.B:
    case InstrCode.BCC.B:
    case InstrCode.BCS.B:
    case InstrCode.BNE.B:
    case InstrCode.BEQ.B:
    case InstrCode.BVC.B:
    case InstrCode.BVS.B:
    case InstrCode.BPL.B:
    case InstrCode.BMI.B:
    case InstrCode.BGE.B:
    case InstrCode.BLT.B:
    case InstrCode.BGT.B:
    case InstrCode.BLE.B: {
      const disp = opcode << 24 >> 24;
      return {mnemonic:mnemonic as any, target:{type:'Disp', size:'B', value:disp}};
    }
    case InstrCode.BRA.W:
    case InstrCode.BSR.W:
    case InstrCode.BHI.W:
    case InstrCode.BLS.W:
    case InstrCode.BCC.W:
    case InstrCode.BCS.W:
    case InstrCode.BNE.W:
    case InstrCode.BEQ.W:
    case InstrCode.BVC.W:
    case InstrCode.BVS.W:
    case InstrCode.BPL.W:
    case InstrCode.BMI.W:
    case InstrCode.BGE.W:
    case InstrCode.BLT.W:
    case InstrCode.BGT.W:
    case InstrCode.BLE.W: {
      const disp = getExtWord() << 16 >> 16;
      return {mnemonic:mnemonic as any, target:{type:'Disp', size:'W', value:disp}};
    }
    case InstrCode.JMP:
    case InstrCode.JSR: {
      const targetMode = bit_trio(opcode, 3);
      const targetReg = bit_trio(opcode, 0);
      const target = EA.create(targetMode, targetReg, getExtWord, null);
      assert(EA.isControl(target));
      return {mnemonic:mnemonic as any, target};
    }
    case InstrCode.LINK: {
      const reg = An(bit_trio(opcode, 0));
      const disp = getExtWord() << 16 >> 16;
      return {mnemonic:MnemonicCode.LINK, reg, disp:{type:'Imm', size:'W', value:disp}};
    }
    case InstrCode.UNLK: {
      const reg = An(bit_trio(opcode, 0));
      return {mnemonic:MnemonicCode.UNLK, reg};
    }
    case InstrCode.PEA: {
      const srcMode = bit_trio(opcode, 3);
      const srcReg = bit_trio(opcode, 0);
      const src = EA.create(srcMode, srcReg, getExtWord, null);
      assert(EA.isControl(src));
      return {mnemonic:MnemonicCode.PEA, src};
    }
    case InstrCode.LEA: {
      const srcMode = bit_trio(opcode, 3);
      const srcReg = bit_trio(opcode, 0);
      const dst = An(bit_trio(opcode, 9));
      const src = EA.create(srcMode, srcReg, getExtWord, null);
      assert(EA.isControl(src));
      return {mnemonic:MnemonicCode.LEA, src, dst};
    }
    case InstrCode.EXG_DN_DN: {
      const lhsReg = bit_trio(opcode, 9);
      const rhsReg = bit_trio(opcode, 0);
      return {mnemonic:MnemonicCode.EXG, lhs:Dn(lhsReg), rhs:Dn(rhsReg)};
    }
    case InstrCode.EXG_AN_AN: {
      const lhs = An(bit_trio(opcode, 9));
      const rhs = An(bit_trio(opcode, 0));
      return {mnemonic:MnemonicCode.EXG, lhs, rhs};
    }
    case InstrCode.EXG_DN_AN: {
      const lhs = Dn(bit_trio(opcode, 9));
      const rhs = An(bit_trio(opcode, 0));
      return {mnemonic:MnemonicCode.EXG, lhs, rhs};
    }
    case InstrCode.TRAP: {
      const vector = opcode & 0xf;
      return {mnemonic:MnemonicCode.TRAP, vector};
    }
    case InstrCode.CHK: {
      const srcMode = bit_trio(opcode, 3);
      const srcReg = bit_trio(opcode, 0);
      const src = EA.create(srcMode, srcReg, getExtWord, 'W');
      const dst = Dn(bit_trio(opcode, 9));
      assert(EA.isData(src));
      return {mnemonic:MnemonicCode.CHK, src, dst};
    }
    case InstrCode.STOP: {
      const imm = getExtWord();
      return {mnemonic:MnemonicCode.STOP, imm:{type:'Imm', size:'W', value:imm}};
    }    
    case InstrCode.RTS:
    case InstrCode.RTR:
    case InstrCode.RTE:
    case InstrCode.NOP:
    case InstrCode.RESET:
    case InstrCode.TRAPV:
    case InstrCode.ILLEGAL: {
      return {mnemonic:mnemonic as any};
    }
    default: return null;
  }
};

export const stringifyInstruction = (i: Instruction): string => {
  let ops: string[];
  switch (i.mnemonic) {
    case MnemonicCode.MOVE:
    case MnemonicCode.MOVEA:
    case MnemonicCode.MOVEQ:
    case MnemonicCode.MOVEP:
    case MnemonicCode.MOVEM:
    case MnemonicCode.ADD:
    case MnemonicCode.ADDA:
    case MnemonicCode.ADDI:
    case MnemonicCode.ADDQ:
    case MnemonicCode.ADDX:
    case MnemonicCode.SUB:
    case MnemonicCode.SUBA:
    case MnemonicCode.SUBI:
    case MnemonicCode.SUBQ:
    case MnemonicCode.SUBX:
    case MnemonicCode.CMP:
    case MnemonicCode.CMPA:
    case MnemonicCode.CMPI:
    case MnemonicCode.CMPM:
    case MnemonicCode.MULU:
    case MnemonicCode.MULS:
    case MnemonicCode.DIVU:
    case MnemonicCode.DIVS:
    case MnemonicCode.AND:
    case MnemonicCode.ANDI:
    case MnemonicCode.OR:
    case MnemonicCode.ORI:
    case MnemonicCode.EOR:
    case MnemonicCode.EORI:
    case MnemonicCode.ABCD:
    case MnemonicCode.SBCD:
    case MnemonicCode.CHK:
    case MnemonicCode.LEA:
    case MnemonicCode.BTST:
    case MnemonicCode.BCHG:
    case MnemonicCode.BCLR:
    case MnemonicCode.BSET: {
      ops = [Operand.stringify(i.src), Operand.stringify(i.dst)];
      break;
    }

    case MnemonicCode.ASL:
    case MnemonicCode.ASR:
    case MnemonicCode.LSL:
    case MnemonicCode.LSR:
    case MnemonicCode.ROL:
    case MnemonicCode.ROR:
    case MnemonicCode.ROXL:
    case MnemonicCode.ROXR: {
      if (('src' in i) && i.src != null) {
        ops = [Operand.stringify(i.src), Operand.stringify(i.dst)];
      } else {
        ops = [Operand.stringify(i.dst)];
      }
      break;
    }

    case MnemonicCode.EXG: {
      ops = [Operand.stringify(i.lhs), Operand.stringify(i.rhs)];
      break;
    }

    case MnemonicCode.NEG:
    case MnemonicCode.NEGX:
    case MnemonicCode.NOT:
    case MnemonicCode.CLR:
    case MnemonicCode.TST:
    case MnemonicCode.EXT:
    case MnemonicCode.NBCD:
    case MnemonicCode.TAS:
    case MnemonicCode.SWAP:
    case MnemonicCode.ST:
    case MnemonicCode.SF:
    case MnemonicCode.SHI:
    case MnemonicCode.SLS:
    case MnemonicCode.SCC:
    case MnemonicCode.SCS:
    case MnemonicCode.SNE:
    case MnemonicCode.SEQ:
    case MnemonicCode.SVC:
    case MnemonicCode.SVS:
    case MnemonicCode.SPL:
    case MnemonicCode.SMI:
    case MnemonicCode.SGE:
    case MnemonicCode.SLT:
    case MnemonicCode.SGT:
    case MnemonicCode.SLE: {
      ops = [Operand.stringify(i.dst)];
      break;
    }

    case MnemonicCode.PEA: {
      ops = [Operand.stringify(i.src)];
      break;
    }

    case MnemonicCode.BRA:
    case MnemonicCode.BSR:
    case MnemonicCode.BHI:
    case MnemonicCode.BLS:
    case MnemonicCode.BCC:
    case MnemonicCode.BCS:
    case MnemonicCode.BNE:
    case MnemonicCode.BEQ:
    case MnemonicCode.BVC:
    case MnemonicCode.BVS:
    case MnemonicCode.BPL:
    case MnemonicCode.BMI:
    case MnemonicCode.BGE:
    case MnemonicCode.BLT:
    case MnemonicCode.BGT:
    case MnemonicCode.BLE:
    case MnemonicCode.JMP:
    case MnemonicCode.JSR: {
      ops = [Operand.stringify(i.target)];
      break;
    }

    case MnemonicCode.DBT:
    case MnemonicCode.DBF:
    case MnemonicCode.DBHI:
    case MnemonicCode.DBLS:
    case MnemonicCode.DBCC:
    case MnemonicCode.DBCS:
    case MnemonicCode.DBNE:
    case MnemonicCode.DBEQ:
    case MnemonicCode.DBVC:
    case MnemonicCode.DBVS:
    case MnemonicCode.DBPL:
    case MnemonicCode.DBMI:
    case MnemonicCode.DBGE:
    case MnemonicCode.DBLT:
    case MnemonicCode.DBGT:
    case MnemonicCode.DBLE: {
      ops = [Operand.stringify(i.counter), Operand.stringify(i.target)];
      break;
    }

    case MnemonicCode.LINK: {
      ops = [Operand.stringify(i.reg), Operand.stringify(i.disp)];
      break;
    }

    case MnemonicCode.UNLK: {
      ops = [Operand.stringify(i.reg)];
      break;
    }

    case MnemonicCode.TRAP: {
      ops = [`#${i.vector}`];
      break;
    }

    case MnemonicCode.STOP: {
      ops = [Operand.stringify(i.imm)];
      break;
    }

    case MnemonicCode.RTS:
    case MnemonicCode.RTR:
    case MnemonicCode.RTE:
    case MnemonicCode.NOP:
    case MnemonicCode.RESET:
    case MnemonicCode.TRAPV:
    case MnemonicCode.ILLEGAL: {
      ops = [];
      break;
    }

    default:
      throw new Error('unknown mnemonic');
  }
  const { size } = (i as {size?: 'B' | 'W' | 'L' | null});
  return `${MnemonicCode[i.mnemonic] ?? '???'}${size ? `.${size}` : ''}${ops ? ' '+ops.join(',') : ''}`;
};

export type { Instruction };
