
export function parseAmosLib(data: Buffer) {
  let C_Off = 18;
  if (data.length < C_Off) {
    throw new Error('buffer too short');
  }
  const alwaysRunFlag = data.readInt16BE(16) !== 0;
  let ap20Mode = data.toString('binary', C_Off, C_Off+4) === 'AP20';
  if (ap20Mode) {
    C_Off += 4;
  }
  const C_Tk = C_Off + data.readUint32BE(0);
  const C_Lib = C_Tk + data.readUInt32BE(4);
  const C_Title = C_Lib + data.readUint32BE(8);
  const C_End = C_Title + data.readUint32BE(12);
  if (C_End > data.length) {
    throw new Error('truncated data');
  }
  const title = data.subarray(C_Title, C_End).toString('binary').replace(/\0+$/, '').split(/\0/g);
  const codeBlockCount = (C_Tk - C_Off) / 2;
  const codeBlocks = new Array<Buffer>(codeBlockCount);
  let nextPos = C_Lib;
  for (let i = 0; i < codeBlockCount; i++) {
    const codeBlock = data.subarray(nextPos, nextPos + data.readUint16BE(C_Off + 2 * i) * 2);
    codeBlocks[i] = codeBlock;
    nextPos += codeBlock.length;
  }
  if (nextPos !== C_Title) {
    throw new Error('needed ' + C_Title + ', got ' + nextPos);
  }
  let tkPos = C_Tk;
  const tokenInfo = new Array<{instrEntryPoint: number, funcEntryPoint: number, name: String, signature: string, terminator: number}>();
  let lastName = '';
  for (;;) {
    if (tkPos >= C_Lib) {
      throw new Error('unterminated token section');
    }
    const instrEntryPoint = data.readInt16BE(tkPos);
    if (instrEntryPoint === 0) break;
    tkPos += 2;
    const funcEntryPoint = data.readInt16BE(tkPos);
    tkPos += 2;
    let str = '';
    let c;
    do {
      if (tkPos >= C_Lib) {
        throw new Error('unterminated name string');
      }
      str += String.fromCharCode(data[tkPos]! & 0x7f);
    } while (!(data[tkPos++]! & 0x80));
    if (str === '\0') str = '';
    const name = str;
    str = '';
    while (data.readInt8(tkPos) > 0) {
      if (tkPos >= C_Lib) {
        throw new Error('unterminated signature string');
      }
      str += String.fromCharCode(data[tkPos++]!);
    }
    const terminator = data.readInt8(tkPos++);
    const signature = str;
    tkPos += tkPos % 2; // even boundary
    tokenInfo.push({instrEntryPoint, funcEntryPoint, name:(name === '' && lastName.startsWith('!') ? lastName.slice(1) : name.replace(/^!/, '')), signature, terminator});
    lastName = name;
  }

  return {
    alwaysRunFlag,
    codeBlocks,
    tokenInfo,
    title,
  };
}

export namespace CodePattern {
  export namespace Section {
    export const getLength = (section: Section) => {
      switch (section.type) {
        case 'literal': return section.bytes.length;
        case 'Rjmp': case 'Ljmp':
        case 'RjsrtR': case 'RjmptR':
        case 'Rjsr': case 'Ljsr':
        case 'Rlea': {
          return 6;
        }
        default: return 4;
      }
    };
  };
  export type Section = (
    | {type:'literal', bytes:Buffer}
    | {type:'Rjmp' | 'Rjsr' | 'Rbra' | 'Rbsr' | 'Rbeq' | 'Rbne' | 'Rbcs' | 'Rbcc' | 'Rblt' | 'Rbge' | 'Rbls' | 'Rbhi' | 'Rble' | 'Rbpl' | 'Rbmi', target: number}
    | {type:'Ljmp' | 'Ljsr', libraryNumber: number, target:number}
    | {type:'RjsrtR' | 'RjmptR' | 'Rlea', target:number, register:'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7'}
    | {type:'Rdata'}
  );
  export const getLength = (pattern: CodePattern, nextRoutine = NaN) => {
    return pattern.sections.reduce(
      (len, section) => len + Section.getLength(section),
      (pattern.fallthroughTarget === false) || (pattern.fallthroughTarget === nextRoutine) ? 0 : 4,
    );
  };
}

export type CodePattern = {
  sections: CodePattern.Section[];
  redirectTarget: number | false;
  fallthroughTarget: number | false;
};

const ESCAPE_MASK = 0xFF0F;
const ESCAPE_SIGNATURE = 0xFE01;
const C_CodeJ = 0xF7;
const C_CodeT = 0xF5;

export function toCodePattern(code: Buffer): CodePattern {
  // if last four bytes are "GetP", remove them
  if (code.toString('binary', code.length-4) === 'GetP') {
    code = code.subarray(0, code.length - 4);
  }
  // MOVEQ #0/#1/#2,D2 is eliminated if present right before final RTS
  if (code.length >= 4
    && code[code.length-4] === 0x74
    && code[code.length-3]! >= 0 && code[code.length-3]! <= 2
    && code[code.length-2] === 0x4e
    && code[code.length-1] === 0x75
  ) {
    code = Buffer.concat([
      code.subarray(0, code.length-4),
      code.subarray(code.length-2),
    ]);
  }
  // if the code block ends with a BRA.W it may or may not be eliminated
  // depending on whether the called routine happens to be the immediate
  // next one or not
  let fallthroughTarget: number | false;
  if (code.length >= 4 && code[code.length-4] === 0xfe && code[code.length-3] === 0x21) {
    fallthroughTarget = code.readUint16BE(code.length-2);
    code = code.subarray(0, code.length-4);
  }
  else {
    fallthroughTarget = false;
  }

  // since the fallthrough jump may be eliminated, if the very first
  // thing encountered in the target code is itself an unconditional
  // jump, we need to be able to work out whether this is the original
  // jump or the second (or third or fourth or...) in a chain of jumps
  let redirectTarget: number | false;
  if (code.length >= 4 && code[0] === 0xfe && code[1] === 0x21) {
    redirectTarget = code.readUInt16BE(2);
  }
  else if (code.length === 0) {
    redirectTarget = fallthroughTarget;
  }
  else {
    redirectTarget = false;
  }

  const sections: CodePattern.Section[] = [];
  let literal_start_i = 0;
  let code_i = 0;
  const pushLiteral = () => {
    if (literal_start_i !== code_i) {
      sections.push({type:'literal', bytes:code.subarray(literal_start_i, code_i)});
    }
  };
  escapeCheck: while (code_i <= code.length-4) {
    const escape = code.readUint16BE(code_i);
    if ((escape & ESCAPE_MASK) !== ESCAPE_SIGNATURE) {
      code_i += 2;
      continue escapeCheck;
    }
    const escapeType = (escape >> 4) & 0xf;
    switch (escapeType) {
      case 0:
        if ((code_i + 6) > code.length) {
          // not enough data for escape sequence
          code_i += 2;
          continue escapeCheck;
        }
        else if (code[code_i + 2] === C_CodeT) {
          let registerNumber = code[code_i + 3]!;
          const target = code.readUint16BE(code_i + 4);
          if (registerNumber < 8) {
            pushLiteral();
            const register = `A${registerNumber as (0|1|2|3|4|5|6|7)}` as const;
            sections.push({type:'RjmptR', target, register});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else if (registerNumber < 16) {
            // never generated by any official macro, but the compiler
            // will treat it the same as FE11..
            pushLiteral();
            const register = `A${(registerNumber - 8) as (0|1|2|3|4|5|6|7)}` as const;
            sections.push({type:'Rlea', register, target: target});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else {
            code_i += 2;
            continue escapeCheck;
          }
        }
        else if (code[code_i + 2] === C_CodeJ) {
          const libraryNumber = code[code_i + 3]!;
          const target = code.readUint16BE(code_i + 4);
          if (libraryNumber === 0) {
            pushLiteral();
            sections.push({type:'Rjmp', target});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else if (libraryNumber < 27) {
            pushLiteral();
            sections.push({type:'Ljmp', target, libraryNumber});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else {
            code_i += 2;
            continue escapeCheck;
          }
        }
        else {
          // FE 01 followed by anything other than F7 or F5:
          // continue the same literal sequence
          code_i += 2;
          continue escapeCheck;
        }
      case 1:
        if ((code_i + 6) > code.length) {
          // not enough data for escape sequence
          code_i += 2;
          continue escapeCheck;
        }
        if (code[code_i + 2] === C_CodeT) {
          const registerNumber = code[code_i + 3]!;
          const target = code.readUint16BE(code_i + 4);
          if (registerNumber < 8) {
            pushLiteral();
            const register = `A${registerNumber as 0|1|2|3|4|5|6|7}` as const;
            sections.push({type:'RjsrtR', target, register});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else if (registerNumber < 16) {
            pushLiteral();
            const register = `A${(registerNumber-8) as 0|1|2|3|4|5|6|7}` as const;
            sections.push({type:'Rlea', register, target});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else {
            code_i += 2;
            continue escapeCheck;
          }
        }
        else if (code[code_i + 2] === C_CodeJ) {
          const libraryNumber = code[code_i + 3]!;
          const target = code.readUint16BE(code_i + 4);
          if (libraryNumber === 0) {
            pushLiteral();
            sections.push({type:'Rjsr', target});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else if (libraryNumber < 27) {
            pushLiteral();
            sections.push({type:'Ljsr', target, libraryNumber});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else {
            code_i += 2;
            continue escapeCheck;
          }
        }
        else {
          // FE 11 followed by anything other than F7 or F5:
          // continue the same literal sequence
          code_i += 2;
          continue escapeCheck;
        }
      case 2: {
        pushLiteral();
        const target = code.readUint16BE(code_i + 2);
        sections.push({type:'Rbra', target});
        literal_start_i = code_i += 4;
        continue escapeCheck;
      }
      case 3: {
        pushLiteral();
        const target = code.readUint16BE(code_i + 2);
        sections.push({type:'Rbsr', target});
        literal_start_i = code_i += 4;
        continue escapeCheck;
      }
      case 4: {
        pushLiteral();
        const target = code.readUint16BE(code_i + 2);
        sections.push({type:'Rbeq', target});
        literal_start_i = code_i += 4;
        continue escapeCheck;
      }
      case 5: {
        pushLiteral();
        const target = code.readUint16BE(code_i + 2);
        sections.push({type:'Rbne', target});
        literal_start_i = code_i += 4;
        continue escapeCheck;
      }
      case 6: {
        pushLiteral();
        const target = code.readUint16BE(code_i + 2);
        sections.push({type:'Rbcs', target});
        literal_start_i = code_i += 4;
        continue escapeCheck;
      }
      case 7: {
        pushLiteral();
        const target = code.readUint16BE(code_i + 2);
        sections.push({type:'Rbcc', target});
        literal_start_i = code_i += 4;
        continue escapeCheck;
      }
      case 8: {
        pushLiteral();
        const target = code.readUint16BE(code_i + 2);
        sections.push({type:'Rblt', target});
        literal_start_i = code_i += 4;
        continue escapeCheck;
      }
      case 9: {
        pushLiteral();
        const target = code.readUint16BE(code_i + 2);
        sections.push({type:'Rbge', target});
        literal_start_i = code_i += 4;
        continue escapeCheck;
      }
      case 10: {
        pushLiteral();
        const target = code.readUint16BE(code_i + 2);
        sections.push({type:'Rbls', target});
        literal_start_i = code_i += 4;
        continue escapeCheck;
      }
      case 11: {
        pushLiteral();
        const target = code.readUint16BE(code_i + 2);
        sections.push({type:'Rbhi', target});
        literal_start_i = code_i += 4;
        continue escapeCheck;
      }
      case 12: {
        pushLiteral();
        const target = code.readUint16BE(code_i + 2);
        sections.push({type:'Rble', target});
        literal_start_i = code_i += 4;
        continue escapeCheck;
      }
      case 13: {
        pushLiteral();
        const target = code.readUint16BE(code_i + 2);
        sections.push({type:'Rbpl', target});
        literal_start_i = code_i += 4;
        continue escapeCheck;
      }
      case 14: {
        pushLiteral();
        const target = code.readUint16BE(code_i + 2);
        sections.push({type:'Rbmi', target});
        literal_start_i = code_i += 4;
        continue escapeCheck;
      }
      case 15:
        if (code[code_i+2] === 0x65 && code[code_i+3] === 0x43) {
          pushLiteral();
          sections.push({type:'Rdata'});
          literal_start_i = code_i += 4;
          // rest of code section is unescaped
          // so break the loop, not the switch case
          break escapeCheck;
        }
        else {
          code_i += 2;
          continue escapeCheck;
        }
    }
  }
  code_i = code.length;
  pushLiteral();

  return {
    sections,
    fallthroughTarget,
    redirectTarget,
  };
}

export interface RoutineDef {
  code: CodePattern;
  libraryNumber: number;
  routineNumber: number;
}

export interface CompiledRoutineInfo {
  libraryNumber: number;
  routineNumber: number;
  offset: number;
  length: number;
  fallthrough?: boolean;
}

export interface CompiledLibraryInfo {
  data: Buffer;
  routines: CompiledRoutineInfo[];
  relocations: number[];
}

export function compileLibraryRoutines(routines: Array<RoutineDef>): CompiledLibraryInfo {
  const relocations: number[] = [];
  const records: Array<CompiledRoutineInfo> = [];
  const placement = new Map<`${number}:${number}`, {offset:number, length:number}>();
  let nextOffset = 2;
  for (let i = 0; i < routines.length; i++) {
    const v = routines[i]!;
    const next = routines[i + 1];
    let length: number;
    if (next && next.libraryNumber === v.libraryNumber) {
      length = CodePattern.getLength(v.code, next.routineNumber);
    }
    else {
      length = CodePattern.getLength(v.code);
    }
    if (length === 0) {
      placement.set(`${v.libraryNumber}:${v.routineNumber}`, {offset:0, length:0});
      records.push({libraryNumber:v.libraryNumber, routineNumber:v.routineNumber, offset:0, length:0});
    }
    else {
      placement.set(`${v.libraryNumber}:${v.routineNumber}`, {offset:nextOffset, length});
      records.push({libraryNumber:v.libraryNumber, routineNumber:v.routineNumber, offset:nextOffset, length});
      nextOffset += length;
    }
  }  
  const totalLength = nextOffset;
  const data = Buffer.alloc(totalLength);
  data.writeUint16BE(0x4E75, 0);
  for (let i = 0; i < routines.length; i++) {
    const v = routines[i]!;
    const { offset, length } = placement.get(`${v.libraryNumber}:${v.routineNumber}`)!;
    if (length === 0) continue;
    let nextOffset = offset;
    const getAbsAddr = (libraryNumber: number, routineNumber: number) => {
      const x = placement.get(`${libraryNumber}:${routineNumber}`)
      if (!x) {
        throw new Error(`routine not found: ${libraryNumber}:${routineNumber}`);
      }
      return 0x10000000 | x.offset;
    };
    const getRelAddr = (fromPos: number, libraryNumber: number, routineNumber: number) => {
      const x = placement.get(`${libraryNumber}:${routineNumber}`)
      if (!x) {
        throw new Error(`routine not found: ${libraryNumber}:${routineNumber}`);
      }
      const displacement = x.offset - fromPos;
      if (displacement < -32768 || displacement >= 32768) {
        throw new Error('displacement exceeds +/-32K');
      }
      return displacement;
    };
    for (const section of v.code.sections) {
      switch (section.type) {
        case 'literal': {
          data.set(section.bytes, nextOffset);
          nextOffset += section.bytes.length;
          break;
        }
        case 'Rdata': {
          // NOP NOP
          data.writeUint16BE(0x4e71, nextOffset);
          data.writeUint16BE(0x4e71, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        case 'Rjmp': {
          // JMP abs.L
          data.writeUint16BE(0x4EF9, nextOffset);
          data.writeUint32BE(getAbsAddr(0, section.target), nextOffset + 2);
          relocations.push(nextOffset + 2);
          nextOffset += 6;
          break;
        }
        case 'Ljmp': {
          // JMP abs.L
          data.writeUint16BE(0x4EF9, nextOffset);
          data.writeUint32BE(getAbsAddr(section.libraryNumber, section.target), nextOffset + 2);
          relocations.push(nextOffset + 2);
          nextOffset += 6;
          break;
        }
        case 'Rjsr': {
          // JSR abs.L
          data.writeUint16BE(0x4EB9, nextOffset);
          data.writeUint32BE(getAbsAddr(0, section.target), nextOffset + 2);
          relocations.push(nextOffset + 2);
          nextOffset += 6;
          break;
        }
        case 'Ljsr': {
          // JSR abs.L
          data.writeUint16BE(0x4EB9, nextOffset);
          data.writeUint32BE(getAbsAddr(section.libraryNumber, section.target), nextOffset + 2);
          relocations.push(nextOffset + 2);
          nextOffset += 6;
          break;
        }
        case 'RjsrtR': {
          // MOVE.L d(A4),An; JSR (An)
          const regNum = Number(section.register.slice(1));
          data.writeUint16BE(0x206C | (regNum << 9), nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          data.writeUint16BE(0x4E90 | regNum, nextOffset + 4);
          nextOffset += 6;
          break;
        }
        case 'RjmptR': {
          // MOVE.L d(A4),An; JMP (An)
          const regNum = Number(section.register.slice(1));
          data.writeUint16BE(0x206C | (regNum << 9), nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          data.writeUint16BE(0x4ED0 | regNum, nextOffset + 4);
          nextOffset += 6;
          break;
        } 
        case 'Rlea': {
          // LEA abs.L,An
          const regNum = Number(section.register.slice(1));
          data.writeUint16BE(0x41F9 | (regNum << 9), nextOffset);
          data.writeUint32BE(getAbsAddr(v.libraryNumber, section.target), nextOffset + 2);
          relocations.push(nextOffset + 2);
          nextOffset += 6;
          break;
        }
        case 'Rbra': {
          // BRA.W
          data.writeUint16BE(0x6000, nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        case 'Rbsr': {
          // BSR.W
          data.writeUint16BE(0x6100, nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        case 'Rbhi': {
          // BHI.W
          data.writeUint16BE(0x6200, nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        case 'Rbls': {
          // BLS.W
          data.writeUint16BE(0x6300, nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        case 'Rbcc': {
          // BCC.W
          data.writeUint16BE(0x6400, nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        case 'Rbcs': {
          // BCS.W
          data.writeUint16BE(0x6500, nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        case 'Rbne': {
          // BNE.W
          data.writeUint16BE(0x6600, nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        case 'Rbeq': {
          // BEQ.W
          data.writeUint16BE(0x6700, nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        case 'Rbpl': {
          // BPL.W
          data.writeUint16BE(0x6A00, nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        case 'Rbmi': {
          // BMI.W
          data.writeUint16BE(0x6B00, nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        case 'Rbge': {
          // BGE.W
          data.writeUint16BE(0x6C00, nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        case 'Rblt': {
          // BLT.W
          data.writeUint16BE(0x6D00, nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        case 'Rble': {
          // BLE.W
          data.writeUint16BE(0x6F00, nextOffset);
          const displacement = getRelAddr(nextOffset + 2, v.libraryNumber, section.target);
          data.writeInt16BE(displacement, nextOffset + 2);
          nextOffset += 4;
          break;
        }
        default: {
          throw new Error('unhandled section type');
        }
      }
    }
    if (v.code.fallthroughTarget !== false) {
      const next = routines[i + 1];
      if (!next
        || next.libraryNumber !== v.libraryNumber
        || v.code.fallthroughTarget !== next.routineNumber
      ) {
        // BRA.W
        const displacement = getRelAddr(offset + length - 2, v.libraryNumber, v.code.fallthroughTarget);
        data.writeUint16BE(0x6000, offset + length - 4);
        data.writeInt16BE(displacement, offset + length - 2);
      }
      else {
        records[i]!.fallthrough = true;
      }
    }
  }
  return {
    data,
    relocations,
    routines: records,
  };
}
