
type M68KSize = "b" | "w" | "l" | null;

type M68KIndexReg = {
  kind: "d" | "a";
  reg: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  size: "w" | "l";
  scale: 1 | 2 | 4 | 8; // 68020+ uses more; 68000 treats as 1
};

type M68KEA =
  | { kind: "Dn"; reg: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 }
  | { kind: "An"; reg: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 }
  | { kind: "(An)"; reg: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 }
  | { kind: "(An)+"; reg: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 }
  | { kind: "-(An)"; reg: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 }
  | { kind: "(d16,An)"; reg: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; disp: number }
  | { kind: "(d8,An,Xn)"; reg: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; disp: number; index: M68KIndexReg }
  | { kind: "(d16,PC)"; disp: number }
  | { kind: "(d8,PC,Xn)"; disp: number; index: M68KIndexReg }
  | { kind: "abs.w"; addr: number }
  | { kind: "abs.l"; addr: number }
  | { kind: "#imm"; size: Exclude<M68KSize, null>; value: number };

type M68KOperand =
  | { kind: "ea"; ea: M68KEA }
  | { kind: "imm"; size: Exclude<M68KSize, null>; value: number }
  | { kind: "reglist"; mask: number; order: "DnAn" | "AnDn" } // MOVEM
  | { kind: "cond"; cc: string }
  | { kind: "branch"; disp: number; target: number }
  | { kind: "trap"; vector: number }
  | { kind: "sr" }
  | { kind: "ccr" }
  | { kind: "usp" };

export function ea(op: M68KOperand): M68KEA {
  if (op.kind === 'ea') return op.ea;
  throw new Error('not an ea');
}

export function num(op: M68KOperand): number {
  switch (op.kind) {
    case 'imm': {
      return op.value;
    }
    case 'ea': {
      switch (op.ea.kind) {
        case '#imm': {
          return op.ea.value;
        }
      }
      break;
    }
  }
  throw new Error('not a number op: ' + JSON.stringify(op));
}

export type M68KInstruction = {
  opcode: number;
  mnemonic: string;
  size: M68KSize;
  operands: M68KOperand[];
  words: number[];     // 16-bit words consumed (including extensions)
  raw: Uint8Array;     // slice of bytes [offset, offset+length)
  text: string;        // best-effort disassembly
  meta?: { unknown?: boolean, special?: 'USP' | 'SR' | 'CCR' } | undefined;
};

export function readUnconditionalExecution(bytes: Uint8Array, offset: number, max = Infinity) {
  const startOffset = offset;
  while (offset < bytes.length) {
    const ins = parseM68KInstruction(bytes, offset);
    offset += ins.raw.length;
    if (/^(?:JMP|BRA|RTS|RTR|RTE)$/.test(ins.mnemonic) || ins.meta?.unknown) {
      break;
    }
  }
  return bytes.subarray(startOffset, offset);
}

export function allInstrs(bytes: Uint8Array) {
  const buf: string[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    const instr = parseM68KInstruction(bytes, offset);
    buf.push('_' + offset.toString(16) + ': ' + instr.text);
    offset += instr.raw.length;
  }
  return buf;
}

export function parseM68KInstruction(bytes: Uint8Array, offset: number): M68KInstruction {
  const start = offset;

  function u8(at: number): number {
    if (at < 0 || at >= bytes.length) return 0;
    return bytes[at]! & 0xff;
  }
  function u16(at: number): number {
    return ((u8(at) << 8) | u8(at + 1)) >>> 0;
  }
  function u32(at: number): number {
    return (((u16(at) << 16) | u16(at + 2)) >>> 0);
  }
  function s8(x: number): number {
    x &= 0xff;
    return (x & 0x80) ? x - 0x100 : x;
  }
  function s16(x: number): number {
    x &= 0xffff;
    return (x & 0x8000) ? x - 0x10000 : x;
  }
  function s32(x: number): number {
    x >>>= 0;
    return (x & 0x80000000) ? (x - 0x100000000) : x;
  }
  function hex(n: number, digits: number): string {
    const s = (n >>> 0).toString(16).toUpperCase();
    return "0x" + s.padStart(digits, "0");
  }

  const words: number[] = [];
  function readWord(): number {
    const w = u16(offset);
    words.push(w);
    offset += 2;
    return w;
  }
  function readLong(): number {
    const hi = readWord();
    const lo = readWord();
    return ((hi << 16) | lo) >>> 0;
  }

  const opcode = readWord();

  const Dn = (r: number): M68KEA => ({ kind: "Dn", reg: (r & 7) as any });
  const An = (r: number): M68KEA => ({ kind: "An", reg: (r & 7) as any });

  function sizeFrom2bits(x: number): Exclude<M68KSize, null> {
    switch (x & 3) {
      case 0: return "b";
      case 1: return "w";
      default: return "l";
    }
  }
  function sizeFromMoveBits(x: number): Exclude<M68KSize, null> {
    // MOVE encodes size as: 01=byte, 11=word, 10=long (in bits 13..12)
    switch (x & 3) {
      case 1: return "b";
      case 3: return "w";
      case 2: return "l";
      default: return "w";
    }
  }
  function immByteWordLong(sz: Exclude<M68KSize, null>): number {
    if (sz === "b") {
      const w = readWord();
      return w & 0xff;
    }
    if (sz === "w") return s16(readWord());
    return s32(readLong());
  }

  function formatIndex(ext: number): { index: M68KIndexReg; disp: number } {
    // 68000 brief extension word:
    // bit15: 0=Dn, 1=An
    // bits14-12: reg
    // bit11: size 0=w, 1=l
    // bits10-9: scale (68020+). 68000 treats as 1; we still decode.
    // bits7-0: displacement (signed 8)
    const isA = (ext >>> 15) & 1;
    const reg = ((ext >>> 12) & 7) as any;
    const size = ((ext >>> 11) & 1) ? "l" : "w";
    const scBits = (ext >>> 9) & 3;
    const scale = ([1, 2, 4, 8] as const)[scBits]!;
    const disp = s8(ext & 0xff);
    return {
      index: { kind: isA ? "a" : "d", reg, size, scale },
      disp,
    };
  }

  function decodeEA(mode: number, reg: number, szForImm: Exclude<M68KSize, null> | null): M68KEA {
    mode &= 7; reg &= 7;

    // mode/reg is the 6-bit EA field: mode=bits5..3, reg=bits2..0
    switch (mode) {
      case 0: return { kind: "Dn", reg: reg as any };
      case 1: return { kind: "An", reg: reg as any };
      case 2: return { kind: "(An)", reg: reg as any };
      case 3: return { kind: "(An)+", reg: reg as any };
      case 4: return { kind: "-(An)", reg: reg as any };
      case 5: {
        const disp = s16(readWord());
        return { kind: "(d16,An)", reg: reg as any, disp };
      }
      case 6: {
        const ext = readWord();
        const { index, disp } = formatIndex(ext);
        return { kind: "(d8,An,Xn)", reg: reg as any, disp, index };
      }
      case 7: {
        switch (reg) {
          case 0: { // abs.w
            const addr = u16(offset);
            const w = readWord();
            return { kind: "abs.w", addr: w & 0xffff };
          }
          case 1: { // abs.l
            const addr = readLong();
            return { kind: "abs.l", addr };
          }
          case 2: { // (d16,PC)
            const disp = s16(readWord());
            return { kind: "(d16,PC)", disp };
          }
          case 3: { // (d8,PC,Xn)
            const ext = readWord();
            const { index, disp } = formatIndex(ext);
            return { kind: "(d8,PC,Xn)", disp, index };
          }
          case 4: { // immediate
            const sz = szForImm ?? "w";
            const value = immByteWordLong(sz);
            return { kind: "#imm", size: sz, value };
          }
          default:
            return { kind: "abs.w", addr: 0 };
        }
      }
      default:
        return { kind: "abs.w", addr: 0 };
    }
  }

  function eaToText(ea: M68KEA): string {
    switch (ea.kind) {
      case "Dn": return `D${ea.reg}`;
      case "An": return `A${ea.reg}`;
      case "(An)": return `(A${ea.reg})`;
      case "(An)+": return `(A${ea.reg})+`;
      case "-(An)": return `-(A${ea.reg})`;
      case "(d16,An)": return `${ea.disp}(A${ea.reg})`;
      case "(d8,An,Xn)":
        return `${ea.disp}(A${ea.reg},${ea.index.kind.toUpperCase()}${ea.index.reg}.${ea.index.size})`;
      case "abs.w": return `${hex(ea.addr & 0xffff, 4)}.W`;
      case "abs.l": return `${hex(ea.addr >>> 0, 8)}.L`;
      case "(d16,PC)": return `${ea.disp}(PC)`;
      case "(d8,PC,Xn)":
        return `${ea.disp}(PC,${ea.index.kind.toUpperCase()}${ea.index.reg}.${ea.index.size})`;
      case "#imm":
        return `#${ea.size === "b" ? (ea.value & 0xff) : ea.value}`;
    }
  }

  function operandToText(op: M68KOperand): string {
    switch (op.kind) {
      case "ea": return eaToText(op.ea);
      case "imm": return `#${op.size === "b" ? (op.value & 0xff) : op.value}`;
      case "sr": return "SR";
      case "ccr": return "CCR";
      case "usp": return "USP";
      case "trap": return `#${op.vector}`;
      case "cond": return op.cc;
      case "branch": return `${hex(op.target >>> 0, 8)}`;
      case "reglist": {
        // mask bit0..7=Dn, bit8..15=An, common convention
        const ds: string[] = [];
        const as: string[] = [];
        for (let i = 0; i < 8; i++) if (op.mask & (1 << i)) ds.push(`D${i}`);
        for (let i = 0; i < 8; i++) if (op.mask & (1 << (8 + i))) as.push(`A${i}`);
        const parts = (op.order === "DnAn") ? [...ds, ...as] : [...as, ...ds];
        return parts.join("/");
      }
    }
  }

  const ccNames = [
    "T", "F", "HI", "LS", "CC", "CS", "NE", "EQ",
    "VC", "VS", "PL", "MI", "GE", "LT", "GT", "LE",
  ];
  function condName(cc: number): string {
    return ccNames[cc & 0xf] ?? "??";
  }

  function ins(mnemonic: string, size: M68KSize, operands: M68KOperand[], meta?: M68KInstruction['meta']): M68KInstruction {
    const raw = bytes.slice(start, offset);
    const suffix = size ? `.${size}` : "";
    const opsText = operands.length ? " " + operands.map(operandToText).join(", ") : "";
    const text = `${mnemonic}${suffix}${opsText}` + (meta?.unknown ? '[UNKNOWN]' : '');
    return { opcode, mnemonic, size, operands, words, raw, text, meta };
  }

  const unknown = () => ins("DC.W", null, [{ kind: "imm", size: "w", value: opcode }], { unknown: true });

  // --- Decode (68000 baseline; best-effort “full” coverage of common families) ---

  // 0100 1110 0111 0001 NOP
  if (opcode === 0x4e71) return ins("NOP", null, []);
  if (opcode === 0x4e70) return ins("RESET", null, []);
  if (opcode === 0x4e72) { const imm = readWord(); return ins("STOP", null, [{ kind: "imm", size: "w", value: imm }]); }
  if (opcode === 0x4e73) return ins("RTE", null, []);
  if (opcode === 0x4e75) return ins("RTS", null, []);
  if (opcode === 0x4e77) return ins("RTR", null, []);
  if (opcode === 0x4afc) return ins("ILLEGAL", null, []);

  // TRAP #vector: 0100 1110 0100 vvvv
  if ((opcode & 0xfff0) === 0x4e40) {
    const v = opcode & 0xf;
    return ins("TRAP", null, [{ kind: "trap", vector: v }]);
  }
  // TRAPV 0100 1110 0111 0110
  if (opcode === 0x4e76) return ins("TRAPV", null, []);

  // LINK/UNLK
  if ((opcode & 0xfff8) === 0x4e50) {
    const reg = opcode & 7;
    const disp = s16(readWord());
    return ins("LINK", null, [{ kind: "ea", ea: An(reg) }, { kind: "imm", size: "w", value: disp }]);
  }
  if ((opcode & 0xfff8) === 0x4e58) {
    const reg = opcode & 7;
    return ins("UNLK", null, [{ kind: "ea", ea: An(reg) }]);
  }

  // MOVE USP: 0100 1110 0110 0rrr (to USP) / 0100 1110 0110 1rrr (from USP)
  if ((opcode & 0xfff0) === 0x4e60) {
    const dir = (opcode >>> 3) & 1; // 0: An -> USP, 1: USP -> An
    const r = opcode & 7;
    if (dir === 0) return ins("MOVE", null, [{ kind: "ea", ea: An(r) }, { kind: "usp" }], { special: "USP" });
    return ins("MOVE", null, [{ kind: "usp" }, { kind: "ea", ea: An(r) }], { special: "USP" });
  }

  // MOVEQ: 0111 rrrr iiii iiii
  if ((opcode & 0xf100) === 0x7000) {
    const r = (opcode >>> 9) & 7;
    const imm = s8(opcode & 0xff);
    return ins("MOVEQ", "l", [{ kind: "imm", size: "l", value: imm }, { kind: "ea", ea: Dn(r) }]);
  }

  // Branches: 0110 cccc dddd dddd (disp8), if disp==0 => disp16 word follows
  if ((opcode & 0xf000) === 0x6000) {
    const cc = (opcode >>> 8) & 0xf;
    let disp8 = opcode & 0xff;
    let disp: number;
    if (disp8 === 0x00) disp = s16(readWord());
    else if (disp8 === 0xff) {
      // 68020+ uses disp32, 68000 treats as -1 (still valid disp8)
      disp = s8(disp8);
    } else disp = s8(disp8);

    const pcAfter = start + 2; // base PC points to next word after opcode for branch calc
    const extBytes = (disp8 === 0) ? 2 : 0;
    const pcNext = pcAfter + extBytes;
    const target = (pcNext + disp) >>> 0;

    if (cc === 1) return ins("BSR", null, [{ kind: "branch", disp, target }]);
    if (cc === 0) return ins("BRA", null, [{ kind: "branch", disp, target }]);
    return ins("B" + condName(cc), null, [{ kind: "branch", disp, target }]);
  }

  // DBcc: 0101 cccc 1100 rrr
  if ((opcode & 0xf0f8) === 0x50c8) {
    const cc = (opcode >>> 8) & 0xf;
    const r = opcode & 7;
    const disp = s16(readWord());
    const pcNext = start + 4;
    const target = (pcNext + disp) >>> 0;
    return ins("DB" + condName(cc), null, [{ kind: "ea", ea: Dn(r) }, { kind: "branch", disp, target }]);
  }

  // Scc: 0101 cccc 11 mmm rrr
  if ((opcode & 0xf0c0) === 0x50c0) {
    const cc = (opcode >>> 8) & 0xf;
    const mode = (opcode >>> 3) & 7;
    const reg = opcode & 7;
    const ea = decodeEA(mode, reg, "b");
    return ins("S" + condName(cc), "b", [{ kind: "ea", ea }]);
  }

  // ADDQ/SUBQ: 0101 ddd ssz mmm rrr (ddd=0 means 8)
  if ((opcode & 0xf000) === 0x5000 && (opcode & 0x00c0) !== 0x00c0) {
    const data = (opcode >>> 9) & 7;
    const imm = data === 0 ? 8 : data;
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const isSub = ((opcode >>> 8) & 1) === 1;
    const mode = (opcode >>> 3) & 7;
    const reg = opcode & 7;
    const ea = decodeEA(mode, reg, sz);
    return ins(isSub ? "SUBQ" : "ADDQ", sz, [{ kind: "imm", size: sz, value: imm }, { kind: "ea", ea }]);
  }

  // MOVE / MOVEA: 00ss xxx xxx xxx xxx (where ss != 00)
  // Size: 01=byte, 11=word, 10=long
  if ((opcode & 0xc000) === 0x0000 && (opcode & 0x3000) !== 0x0000) {
    const szBits = (opcode >>> 12) & 3;
    const sz = sizeFromMoveBits(szBits);
    const dstReg = (opcode >>> 9) & 7;
    const dstMode = (opcode >>> 6) & 7;
    const srcMode = (opcode >>> 3) & 7;
    const srcReg = opcode & 7;

    // MOVEA with byte size doesn't exist
    if (dstMode === 1 && sz === "b") {
      return unknown();
    }
    
    const srcEA = decodeEA(srcMode, srcReg, sz);
    
    if (dstMode === 1) {
      // MOVEA: destination is address register
      return ins("MOVEA", sz, [{ kind: "ea", ea: srcEA }, { kind: "ea", ea: An(dstReg) }]);
    } else {
      // MOVE: destination is normal EA
      const dstEA = decodeEA(dstMode, dstReg, sz);
      return ins("MOVE", sz, [{ kind: "ea", ea: srcEA }, { kind: "ea", ea: dstEA }]);
    }
  }
  
  // LEA: 0100 rrr 111 mmm rrr
  if ((opcode & 0xf1c0) === 0x41c0) {
    const dst = (opcode >>> 9) & 7;
    const mode = (opcode >>> 3) & 7;
    const reg = opcode & 7;
    const ea = decodeEA(mode, reg, "l");
    return ins("LEA", null, [{ kind: "ea", ea }, { kind: "ea", ea: An(dst) }]);
  }

  // SWAP: 0100 1000 0100 0rrr
  if ((opcode & 0xfff8) === 0x4840) {
    const r = opcode & 7;
    return ins("SWAP", "w", [{ kind: "ea", ea: Dn(r) }]);
  }

  // PEA: 0100 1000 01 mmm rrr
  if ((opcode & 0xffc0) === 0x4840) {
    const mode = (opcode >>> 3) & 7;
    const reg = opcode & 7;
    const ea = decodeEA(mode, reg, "l");
    if (!isControlEA(ea)) return unknown();
    return ins("PEA", null, [{ kind: "ea", ea }]);
  }

  // JMP/JSR: 0100 1110 10 mmm rrr (JMP) / 0100 1110 100 mmm rrr? (JSR is 0x4E80 group)
  if ((opcode & 0xffc0) === 0x4ec0) {
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, "l");
    return ins("JMP", null, [{ kind: "ea", ea }]);
  }
  if ((opcode & 0xffc0) === 0x4e80) {
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, "l");
    return ins("JSR", null, [{ kind: "ea", ea }]);
  }

  // CLR/NEG/NOT/TST: 0100 0010/0100/0110/1010 size mmm rrr (approx)
  if ((opcode & 0xff00) === 0x4200) {
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    return ins("CLR", sz, [{ kind: "ea", ea }]);
  }
  if ((opcode & 0xff00) === 0x4400) {
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    return ins("NEG", sz, [{ kind: "ea", ea }]);
  }
  if ((opcode & 0xff00) === 0x4600) {
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    return ins("NOT", sz, [{ kind: "ea", ea }]);
  }
  if ((opcode & 0xff00) === 0x4a00) {
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    return ins("TST", sz, [{ kind: "ea", ea }]);
  }

  // EXT: 0100 1000 1 00 0rrr (EXT.W) / 0100 1000 1 01 0rrr (EXT.L)
  if ((opcode & 0xfff8) === 0x4880) {
    const r = opcode & 7;
    const sz = ((opcode >>> 6) & 1) ? "l" : "w";
    return ins("EXT", sz, [{ kind: "ea", ea: Dn(r) }]);
  }

  // EXG: 1100 0xxx 1yyy zzzz (several forms)
  if ((opcode & 0xF1F8) === 0xC140) {
    const rx = (opcode >>> 9) & 7;
    const ry = opcode & 7;
    return ins("EXG", null, [{ kind: "ea", ea: Dn(rx) }, { kind: "ea", ea: Dn(ry) }]);
  }
  if ((opcode & 0xF1F8) === 0xC148) {
    const rx = (opcode >>> 9) & 7;
    const ry = opcode & 7;
    return ins("EXG", null, [{ kind: "ea", ea: An(rx) }, { kind: "ea", ea: An(ry) }]);
  }
  if ((opcode & 0xF1F8) === 0xC188) {
    const rx = (opcode >>> 9) & 7;
    const ry = opcode & 7;
    return ins("EXG", null, [{ kind: "ea", ea: Dn(rx) }, { kind: "ea", ea: An(ry) }]);
  }

  // MOVE to/from SR/CCR:
  // MOVE SR,<ea>: 0100 0000 11 mmm rrr (0x40C0)
  // MOVE <ea>,SR: 0100 0110 11 mmm rrr (0x46C0)
  // MOVE CCR,<ea>: 0100 0010 11 mmm rrr (0x42C0)
  // MOVE <ea>,CCR: 0100 0100 11 mmm rrr (0x44C0)
  if ((opcode & 0xffc0) === 0x40c0) {
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, "w");
    return ins("MOVE", null, [{ kind: "sr" }, { kind: "ea", ea }], { special: "SR" });
  }
  if ((opcode & 0xffc0) === 0x46c0) {
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, "w");
    return ins("MOVE", null, [{ kind: "ea", ea }, { kind: "sr" }], { special: "SR" });
  }
  if ((opcode & 0xffc0) === 0x42c0) {
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, "w");
    return ins("MOVE", null, [{ kind: "ccr" }, { kind: "ea", ea }], { special: "CCR" });
  }
  if ((opcode & 0xffc0) === 0x44c0) {
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, "w");
    return ins("MOVE", null, [{ kind: "ea", ea }, { kind: "ccr" }], { special: "CCR" });
  }

  // AND/OR/EOR immediate: ANDI/ORI/EORI (0x0200/0x0000/0x0A00 groups) + size + EA
  if ((opcode & 0xff00) === 0x0200) {
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const imm = immByteWordLong(sz);
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    return ins("ANDI", sz, [{ kind: "imm", size: sz, value: imm }, { kind: "ea", ea }]);
  }
  if ((opcode & 0xff00) === 0x0000) {
    // Could be ORI / BTST/BCHG/BCLR/BSET (immediate). Distinguish by bits 11..8 patterns.
    const sub = (opcode >>> 8) & 0xf;
    if (sub === 0x0) {
      const szBits = (opcode >>> 6) & 3;
      const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
      const imm = immByteWordLong(sz);
      const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
      return ins("ORI", sz, [{ kind: "imm", size: sz, value: imm }, { kind: "ea", ea }]);
    }
  }
  if ((opcode & 0xff00) === 0x0a00) {
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const imm = immByteWordLong(sz);
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    return ins("EORI", sz, [{ kind: "imm", size: sz, value: imm }, { kind: "ea", ea }]);
  }

  // ADDI/SUBI/CMPI: 06xx/04xx/0Cxx
  if ((opcode & 0xff00) === 0x0600) {
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const imm = immByteWordLong(sz);
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    return ins("ADDI", sz, [{ kind: "imm", size: sz, value: imm }, { kind: "ea", ea }]);
  }
  if ((opcode & 0xff00) === 0x0400) {
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const imm = immByteWordLong(sz);
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    return ins("SUBI", sz, [{ kind: "imm", size: sz, value: imm }, { kind: "ea", ea }]);
  }
  if ((opcode & 0xff00) === 0x0c00) {
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const imm = immByteWordLong(sz);
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    return ins("CMPI", sz, [{ kind: "imm", size: sz, value: imm }, { kind: "ea", ea }]);
  }

  // Bit operations immediate: BTST/BCHG/BCLR/BSET immediate use 0000 1000/???? patterns
  if ((opcode & 0xffc0) === 0x0800 || (opcode & 0xffc0) === 0x0840 || (opcode & 0xffc0) === 0x0880 || (opcode & 0xffc0) === 0x08c0) {
    const which = (opcode >>> 6) & 3;
    const bit = readWord() & 0xff; // immediate bit number uses low byte
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, "b");
    const mn = ["BTST", "BCHG", "BCLR", "BSET"][which] ?? "B???";
    return ins(mn, null, [{ kind: "imm", size: "b", value: bit }, { kind: "ea", ea }]);
  }

  // Bit operations register: 0000 1bbb 01 mmm rrr etc (BTST/BCHG/BCLR/BSET with Dn)
  if ((opcode & 0xf100) === 0x0100) {
    const which = (opcode >>> 6) & 3;
    const dn = (opcode >>> 9) & 7;
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, "b");
    const mn = ["BTST", "BCHG", "BCLR", "BSET"][which] ?? "B???";
    return ins(mn, null, [{ kind: "ea", ea: Dn(dn) }, { kind: "ea", ea }]);
  }

  // ADDA/SUBA/CMPA: 1101/1001/1011 with bit8..6 patterns
  // ADDA: 1101 ddd 11s mmm rrr (s=0:w,1:l)
  if ((opcode & 0xf0c0) === 0xd0c0) {
    const an = (opcode >>> 9) & 7;
    const sz = ((opcode >>> 8) & 1) ? "l" : "w";
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    return ins("ADDA", sz, [{ kind: "ea", ea }, { kind: "ea", ea: An(an) }]);
  }
  // SUBA: 1001 ddd 11s mmm rrr
  if ((opcode & 0xf0c0) === 0x90c0) {
    const an = (opcode >>> 9) & 7;
    const sz = ((opcode >>> 8) & 1) ? "l" : "w";
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    return ins("SUBA", sz, [{ kind: "ea", ea }, { kind: "ea", ea: An(an) }]);
  }
  // CMPA: 1011 ddd 11s mmm rrr
  if ((opcode & 0xf0c0) === 0xb0c0) {
    const an = (opcode >>> 9) & 7;
    const sz = ((opcode >>> 8) & 1) ? "l" : "w";
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    return ins("CMPA", sz, [{ kind: "ea", ea }, { kind: "ea", ea: An(an) }]);
  }

  // ADD/SUB/AND/OR/EOR/CMP (register <-> EA families)
  // ADD: 1101 ddd ssz mmm rrr  (bit8=dir)
  if ((opcode & 0xf000) === 0xd000) {
    const dn = (opcode >>> 9) & 7;
    const dir = (opcode >>> 8) & 1;
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    if (dir === 0) return ins("ADD", sz, [{ kind: "ea", ea }, { kind: "ea", ea: Dn(dn) }]);
    return ins("ADD", sz, [{ kind: "ea", ea: Dn(dn) }, { kind: "ea", ea }]);
  }
  // SUB: 1001 ddd ssz mmm rrr
  if ((opcode & 0xf000) === 0x9000) {
    const dn = (opcode >>> 9) & 7;
    const dir = (opcode >>> 8) & 1;
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    if (dir === 0) return ins("SUB", sz, [{ kind: "ea", ea }, { kind: "ea", ea: Dn(dn) }]);
    return ins("SUB", sz, [{ kind: "ea", ea: Dn(dn) }, { kind: "ea", ea }]);
  }

  // MULU/MULS: 1100 ddd 011 mmm rrr (MULU) / 1100 ddd 111 mmm rrr (MULS)
  if ((opcode & 0xf1c0) === 0xc0c0) {
    const dn = (opcode >>> 9) & 7;
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, "w");
    return ins("MULU", "w", [{ kind: "ea", ea }, { kind: "ea", ea: Dn(dn) }]);
  }
  if ((opcode & 0xf1c0) === 0xc1c0) {
    const dn = (opcode >>> 9) & 7;
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, "w");
    return ins("MULS", "w", [{ kind: "ea", ea }, { kind: "ea", ea: Dn(dn) }]);
  }

  // AND: 1100 ddd ssz mmm rrr
  if ((opcode & 0xf000) === 0xc000) {
    const dn = (opcode >>> 9) & 7;
    const dir = (opcode >>> 8) & 1;
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    if (dir === 0) return ins("AND", sz, [{ kind: "ea", ea }, { kind: "ea", ea: Dn(dn) }]);
    return ins("AND", sz, [{ kind: "ea", ea: Dn(dn) }, { kind: "ea", ea }]);
  }

  // DIVU/DIVS: 1000 ddd 011 mmm rrr / 1000 ddd 111 mmm rrr
  if ((opcode & 0xf1c0) === 0x80c0) {
    const dn = (opcode >>> 9) & 7;
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, "w");
    return ins("DIVU", "w", [{ kind: "ea", ea }, { kind: "ea", ea: Dn(dn) }]);
  }
  if ((opcode & 0xf1c0) === 0x81c0) {
    const dn = (opcode >>> 9) & 7;
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, "w");
    return ins("DIVS", "w", [{ kind: "ea", ea }, { kind: "ea", ea: Dn(dn) }]);
  }

  // OR: 1000 ddd ssz mmm rrr
  if ((opcode & 0xf000) === 0x8000) {
    const dn = (opcode >>> 9) & 7;
    const dir = (opcode >>> 8) & 1;
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    if (dir === 0) return ins("OR", sz, [{ kind: "ea", ea }, { kind: "ea", ea: Dn(dn) }]);
    return ins("OR", sz, [{ kind: "ea", ea: Dn(dn) }, { kind: "ea", ea }]);
  }

  // EOR: 1011 ddd ssz mmm rrr (dir is fixed Dn -> <ea>)
  if ((opcode & 0xf100) === 0xb100) {
    const dn = (opcode >>> 9) & 7;
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    // EOR destination cannot be An direct, PC-relative, or immediate.
    if (ea.kind === "An" || ea.kind === "(d16,PC)" || ea.kind === "(d8,PC,Xn)" || ea.kind === "#imm") {
      return unknown();
    }
    else {
      return ins("EOR", sz, [{ kind: "ea", ea: Dn(dn) }, { kind: "ea", ea }]);
    }
  }
  
  // CMP: 1011 ddd ssz mmm rrr (dir fixed <ea> -> Dn compare)
  if ((opcode & 0xf000) === 0xb000) {
    const dn = (opcode >>> 9) & 7;
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    return ins("CMP", sz, [{ kind: "ea", ea }, { kind: "ea", ea: Dn(dn) }]);
  }

  // MOVEM: 0100 1000 1s mmm rrr (to mem) / 0100 1100 1s mmm rrr (to regs)
  if ((opcode & 0xfb80) === 0x4880 || (opcode & 0xfb80) === 0x4c80) {
    const toRegs = (opcode & 0x0400) !== 0; // 0x4Cxx => memory->regs
    const sz = ((opcode >>> 6) & 1) ? "l" : "w";
    const mask = readWord() & 0xffff;
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, sz);
    // Order: for -(An) the mask order is reversed in encoding; we expose both mask and a suggested order.
    const order: "DnAn" | "AnDn" = "DnAn";
    if (toRegs) return ins("MOVEM", sz, [{ kind: "ea", ea }, { kind: "reglist", mask, order }]);
    return ins("MOVEM", sz, [{ kind: "reglist", mask, order }, { kind: "ea", ea }]);
  }

  // Shifts/rotates (immediate/register and memory) — best effort
  // Memory shifts: 1110 0cc 11 mmm rrr (AS/LS/ROX/RO) size is word for mem
  if ((opcode & 0xf0c0) === 0xe0c0) {
    const sub = (opcode >>> 9) & 3; // 00 AS, 01 LS, 10 ROX, 11 RO
    const dir = (opcode >>> 8) & 1; // 0 right, 1 left
    const ea = decodeEA((opcode >>> 3) & 7, opcode & 7, "w");
    const base = ["AS", "LS", "ROX", "RO"][sub] ?? "??";
    return ins(base + (dir ? "L" : "R"), "w", [{ kind: "ea", ea }]);
  }
  // Register shifts: 1110 ccc d ssz i/r rrr (many variants)
  if ((opcode & 0xf000) === 0xe000 && (opcode & 0x00c0) !== 0x00c0) {
    const countOrReg = (opcode >>> 9) & 7;
    const dir = (opcode >>> 8) & 1;
    const isReg = (opcode >>> 5) & 1; // 0 immediate, 1 register
    const szBits = (opcode >>> 6) & 3;
    const sz = (szBits === 0) ? "b" : (szBits === 1) ? "w" : "l";
    const opKind = (opcode >>> 3) & 3; // 00 AS, 01 LS, 10 ROX, 11 RO
    const dn = opcode & 7;
    const base = ["AS", "LS", "ROX", "RO"][opKind] ?? "??";
    const mn = base + (dir ? "L" : "R");
    const countOp: M68KOperand =
      isReg
        ? ({ kind: "ea", ea: Dn(countOrReg) })
        : ({ kind: "imm", size: "b", value: (countOrReg === 0 ? 8 : countOrReg) });
    return ins(mn, sz, [countOp, { kind: "ea", ea: Dn(dn) }]);
  }

  // Fallback: treat as unknown, but keep opcode length 2
  return unknown();
}

function isControlEA(ea: M68KEA): boolean {
  return (
    ea.kind === "(An)" ||
    ea.kind === "(d16,An)" ||
    ea.kind === "(d8,An,Xn)" ||
    ea.kind === "abs.w" ||
    ea.kind === "abs.l" ||
    ea.kind === "(d16,PC)" ||
    ea.kind === "(d8,PC,Xn)"
  );
}