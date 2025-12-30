import type { bit_trio } from "../util.js";

export namespace EffectiveAddress {
  type reg_number = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  type Index = {type:'An' | 'Dn', reg:reg_number, size:'W' | 'L'};

  export type Dn = {type:'Dn', reg:reg_number, mode:'direct'};
  export type An = {type:'An', reg:reg_number, mode:'direct'};
  export type AnI = {type:'An', reg:reg_number, mode:'indirect'};
  export type AnI_PostInc = {type:'An', reg:reg_number, mode:'indirect-post-inc'};
  export type AnI_PreDec = {type:'An', reg:reg_number, mode:'indirect-pre-dec'};
  export type AnI_Displaced = {type:'An', reg:reg_number, mode:'indirect-displaced', disp:number};
  export type AnI_Indexed = {type:'An', reg:reg_number, mode:'indirect-indexed', disp:number, index:Index};
  export type PC_Displaced = {type:'PC', mode:'indirect-displaced', disp:number};
  export type PC_Indexed = {type:'PC', mode:'indirect-indexed', disp:number, index:Index};
  export type Abs = {type:'Abs', size:'W' | 'L', value:number};
  export type Imm<TSize extends 'B' | 'W' | 'L' = 'B' | 'W' | 'L'> = {type:'Imm', size:TSize, value:number};

  // Composite building blocks
  export type RegDirect = Dn | An;
  export type AnIndirect = AnI | AnI_PostInc | AnI_PreDec | AnI_Displaced | AnI_Indexed;
  export type PCRelative = PC_Displaced | PC_Indexed;
  export type AutoModify = AnI_PostInc | AnI_PreDec;

  // Fundamental categories (per Motorola PRM)
  export type Memory = AnIndirect | PCRelative | Abs;
  export type Control = Exclude<Memory, AutoModify>;
  export type Alterable = RegDirect | AnIndirect | Abs;
  export type MemoryAlterable = Exclude<Memory, PCRelative>;
  export type Data = Dn | Memory | Imm;
  export type DataAlterable = Exclude<Data, PCRelative | Imm>;

  export const isRegDirect = (ea: EffectiveAddress): ea is RegDirect => (ea.type === "Dn" || ea.type === "An") && ea.mode === "direct";
  export const isAnIndirect = (ea: EffectiveAddress): ea is AnIndirect => ea.type === "An" && (
    ea.mode === 'indirect' || ea.mode === 'indirect-displaced' || ea.mode === 'indirect-indexed' || ea.mode === 'indirect-post-inc' || ea.mode === 'indirect-pre-dec'
  );
  export const isPCRelative = (ea: EffectiveAddress): ea is PCRelative => ea.type === "PC";
  export const isAutoModify = (ea: EffectiveAddress): ea is AutoModify => ea.type === "An" && (ea.mode === "indirect-post-inc" || ea.mode == "indirect-pre-dec");

  export const isMemory = (ea: EffectiveAddress): ea is Memory => isAnIndirect(ea) || isPCRelative(ea) || ea.type === "Abs";
  export const isControl = (ea: EffectiveAddress): ea is Control => isMemory(ea) && !isAutoModify(ea);
  export const isAlterable = (ea: EffectiveAddress): ea is Alterable => isRegDirect(ea) || isAnIndirect(ea) || ea.type === "Abs";
  export const isMemoryAlterable = (ea: EffectiveAddress): ea is MemoryAlterable => isMemory(ea) && !isPCRelative(ea);
  export const isData = (ea: EffectiveAddress): ea is Data => (ea.type === "Dn" && ea.mode === "direct") || isMemory(ea) || ea.type === "Imm";
  export const isDataAlterable = (ea:EffectiveAddress): ea is DataAlterable => isData(ea) && !isPCRelative(ea) && ea.type !== 'Imm';

  // Instruction-specific (only where they differ from fundamental categories)
  export type MovemToMem = Exclude<MemoryAlterable, AnI_PostInc>;
  export type MovemToReg = Control | AnI_PostInc;

  export const isMovemToMem = (ea: EffectiveAddress): ea is MovemToMem => isMemoryAlterable(ea) && !(ea.type === "An" && ea.mode === "indirect-post-inc");
  export const isMovemToReg = (ea: EffectiveAddress): ea is MovemToReg => isControl(ea) || (ea.type === "An" && ea.mode === "indirect-post-inc");

  const parseIndex = (ext: number): Index => {
    const reg = ((ext >>> 12) & 0x7) as reg_number;
    const type = (ext & 0x8000) ? 'An' : 'Dn';
    const size = (ext & 0x0800) ? 'L' : 'W';
    return {reg, type, size};
  };

  export const create = (m: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, reg: reg_number, getExtWord: () => number, immSize: 'B' | 'W' | 'L' | null): EffectiveAddress => {
    switch (m) {
      case 0: return {type:'Dn', reg, mode:'direct'};
      case 1: return {type:'An', reg, mode:'direct'};
      case 2: return {type:'An', reg, mode:'indirect'};
      case 3: return {type:'An', reg, mode:'indirect-post-inc'};
      case 4: return {type:'An', reg, mode:'indirect-pre-dec'};
      case 5: return {type:'An', reg, mode:'indirect-displaced', disp:getExtWord() << 16 >> 16};
      case 6:
        const ext = getExtWord();
        return {type:'An', reg, mode:'indirect-indexed', disp:ext << 24 >> 24, index:parseIndex(ext)};
      case 7:
        switch (reg) {
          case 0: return {type:'Abs', size:'W', value:getExtWord() << 16 >> 16};
          case 1: {
            const hi = getExtWord();
            const lo = getExtWord();
            return {type:'Abs', size:'L', value:(hi << 16) | lo};
          }
          case 2: return {type:'PC', mode:'indirect-displaced', disp:getExtWord() << 16 >> 16};
          case 3: {
            const ext = getExtWord();
            return {type:'PC', mode:'indirect-indexed', disp:ext << 24 >> 24, index:parseIndex(ext)};
          }
          case 4: {
            switch (immSize) {
              case 'L': {
                const hi = getExtWord();
                const lo = getExtWord();
                return {type:'Imm', value:(hi << 16) | lo, size:immSize};
              }
              case 'W': {
                return {type:'Imm', value:getExtWord(), size:immSize};
              }
              case 'B': {
                return {type:'Imm', value:getExtWord() << 24 >> 24, size:immSize};
              }
              case null: {
                throw new Error('Invalid immediate size');
              }
            }
          }
        }
    }
    throw new Error('invalid EA');
  }

  export const createImmediate = <TSize extends "B" | "W" | "L">(getExtWord: () => number, immSize: TSize) => {
    return create(7, 4, getExtWord, immSize) as EffectiveAddress.Imm<TSize>;
  }

}
export type EffectiveAddress = (
  | EffectiveAddress.Dn
  | EffectiveAddress.An
  | EffectiveAddress.AnI
  | EffectiveAddress.AnI_PostInc
  | EffectiveAddress.AnI_PreDec
  | EffectiveAddress.AnI_Displaced
  | EffectiveAddress.AnI_Indexed
  | EffectiveAddress.PC_Displaced
  | EffectiveAddress.PC_Indexed
  | EffectiveAddress.Abs
  | EffectiveAddress.Imm
);

export namespace Operand {
  export type CCR = {type:'CCR'};
  export type SR = {type:'SR'};
  export type USP = {type:'USP'};
  export type RegSet = {type:'RegSet', regs: Set<`${'A' | 'D'}${bit_trio}`>};
  export type Displacement<TSize extends 'B'|'W' = 'B'|'W'> = {type:'Disp', size:TSize, value:number};
}

export type Operand = (
  | EffectiveAddress
  | Operand.CCR
  | Operand.SR
  | Operand.USP
  | Operand.RegSet
  | Operand.Displacement
);

export const parseRegSet = (mask: number, reversed: boolean): Operand.RegSet => {
  const regs = new Set<`${'A'|'D'}${bit_trio}`>();
  for (let i = 0; i < 16; i++) {
    const bit = reversed ? (0x80 >>> i) : (1 << i);
    if (mask & bit) {
      regs.add((i < 8) ? `D${i as bit_trio}` : `A${(i - 8) as bit_trio}`);
    }
  }
  return {type:'RegSet', regs};
};
