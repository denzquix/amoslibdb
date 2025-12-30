import MnemonicCode from "../mnemonic.js";
import { Size } from "../util.js";
import IC from "./define.js";

// MOVE variants
export namespace MOVE_EA_EA {
  export const B = IC(MnemonicCode.MOVE, Size.BYTE, 0, 0);  // EA extensions vary
  export const W = IC(MnemonicCode.MOVE, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.MOVE, Size.LONG, 0, 0);
}
export const MOVE_EA_CCR_W = IC(MnemonicCode.MOVE, Size.WORD, 0, 1);
export const MOVE_SR_EA_W = IC(MnemonicCode.MOVE, Size.WORD, 0, 2);
export const MOVE_EA_SR_W = IC(MnemonicCode.MOVE, Size.WORD, 0, 3);
export const MOVE_USP_An_L = IC(MnemonicCode.MOVE, Size.LONG, 0, 1);
export const MOVE_An_USP_L = IC(MnemonicCode.MOVE, Size.LONG, 0, 2);

export namespace MOVEA {
  export const W = IC(MnemonicCode.MOVEA, Size.WORD);
  export const L = IC(MnemonicCode.MOVEA, Size.LONG);
}

export const MOVEQ = IC(MnemonicCode.MOVEQ, Size.LONG);  // immediate embedded in opcode

// +EA extensions
export namespace MOVEM_TO_MEM {
  export const W = IC(MnemonicCode.MOVEM, Size.WORD, 1, 0); 
  export const L = IC(MnemonicCode.MOVEM, Size.LONG, 1, 0);
}
export namespace MOVEM_TO_REG {
  export const W = IC(MnemonicCode.MOVEM, Size.WORD, 1, 1);
  export const L = IC(MnemonicCode.MOVEM, Size.LONG, 1, 1);
}

export namespace MOVEP_REG_MEM {
  export const W = IC(MnemonicCode.MOVEP, Size.WORD, 1, 0);
  export const L = IC(MnemonicCode.MOVEP, Size.LONG, 1, 0);

}
export namespace MOVEP_MEM_REG {
  export const W = IC(MnemonicCode.MOVEP, Size.WORD, 1, 1);
  export const L = IC(MnemonicCode.MOVEP, Size.LONG, 1, 1);
}

// Immediate ALU ops
export namespace ORI_EA {
  export const B = IC(MnemonicCode.ORI, Size.BYTE, 1, 0);
  export const W = IC(MnemonicCode.ORI, Size.WORD, 1, 0);
  export const L = IC(MnemonicCode.ORI, Size.LONG, 2);
}
export const ORI_CCR_B = IC(MnemonicCode.ORI, Size.BYTE, 1, 1);
export const ORI_SR_W = IC(MnemonicCode.ORI, Size.WORD, 1, 1);

export namespace ANDI_EA {
  export const B = IC(MnemonicCode.ANDI, Size.BYTE, 1, 0);
  export const W = IC(MnemonicCode.ANDI, Size.WORD, 1, 0);
  export const L = IC(MnemonicCode.ANDI, Size.LONG, 2);
}
export const ANDI_CCR_B = IC(MnemonicCode.ANDI, Size.BYTE, 1, 1);
export const ANDI_SR_W = IC(MnemonicCode.ANDI, Size.WORD, 1, 1);

export namespace EORI_EA {
  export const B = IC(MnemonicCode.EORI, Size.BYTE, 1, 0);
  export const W = IC(MnemonicCode.EORI, Size.WORD, 1, 0);
  export const L = IC(MnemonicCode.EORI, Size.LONG, 2);
}
export const EORI_CCR_B = IC(MnemonicCode.EORI, Size.BYTE, 1, 1);
export const EORI_SR_W = IC(MnemonicCode.EORI, Size.WORD, 1, 1);

export namespace SUBI {
  export const B = IC(MnemonicCode.SUBI, Size.BYTE, 1);
  export const W = IC(MnemonicCode.SUBI, Size.WORD, 1);
  export const L = IC(MnemonicCode.SUBI, Size.LONG, 2);
}

export namespace ADDI {
  export const B = IC(MnemonicCode.ADDI, Size.BYTE, 1);
  export const W = IC(MnemonicCode.ADDI, Size.WORD, 1);
  export const L = IC(MnemonicCode.ADDI, Size.LONG, 2);
}

export namespace CMPI {
  export const B = IC(MnemonicCode.CMPI, Size.BYTE, 1);
  export const W = IC(MnemonicCode.CMPI, Size.WORD, 1);
  export const L = IC(MnemonicCode.CMPI, Size.LONG, 2);
}

// Bit operations
export const BTST_IMM = IC(MnemonicCode.BTST, Size.NONE, 1);  // +EA extensions
export const BTST_REG = IC(MnemonicCode.BTST, Size.NONE, 0);  // +EA extensions
export const BCHG_IMM = IC(MnemonicCode.BCHG, Size.NONE, 1);
export const BCHG_REG = IC(MnemonicCode.BCHG, Size.NONE, 0);
export const BCLR_IMM = IC(MnemonicCode.BCLR, Size.NONE, 1);
export const BCLR_REG = IC(MnemonicCode.BCLR, Size.NONE, 0);
export const BSET_IMM = IC(MnemonicCode.BSET, Size.NONE, 1);
export const BSET_REG = IC(MnemonicCode.BSET, Size.NONE, 0);

// Quick operations
export namespace ADDQ {
  export const B = IC(MnemonicCode.ADDQ, Size.BYTE);
  export const W = IC(MnemonicCode.ADDQ, Size.WORD);
  export const L = IC(MnemonicCode.ADDQ, Size.LONG);
}

export namespace SUBQ {
  export const B = IC(MnemonicCode.SUBQ, Size.BYTE);
  export const W = IC(MnemonicCode.SUBQ, Size.WORD);
  export const L = IC(MnemonicCode.SUBQ, Size.LONG);
}

// Branches
export namespace BRA {
  export const B = IC(MnemonicCode.BRA, Size.BYTE, 0);  // 8-bit displacement in opcode
  export const W = IC(MnemonicCode.BRA, Size.WORD, 1);  // 16-bit displacement extension
}

export namespace BSR {
  export const B = IC(MnemonicCode.BSR, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BSR, Size.WORD, 1);
}

export namespace BHI {
  export const B = IC(MnemonicCode.BHI, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BHI, Size.WORD, 1);
}

export namespace BLS {
  export const B = IC(MnemonicCode.BLS, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BLS, Size.WORD, 1);
}

export namespace BCC {
  export const B = IC(MnemonicCode.BCC, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BCC, Size.WORD, 1);
}

export namespace BCS {
  export const B = IC(MnemonicCode.BCS, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BCS, Size.WORD, 1);
}

export namespace BNE {
  export const B = IC(MnemonicCode.BNE, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BNE, Size.WORD, 1);
}

export namespace BEQ {
  export const B = IC(MnemonicCode.BEQ, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BEQ, Size.WORD, 1);
}

export namespace BVC {
  export const B = IC(MnemonicCode.BVC, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BVC, Size.WORD, 1);
}

export namespace BVS {
  export const B = IC(MnemonicCode.BVS, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BVS, Size.WORD, 1);
}

export namespace BPL {
  export const B = IC(MnemonicCode.BPL, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BPL, Size.WORD, 1);
}

export namespace BMI {
  export const B = IC(MnemonicCode.BMI, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BMI, Size.WORD, 1);
}

export namespace BGE {
  export const B = IC(MnemonicCode.BGE, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BGE, Size.WORD, 1);
}

export namespace BLT {
  export const B = IC(MnemonicCode.BLT, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BLT, Size.WORD, 1);
}

export namespace BGT {
  export const B = IC(MnemonicCode.BGT, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BGT, Size.WORD, 1);
}

export namespace BLE {
  export const B = IC(MnemonicCode.BLE, Size.BYTE, 0);
  export const W = IC(MnemonicCode.BLE, Size.WORD, 1);
}

// Scc
export const ST = IC(MnemonicCode.ST, Size.BYTE);
export const SF = IC(MnemonicCode.SF, Size.BYTE);
export const SHI = IC(MnemonicCode.SHI, Size.BYTE);
export const SLS = IC(MnemonicCode.SLS, Size.BYTE);
export const SCC = IC(MnemonicCode.SCC, Size.BYTE);
export const SCS = IC(MnemonicCode.SCS, Size.BYTE);
export const SNE = IC(MnemonicCode.SNE, Size.BYTE);
export const SEQ = IC(MnemonicCode.SEQ, Size.BYTE);
export const SVC = IC(MnemonicCode.SVC, Size.BYTE);
export const SVS = IC(MnemonicCode.SVS, Size.BYTE);
export const SPL = IC(MnemonicCode.SPL, Size.BYTE);
export const SMI = IC(MnemonicCode.SMI, Size.BYTE);
export const SGE = IC(MnemonicCode.SGE, Size.BYTE);
export const SLT = IC(MnemonicCode.SLT, Size.BYTE);
export const SGT = IC(MnemonicCode.SGT, Size.BYTE);
export const SLE = IC(MnemonicCode.SLE, Size.BYTE);

// DBcc
export const DBT = IC(MnemonicCode.DBT, Size.WORD, 1);
export const DBF = IC(MnemonicCode.DBF, Size.WORD, 1);
export const DBHI = IC(MnemonicCode.DBHI, Size.WORD, 1);
export const DBLS = IC(MnemonicCode.DBLS, Size.WORD, 1);
export const DBCC = IC(MnemonicCode.DBCC, Size.WORD, 1);
export const DBCS = IC(MnemonicCode.DBCS, Size.WORD, 1);
export const DBNE = IC(MnemonicCode.DBNE, Size.WORD, 1);
export const DBEQ = IC(MnemonicCode.DBEQ, Size.WORD, 1);
export const DBVC = IC(MnemonicCode.DBVC, Size.WORD, 1);
export const DBVS = IC(MnemonicCode.DBVS, Size.WORD, 1);
export const DBPL = IC(MnemonicCode.DBPL, Size.WORD, 1);
export const DBMI = IC(MnemonicCode.DBMI, Size.WORD, 1);
export const DBGE = IC(MnemonicCode.DBGE, Size.WORD, 1);
export const DBLT = IC(MnemonicCode.DBLT, Size.WORD, 1);
export const DBGT = IC(MnemonicCode.DBGT, Size.WORD, 1);
export const DBLE = IC(MnemonicCode.DBLE, Size.WORD, 1);

// Shifts/rotates - register form (no extensions) vs memory form (EA extensions)
export namespace ASL_REG {
  export const B = IC(MnemonicCode.ASL, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.ASL, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.ASL, Size.LONG, 0, 0);
}
export namespace ASL_MEM {
  export const W = IC(MnemonicCode.ASL, Size.WORD, 0, 1);
}

export namespace ASR_REG {
  export const B = IC(MnemonicCode.ASR, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.ASR, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.ASR, Size.LONG, 0, 0);
}
export namespace ASR_MEM {
  export const W = IC(MnemonicCode.ASR, Size.WORD, 0, 1);
}

export namespace LSL_REG {
  export const B = IC(MnemonicCode.LSL, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.LSL, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.LSL, Size.LONG, 0, 0);
}
export namespace LSL_MEM {
  export const W = IC(MnemonicCode.LSL, Size.WORD, 0, 1);
}

export namespace LSR_REG {
  export const B = IC(MnemonicCode.LSR, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.LSR, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.LSR, Size.LONG, 0, 0);
}
export namespace LSR_MEM {
  export const W = IC(MnemonicCode.LSR, Size.WORD, 0, 1);
}

export namespace ROL_REG {
  export const B = IC(MnemonicCode.ROL, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.ROL, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.ROL, Size.LONG, 0, 0);
}
export namespace ROL_MEM {
  export const W = IC(MnemonicCode.ROL, Size.WORD, 0, 1);
}

export namespace ROR_REG {
  export const B = IC(MnemonicCode.ROR, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.ROR, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.ROR, Size.LONG, 0, 0);
}
export namespace ROR_MEM {
  export const W = IC(MnemonicCode.ROR, Size.WORD, 0, 1);
}

export namespace ROXL_REG {
  export const B = IC(MnemonicCode.ROXL, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.ROXL, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.ROXL, Size.LONG, 0, 0);
}
export namespace ROXL_MEM {
  export const W = IC(MnemonicCode.ROXL, Size.WORD, 0, 1);
}

export namespace ROXR_REG {
  export const B = IC(MnemonicCode.ROXR, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.ROXR, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.ROXR, Size.LONG, 0, 0);
}
export namespace ROXR_MEM {
  export const W = IC(MnemonicCode.ROXR, Size.WORD, 0, 1);
}

// Arithmetic
export namespace ADD_EA_DN {
  export const B = IC(MnemonicCode.ADD, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.ADD, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.ADD, Size.LONG, 0, 0);
}
export namespace ADD_DN_EA {
  export const B = IC(MnemonicCode.ADD, Size.BYTE, 0, 1);
  export const W = IC(MnemonicCode.ADD, Size.WORD, 0, 1);
  export const L = IC(MnemonicCode.ADD, Size.LONG, 0, 1);
}

export namespace ADDA {
  export const W = IC(MnemonicCode.ADDA, Size.WORD);
  export const L = IC(MnemonicCode.ADDA, Size.LONG);
}

export namespace ADDX_REG {
  export const B = IC(MnemonicCode.ADDX, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.ADDX, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.ADDX, Size.LONG, 0, 0);
}
export namespace ADDX_MEM {
  export const B = IC(MnemonicCode.ADDX, Size.BYTE, 0, 1);
  export const W = IC(MnemonicCode.ADDX, Size.WORD, 0, 1);
  export const L = IC(MnemonicCode.ADDX, Size.LONG, 0, 1);
}

export namespace SUB_EA_DN {
  export const B = IC(MnemonicCode.SUB, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.SUB, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.SUB, Size.LONG, 0, 0);
}
export namespace SUB_DN_EA {
  export const B = IC(MnemonicCode.SUB, Size.BYTE, 0, 1);
  export const W = IC(MnemonicCode.SUB, Size.WORD, 0, 1);
  export const L = IC(MnemonicCode.SUB, Size.LONG, 0, 1);
}

export namespace SUBA {
  export const W = IC(MnemonicCode.SUBA, Size.WORD);
  export const L = IC(MnemonicCode.SUBA, Size.LONG);
}

export namespace SUBX_REG {
  export const B = IC(MnemonicCode.SUBX, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.SUBX, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.SUBX, Size.LONG, 0, 0);
}
export namespace SUBX_MEM {
  export const B = IC(MnemonicCode.SUBX, Size.BYTE, 0, 1);
  export const W = IC(MnemonicCode.SUBX, Size.WORD, 0, 1);
  export const L = IC(MnemonicCode.SUBX, Size.LONG, 0, 1);
}


export namespace CMP {
  export const B = IC(MnemonicCode.CMP, Size.BYTE);
  export const W = IC(MnemonicCode.CMP, Size.WORD);
  export const L = IC(MnemonicCode.CMP, Size.LONG);
}

export namespace CMPA {
  export const W = IC(MnemonicCode.CMPA, Size.WORD);
  export const L = IC(MnemonicCode.CMPA, Size.LONG);
}

export namespace CMPM {
  export const B = IC(MnemonicCode.CMPM, Size.BYTE);
  export const W = IC(MnemonicCode.CMPM, Size.WORD);
  export const L = IC(MnemonicCode.CMPM, Size.LONG);
}

export const MULU = IC(MnemonicCode.MULU, Size.WORD);
export const MULS = IC(MnemonicCode.MULS, Size.WORD);
export const DIVU = IC(MnemonicCode.DIVU, Size.WORD);
export const DIVS = IC(MnemonicCode.DIVS, Size.WORD);

// Logical
export namespace AND_EA_DN {
  export const B = IC(MnemonicCode.AND, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.AND, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.AND, Size.LONG, 0, 0);
}
export namespace AND_DN_EA {
  export const B = IC(MnemonicCode.AND, Size.BYTE, 0, 1);
  export const W = IC(MnemonicCode.AND, Size.WORD, 0, 1);
  export const L = IC(MnemonicCode.AND, Size.LONG, 0, 1);
}

export namespace OR_EA_DN {
  export const B = IC(MnemonicCode.OR, Size.BYTE, 0, 0);
  export const W = IC(MnemonicCode.OR, Size.WORD, 0, 0);
  export const L = IC(MnemonicCode.OR, Size.LONG, 0, 0);

}
export namespace OR_DN_EA {
  export const B = IC(MnemonicCode.OR, Size.BYTE, 0, 1);
  export const W = IC(MnemonicCode.OR, Size.WORD, 0, 1);
  export const L = IC(MnemonicCode.OR, Size.LONG, 0, 1);
}

export namespace EOR {
  export const B = IC(MnemonicCode.EOR, Size.BYTE);
  export const W = IC(MnemonicCode.EOR, Size.WORD);
  export const L = IC(MnemonicCode.EOR, Size.LONG);
}

export namespace NOT {
  export const B = IC(MnemonicCode.NOT, Size.BYTE);
  export const W = IC(MnemonicCode.NOT, Size.WORD);
  export const L = IC(MnemonicCode.NOT, Size.LONG);
}

// BCD
export const ABCD_REG = IC(MnemonicCode.ABCD, Size.BYTE, 0, 0);
export const ABCD_MEM = IC(MnemonicCode.ABCD, Size.BYTE, 0, 1);

export const SBCD_REG = IC(MnemonicCode.SBCD, Size.BYTE, 0, 0);
export const SBCD_MEM = IC(MnemonicCode.SBCD, Size.BYTE, 0, 1);

export const NBCD = IC(MnemonicCode.NBCD, Size.BYTE);

// Unary
export namespace NEG {
  export const B = IC(MnemonicCode.NEG, Size.BYTE);
  export const W = IC(MnemonicCode.NEG, Size.WORD);
  export const L = IC(MnemonicCode.NEG, Size.LONG);
}

export namespace NEGX {
  export const B = IC(MnemonicCode.NEGX, Size.BYTE);
  export const W = IC(MnemonicCode.NEGX, Size.WORD);
  export const L = IC(MnemonicCode.NEGX, Size.LONG);
}

export namespace CLR {
  export const B = IC(MnemonicCode.CLR, Size.BYTE);
  export const W = IC(MnemonicCode.CLR, Size.WORD);
  export const L = IC(MnemonicCode.CLR, Size.LONG);
}

export namespace TST {
  export const B = IC(MnemonicCode.TST, Size.BYTE);
  export const W = IC(MnemonicCode.TST, Size.WORD);
  export const L = IC(MnemonicCode.TST, Size.LONG);
}

export const TAS = IC(MnemonicCode.TAS, Size.BYTE);

export namespace EXT {
  export const W = IC(MnemonicCode.EXT, Size.WORD);
  export const L = IC(MnemonicCode.EXT, Size.LONG);
}

export const SWAP = IC(MnemonicCode.SWAP, Size.WORD);

// Control
export const JMP = IC(MnemonicCode.JMP);
export const JSR = IC(MnemonicCode.JSR);
export const LEA = IC(MnemonicCode.LEA, Size.LONG);
export const PEA = IC(MnemonicCode.PEA, Size.LONG);
export const CHK = IC(MnemonicCode.CHK, Size.WORD);

export const EXG_DN_DN = IC(MnemonicCode.EXG, Size.LONG, 0, 0);
export const EXG_AN_AN = IC(MnemonicCode.EXG, Size.LONG, 0, 1);
export const EXG_DN_AN = IC(MnemonicCode.EXG, Size.LONG, 0, 2);

export const LINK = IC(MnemonicCode.LINK, Size.NONE, 1);
export const UNLK = IC(MnemonicCode.UNLK);

export const TRAP = IC(MnemonicCode.TRAP);
export const TRAPV = IC(MnemonicCode.TRAPV);

export const RTE = IC(MnemonicCode.RTE);
export const RTS = IC(MnemonicCode.RTS);
export const RTR = IC(MnemonicCode.RTR);

export const NOP = IC(MnemonicCode.NOP);
export const RESET = IC(MnemonicCode.RESET);
export const STOP = IC(MnemonicCode.STOP, Size.NONE, 1);
export const ILLEGAL = IC(MnemonicCode.ILLEGAL);
