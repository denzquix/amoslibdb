import type MnemonicCode from "../mnemonic.js";
import type { EffectiveAddress, Operand } from "./operand.js";

export type DataMovement = MOVE | MOVEA | MOVEQ | MOVEM | MOVEP;

export namespace MOVE {
  export type EA_EA = {mnemonic: MnemonicCode.MOVE, size:'B'|'W'|'L', src:EffectiveAddress, dst:EffectiveAddress.DataAlterable};
  export type EA_CCR = {mnemonic: MnemonicCode.MOVE, size:'W', src:EffectiveAddress.Data, dst:Operand.CCR};
  export type SR_EA = {mnemonic: MnemonicCode.MOVE, size:'W', src:Operand.SR, dst:EffectiveAddress.DataAlterable};
  export type EA_SR = {mnemonic: MnemonicCode.MOVE, size:'W', src:EffectiveAddress.Data, dst:Operand.SR};
  export type An_USP = {mnemonic: MnemonicCode.MOVE, size:'L', src:EffectiveAddress.An, dst:Operand.USP};
  export type USP_An = {mnemonic: MnemonicCode.MOVE, size:'L', src:Operand.USP, dst:EffectiveAddress.An};
}
export type MOVE = (
  | MOVE.EA_EA
  | MOVE.EA_CCR
  | MOVE.SR_EA
  | MOVE.EA_SR
  | MOVE.An_USP
  | MOVE.USP_An
);

export type MOVEA = {mnemonic: MnemonicCode.MOVEA, size:'W'|'L', src:EffectiveAddress, dst:EffectiveAddress.An};
export type MOVEQ = {mnemonic: MnemonicCode.MOVEQ, size:'L', src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.Dn};

export namespace MOVEM {
  export type TO_MEM = {mnemonic: MnemonicCode.MOVEM, size:'W'|'L', src:Operand.RegSet, dst:EffectiveAddress.MovemToMem};
  export type TO_REG = {mnemonic: MnemonicCode.MOVEM, size:'W'|'L', src:EffectiveAddress.MovemToReg, dst:Operand.RegSet};
}
export type MOVEM = MOVEM.TO_MEM | MOVEM.TO_REG;

export namespace MOVEP {
  export type Dn_AnDisp = {mnemonic: MnemonicCode.MOVEP, size:'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.AnI_Displaced};
  export type AnDisp_Dn = {mnemonic: MnemonicCode.MOVEP, size:'W'|'L', src:EffectiveAddress.AnI_Displaced, dst:EffectiveAddress.Dn};
}
export type MOVEP = MOVEP.Dn_AnDisp | MOVEP.AnDisp_Dn;

// Arithmetic
export type Arithmetic = (
  | ADD | ADDA | ADDI | ADDQ | ADDX
  | SUB | SUBA | SUBI | SUBQ | SUBX
  | CMP | CMPA | CMPI | CMPM
  | MULU | MULS | DIVU | DIVS
  | NEG | NEGX | CLR | TST | EXT
);
export namespace ADD {
  export type EA_Dn = {mnemonic: MnemonicCode.ADD, size:'B'|'W'|'L', src:EffectiveAddress, dst:EffectiveAddress.Dn};
  export type Dn_EA = {mnemonic: MnemonicCode.ADD, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.MemoryAlterable};
}
export type ADD = ADD.EA_Dn | ADD.Dn_EA;

export type ADDA = {mnemonic: MnemonicCode.ADDA, size:'W'|'L', src:EffectiveAddress, dst:EffectiveAddress.An};
export type ADDI = {mnemonic: MnemonicCode.ADDI, size:'B'|'W'|'L', src:EffectiveAddress.Imm, dst:EffectiveAddress.DataAlterable};
export type ADDQ = {mnemonic: MnemonicCode.ADDQ, size:'B'|'W'|'L', src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.Alterable};

export namespace ADDX {
  export type Dn_Dn = {mnemonic: MnemonicCode.ADDX, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.Dn};
  export type AnPD_AnPD = {mnemonic: MnemonicCode.ADDX, size:'B'|'W'|'L', src:EffectiveAddress.AnI_PreDec, dst:EffectiveAddress.AnI_PreDec};
}
export type ADDX = ADDX.Dn_Dn | ADDX.AnPD_AnPD;

export namespace SUB {
  export type EA_Dn = {mnemonic: MnemonicCode.SUB, size:'B'|'W'|'L', src:EffectiveAddress, dst:EffectiveAddress.Dn};
  export type Dn_EA = {mnemonic: MnemonicCode.SUB, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.MemoryAlterable};
}
export type SUB = SUB.EA_Dn | SUB.Dn_EA;

export type SUBA = {mnemonic: MnemonicCode.SUBA, size:'W'|'L', src:EffectiveAddress, dst:EffectiveAddress.An};
export type SUBI = {mnemonic: MnemonicCode.SUBI, size:'B'|'W'|'L', src:EffectiveAddress.Imm, dst:EffectiveAddress.DataAlterable};
export type SUBQ = {mnemonic: MnemonicCode.SUBQ, size:'B'|'W'|'L', src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.Alterable};

export namespace SUBX {
  export type Dn_Dn = {mnemonic: MnemonicCode.SUBX, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.Dn};
  export type AnPD_AnPD = {mnemonic: MnemonicCode.SUBX, size:'B'|'W'|'L', src:EffectiveAddress.AnI_PreDec, dst:EffectiveAddress.AnI_PreDec};
}
export type SUBX = SUBX.Dn_Dn | SUBX.AnPD_AnPD;

export type CMP = {mnemonic: MnemonicCode.CMP, size:'B'|'W'|'L', src:EffectiveAddress, dst:EffectiveAddress.Dn};
export type CMPA = {mnemonic: MnemonicCode.CMPA, size:'W'|'L', src:EffectiveAddress, dst:EffectiveAddress.An};

  // 68000: DataAlterable only; 68010+: Data (allows PC-relative)
export type CMPI = {mnemonic: MnemonicCode.CMPI, size:'B'|'W'|'L', src:EffectiveAddress.Imm, dst:EffectiveAddress.Data};

export type CMPM = {mnemonic: MnemonicCode.CMPM, size:'B'|'W'|'L', src:EffectiveAddress.AnI_PostInc, dst:EffectiveAddress.AnI_PostInc};
export type MULU = {mnemonic: MnemonicCode.MULU, size:'W', src:EffectiveAddress.Data, dst:EffectiveAddress.Dn};
export type MULS = {mnemonic: MnemonicCode.MULS, size:'W', src:EffectiveAddress.Data, dst:EffectiveAddress.Dn};
export type DIVU = {mnemonic: MnemonicCode.DIVU, size:'W', src:EffectiveAddress.Data, dst:EffectiveAddress.Dn};
export type DIVS = {mnemonic: MnemonicCode.DIVS, size:'W', src:EffectiveAddress.Data, dst:EffectiveAddress.Dn};
export type NEG = {mnemonic: MnemonicCode.NEG, size:'B'|'W'|'L', dst:EffectiveAddress.DataAlterable};
export type NEGX = {mnemonic: MnemonicCode.NEGX, size:'B'|'W'|'L', dst:EffectiveAddress.DataAlterable};
export type CLR = {mnemonic: MnemonicCode.CLR, size:'B'|'W'|'L', dst:EffectiveAddress.DataAlterable};

// 68000: DataAlterable only; 68010+: Data (allows PC-relative and immediate)
export type TST = {mnemonic: MnemonicCode.TST, size:'B'|'W'|'L', dst:EffectiveAddress.Data};

export type EXT = {mnemonic: MnemonicCode.EXT, size:'W'|'L', dst:EffectiveAddress.Dn};

// Logical
export type Logical = AND | ANDI | OR | ORI | EOR | EORI | NOT;
export namespace AND {
  export type EA_Dn = {mnemonic: MnemonicCode.AND, size:'B'|'W'|'L', src:EffectiveAddress.Data, dst:EffectiveAddress.Dn};
  export type Dn_EA = {mnemonic: MnemonicCode.AND, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.MemoryAlterable};
}
export type AND = AND.EA_Dn | AND.Dn_EA;

export namespace ANDI {
  export type Imm_EA = {mnemonic: MnemonicCode.ANDI, size:'B'|'W'|'L', src:EffectiveAddress.Imm, dst:EffectiveAddress.DataAlterable};
  export type Imm_CCR = {mnemonic: MnemonicCode.ANDI, size:'B', src:EffectiveAddress.Imm<'B'>, dst:Operand.CCR};
  export type Imm_SR = {mnemonic: MnemonicCode.ANDI, size:'W', src:EffectiveAddress.Imm<'W'>, dst:Operand.SR};
}
export type ANDI = ANDI.Imm_EA | ANDI.Imm_CCR | ANDI.Imm_SR;

export namespace OR {
  export type EA_Dn = {mnemonic: MnemonicCode.OR, size:'B'|'W'|'L', src:EffectiveAddress.Data, dst:EffectiveAddress.Dn};
  export type Dn_EA = {mnemonic: MnemonicCode.OR, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.MemoryAlterable};
}
export type OR = OR.EA_Dn | OR.Dn_EA;

export namespace ORI {
  export type Imm_EA = {mnemonic: MnemonicCode.ORI, size:'B'|'W'|'L', src:EffectiveAddress.Imm, dst:EffectiveAddress.DataAlterable};
  export type Imm_CCR = {mnemonic: MnemonicCode.ORI, size:'B', src:EffectiveAddress.Imm<'B'>, dst:Operand.CCR};
  export type Imm_SR = {mnemonic: MnemonicCode.ORI, size:'W', src:EffectiveAddress.Imm<'W'>, dst:Operand.SR};
}
export type ORI = ORI.Imm_EA | ORI.Imm_CCR | ORI.Imm_SR;

export type EOR = {mnemonic: MnemonicCode.EOR, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.DataAlterable};

export namespace EORI {
  export type Imm_EA = {mnemonic: MnemonicCode.EORI, size:'B'|'W'|'L', src:EffectiveAddress.Imm, dst:EffectiveAddress.DataAlterable};
  export type Imm_CCR = {mnemonic: MnemonicCode.EORI, size:'B', src:EffectiveAddress.Imm<'B'>, dst:Operand.CCR};
  export type Imm_SR = {mnemonic: MnemonicCode.EORI, size:'W', src:EffectiveAddress.Imm<'W'>, dst:Operand.SR};
}
export type EORI = EORI.Imm_EA | EORI.Imm_CCR | EORI.Imm_SR;

export type NOT = {mnemonic: MnemonicCode.NOT, size:'B'|'W'|'L', dst:EffectiveAddress.DataAlterable};

// Shifts and Rotates
export type ShiftRotate = ASL | ASR | LSL | LSR | ROL | ROR | ROXL | ROXR;
export namespace ASL {
  export type Imm_Dn = {mnemonic: MnemonicCode.ASL, size:'B'|'W'|'L', src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.Dn};
  export type Dn_Dn = {mnemonic: MnemonicCode.ASL, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.Dn};
  export type Mem = {mnemonic: MnemonicCode.ASL, size:'W', dst:EffectiveAddress.MemoryAlterable};
}
export type ASL = ASL.Imm_Dn | ASL.Dn_Dn | ASL.Mem;

export namespace ASR {
  export type Imm_Dn = {mnemonic: MnemonicCode.ASR, size:'B'|'W'|'L', src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.Dn};
  export type Dn_Dn = {mnemonic: MnemonicCode.ASR, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.Dn};
  export type Mem = {mnemonic: MnemonicCode.ASR, size:'W', dst:EffectiveAddress.MemoryAlterable};
}
export type ASR = ASR.Imm_Dn | ASR.Dn_Dn | ASR.Mem;

export namespace LSL {
  export type Imm_Dn = {mnemonic: MnemonicCode.LSL, size:'B'|'W'|'L', src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.Dn};
  export type Dn_Dn = {mnemonic: MnemonicCode.LSL, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.Dn};
  export type Mem = {mnemonic: MnemonicCode.LSL, size:'W', dst:EffectiveAddress.MemoryAlterable};
}
export type LSL = LSL.Imm_Dn | LSL.Dn_Dn | LSL.Mem;

export namespace LSR {
  export type Imm_Dn = {mnemonic: MnemonicCode.LSR, size:'B'|'W'|'L', src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.Dn};
  export type Dn_Dn = {mnemonic: MnemonicCode.LSR, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.Dn};
  export type Mem = {mnemonic: MnemonicCode.LSR, size:'W', dst:EffectiveAddress.MemoryAlterable};
}
export type LSR = LSR.Imm_Dn | LSR.Dn_Dn | LSR.Mem;

export namespace ROL {
  export type Imm_Dn = {mnemonic: MnemonicCode.ROL, size:'B'|'W'|'L', src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.Dn};
  export type Dn_Dn = {mnemonic: MnemonicCode.ROL, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.Dn};
  export type Mem = {mnemonic: MnemonicCode.ROL, size:'W', dst:EffectiveAddress.MemoryAlterable};
}
export type ROL = ROL.Imm_Dn | ROL.Dn_Dn | ROL.Mem;

export namespace ROR {
  export type Imm_Dn = {mnemonic: MnemonicCode.ROR, size:'B'|'W'|'L', src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.Dn};
  export type Dn_Dn = {mnemonic: MnemonicCode.ROR, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.Dn};
  export type Mem = {mnemonic: MnemonicCode.ROR, size:'W', dst:EffectiveAddress.MemoryAlterable};
}
export type ROR = ROR.Imm_Dn | ROR.Dn_Dn | ROR.Mem;

export namespace ROXL {
  export type Imm_Dn = {mnemonic: MnemonicCode.ROXL, size:'B'|'W'|'L', src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.Dn};
  export type Dn_Dn = {mnemonic: MnemonicCode.ROXL, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.Dn};
  export type Mem = {mnemonic: MnemonicCode.ROXL, size:'W', dst:EffectiveAddress.MemoryAlterable};
}
export type ROXL = ROXL.Imm_Dn | ROXL.Dn_Dn | ROXL.Mem;

export namespace ROXR {
  export type Imm_Dn = {mnemonic: MnemonicCode.ROXR, size:'B'|'W'|'L', src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.Dn};
  export type Dn_Dn = {mnemonic: MnemonicCode.ROXR, size:'B'|'W'|'L', src:EffectiveAddress.Dn, dst:EffectiveAddress.Dn};
  export type Mem = {mnemonic: MnemonicCode.ROXR, size:'W', dst:EffectiveAddress.MemoryAlterable};
}
export type ROXR = ROXR.Imm_Dn | ROXR.Dn_Dn | ROXR.Mem;

// Bit Manipulation
export type BitManipulation = BTST | BCHG | BCLR | BSET;
export namespace BTST {
  export type Dn_EA = {mnemonic: MnemonicCode.BTST, src:EffectiveAddress.Dn, dst:EffectiveAddress.Data};
  export type Imm_EA = {mnemonic: MnemonicCode.BTST, src:EffectiveAddress.Imm<'B'>, dst:Exclude<EffectiveAddress.Data, EffectiveAddress.Imm>};
}
export type BTST = BTST.Dn_EA | BTST.Imm_EA;

export namespace BCHG {
  export type Dn_EA = {mnemonic: MnemonicCode.BCHG, src:EffectiveAddress.Dn, dst:EffectiveAddress.DataAlterable};
  export type Imm_EA = {mnemonic: MnemonicCode.BCHG, src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.DataAlterable};
}
export type BCHG = BCHG.Dn_EA | BCHG.Imm_EA;

export namespace BCLR {
  export type Dn_EA = {mnemonic: MnemonicCode.BCLR, src:EffectiveAddress.Dn, dst:EffectiveAddress.DataAlterable};
  export type Imm_EA = {mnemonic: MnemonicCode.BCLR, src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.DataAlterable};
}
export type BCLR = BCLR.Dn_EA | BCLR.Imm_EA;

export namespace BSET {
  export type Dn_EA = {mnemonic: MnemonicCode.BSET, src:EffectiveAddress.Dn, dst:EffectiveAddress.DataAlterable};
  export type Imm_EA = {mnemonic: MnemonicCode.BSET, src:EffectiveAddress.Imm<'B'>, dst:EffectiveAddress.DataAlterable};
}
export type BSET = BSET.Dn_EA | BSET.Imm_EA;

// BCD
export type BinaryCodedDecimal = ABCD | SBCD | NBCD;
export namespace ABCD {
  export type Dn_Dn = {mnemonic: MnemonicCode.ABCD, src:EffectiveAddress.Dn, dst:EffectiveAddress.Dn};
  export type AnPD_AnPD = {mnemonic: MnemonicCode.ABCD, src:EffectiveAddress.AnI_PreDec, dst:EffectiveAddress.AnI_PreDec};
}
export type ABCD = ABCD.Dn_Dn | ABCD.AnPD_AnPD;

export namespace SBCD {
  export type Dn_Dn = {mnemonic: MnemonicCode.SBCD, src:EffectiveAddress.Dn, dst:EffectiveAddress.Dn};
  export type AnPD_AnPD = {mnemonic: MnemonicCode.SBCD, src:EffectiveAddress.AnI_PreDec, dst:EffectiveAddress.AnI_PreDec};
}
export type SBCD = SBCD.Dn_Dn | SBCD.AnPD_AnPD;

export type NBCD = {mnemonic: MnemonicCode.NBCD, dst:EffectiveAddress.DataAlterable};

// Branching/Program Control
export type Branch = BRA | BSR | BCC | BCS | BEQ | BNE | BHI | BLS | BPL | BMI | BVC | BVS | BGE | BLT | BGT | BLE
export type BRA = {mnemonic: MnemonicCode.BRA, target:Operand.Displacement};
export type BSR = {mnemonic: MnemonicCode.BSR, target:Operand.Displacement};
export type BCC = {mnemonic: MnemonicCode.BCC, target:Operand.Displacement};
export type BCS = {mnemonic: MnemonicCode.BCS, target:Operand.Displacement};
export type BEQ = {mnemonic: MnemonicCode.BEQ, target:Operand.Displacement};
export type BNE = {mnemonic: MnemonicCode.BNE, target:Operand.Displacement};
export type BHI = {mnemonic: MnemonicCode.BHI, target:Operand.Displacement};
export type BLS = {mnemonic: MnemonicCode.BLS, target:Operand.Displacement};
export type BPL = {mnemonic: MnemonicCode.BPL, target:Operand.Displacement};
export type BMI = {mnemonic: MnemonicCode.BMI, target:Operand.Displacement};
export type BVC = {mnemonic: MnemonicCode.BVC, target:Operand.Displacement};
export type BVS = {mnemonic: MnemonicCode.BVS, target:Operand.Displacement};
export type BGE = {mnemonic: MnemonicCode.BGE, target:Operand.Displacement};
export type BLT = {mnemonic: MnemonicCode.BLT, target:Operand.Displacement};
export type BGT = {mnemonic: MnemonicCode.BGT, target:Operand.Displacement};
export type BLE = {mnemonic: MnemonicCode.BLE, target:Operand.Displacement};

export type Jump = JMP | JSR;
export type JMP = {mnemonic: MnemonicCode.JMP, target:EffectiveAddress.Control};
export type JSR = {mnemonic: MnemonicCode.JSR, target:EffectiveAddress.Control};

export type Return = RTS | RTR | RTE;
export type RTS = {mnemonic: MnemonicCode.RTS};
export type RTR = {mnemonic: MnemonicCode.RTR};
export type RTE = {mnemonic: MnemonicCode.RTE};  

// DBcc and Scc
export type DBcc = DBT | DBF | DBCC | DBCS | DBEQ | DBNE | DBHI | DBLS | DBPL | DBMI | DBVC | DBVS | DBGE | DBLT | DBGT | DBLE;
export type DBT = {mnemonic: MnemonicCode.DBT, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBF = {mnemonic: MnemonicCode.DBF, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBCC = {mnemonic: MnemonicCode.DBCC, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBCS = {mnemonic: MnemonicCode.DBCS, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBEQ = {mnemonic: MnemonicCode.DBEQ, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBNE = {mnemonic: MnemonicCode.DBNE, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBHI = {mnemonic: MnemonicCode.DBHI, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBLS = {mnemonic: MnemonicCode.DBLS, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBPL = {mnemonic: MnemonicCode.DBPL, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBMI = {mnemonic: MnemonicCode.DBMI, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBVC = {mnemonic: MnemonicCode.DBVC, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBVS = {mnemonic: MnemonicCode.DBVS, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBGE = {mnemonic: MnemonicCode.DBGE, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBLT = {mnemonic: MnemonicCode.DBLT, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBGT = {mnemonic: MnemonicCode.DBGT, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};
export type DBLE = {mnemonic: MnemonicCode.DBLE, counter:EffectiveAddress.Dn, target:Operand.Displacement<'W'>};

export type Scc = ST | SF | SCC | SCS | SEQ | SNE | SHI | SLS | SPL | SMI | SVC | SVS | SGE | SLT | SGT | SLE;
export type ST = {mnemonic: MnemonicCode.ST, dst:EffectiveAddress.DataAlterable};
export type SF = {mnemonic: MnemonicCode.SF, dst:EffectiveAddress.DataAlterable};
export type SCC = {mnemonic: MnemonicCode.SCC, dst:EffectiveAddress.DataAlterable};
export type SCS = {mnemonic: MnemonicCode.SCS, dst:EffectiveAddress.DataAlterable};
export type SEQ = {mnemonic: MnemonicCode.SEQ, dst:EffectiveAddress.DataAlterable};
export type SNE = {mnemonic: MnemonicCode.SNE, dst:EffectiveAddress.DataAlterable};
export type SHI = {mnemonic: MnemonicCode.SHI, dst:EffectiveAddress.DataAlterable};
export type SLS = {mnemonic: MnemonicCode.SLS, dst:EffectiveAddress.DataAlterable};
export type SPL = {mnemonic: MnemonicCode.SPL, dst:EffectiveAddress.DataAlterable};
export type SMI = {mnemonic: MnemonicCode.SMI, dst:EffectiveAddress.DataAlterable};
export type SVC = {mnemonic: MnemonicCode.SVC, dst:EffectiveAddress.DataAlterable};
export type SVS = {mnemonic: MnemonicCode.SVS, dst:EffectiveAddress.DataAlterable};
export type SGE = {mnemonic: MnemonicCode.SGE, dst:EffectiveAddress.DataAlterable};
export type SLT = {mnemonic: MnemonicCode.SLT, dst:EffectiveAddress.DataAlterable};
export type SGT = {mnemonic: MnemonicCode.SGT, dst:EffectiveAddress.DataAlterable};
export type SLE = {mnemonic: MnemonicCode.SLE, dst:EffectiveAddress.DataAlterable};

// Stack/Link
export type StackLink = LINK | UNLK | PEA;
export type LINK = {mnemonic: MnemonicCode.LINK, reg:EffectiveAddress.An, disp:EffectiveAddress.Imm<'W'>};
export type UNLK = {mnemonic: MnemonicCode.UNLK, reg:EffectiveAddress.An};
export type PEA = {mnemonic: MnemonicCode.PEA, src:EffectiveAddress.Control};

// Miscellaneous Data
export type MiscellaneousData = LEA | EXG | SWAP | TAS;
export type LEA = {mnemonic: MnemonicCode.LEA, src:EffectiveAddress.Control, dst:EffectiveAddress.An};
export type EXG = (
  | {mnemonic: MnemonicCode.EXG, lhs:EffectiveAddress.Dn | EffectiveAddress.An, rhs:EffectiveAddress.An}
  | {mnemonic: MnemonicCode.EXG, lhs:EffectiveAddress.Dn, rhs:EffectiveAddress.Dn}
);
export type SWAP = {mnemonic: MnemonicCode.SWAP, dst:EffectiveAddress.Dn};
export type TAS = {mnemonic: MnemonicCode.TAS, dst:EffectiveAddress.DataAlterable};

// Trap/Exception
export type TrapException = TRAP | TRAPV | CHK | ILLEGAL;
export type TRAP = {mnemonic: MnemonicCode.TRAP, vector:number};
export type TRAPV = {mnemonic: MnemonicCode.TRAPV};
export type CHK = {mnemonic: MnemonicCode.CHK, src:EffectiveAddress.Data, dst:EffectiveAddress.Dn};
export type ILLEGAL = {mnemonic: MnemonicCode.ILLEGAL};

// System Control
export type SystemControl = RESET | NOP | STOP;
export type RESET = {mnemonic: MnemonicCode.RESET};
export type NOP = {mnemonic: MnemonicCode.NOP};
export type STOP = {mnemonic: MnemonicCode.STOP, imm:EffectiveAddress.Imm<'W'>}; 

export type Instruction = (
  | DataMovement
  | Arithmetic
  | Logical
  | BitManipulation
  | ShiftRotate
  | BinaryCodedDecimal
  | Branch
  | Jump
  | Return
  | DBcc
  | Scc
  | StackLink
  | MiscellaneousData
  | TrapException
  | SystemControl
);
