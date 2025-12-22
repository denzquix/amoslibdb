
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
  export type Section = (
    | {type:'literal', bytes:Buffer}
    | {type:'Rjmpt' | 'Rjsrt' | 'Rjmp' | 'Rjsr' | 'Rbra' | 'Rbsr' | 'Rbeq' | 'Rbne' | 'Rbcs' | 'Rbcc' | 'Rblt' | 'Rbge' | 'Rbls' | 'Rbhi' | 'Rble' | 'Rbpl' | 'Rbmi', target: number}
    | {type:'RjsrtR' | 'RjmptR' | 'Ljmp' | 'Ljsr', libNumber: number, target:number}
    | {type:'Rlea', register:'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7', target:number}
    | {type:'Rdata'}
  );
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
          const libNumber = code[code_i + 3]!;
          const target = code.readUint16BE(code_i + 4);
          if (libNumber === 0) {
            pushLiteral();
            sections.push({type:'Rjmpt', target});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else if (libNumber < 8) {
            pushLiteral();
            sections.push({type:'RjmptR', target, libNumber});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else if (libNumber < 16) {
            // never generated by any official macro, but the compiler
            // will treat it the same as FE11..
            pushLiteral();
            const register = `A${(libNumber-8) as 0|1|2|3|4|5|6|7}` as const;
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
          const libNumber = code[code_i + 3]!;
          const target = code.readUint16BE(code_i + 4);
          if (libNumber === 0) {
            pushLiteral();
            sections.push({type:'Rjmp', target});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else if (libNumber < 27) {
            pushLiteral();
            sections.push({type:'Ljmp', target, libNumber});
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
          const libNumber = code[code_i + 3]!;
          const target = code.readUint16BE(code_i + 4);
          if (libNumber === 0) {
            pushLiteral();
            sections.push({type:'Rjsrt', target});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else if (libNumber < 8) {
            pushLiteral();
            sections.push({type:'RjsrtR', target, libNumber});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else if (libNumber < 16) {
            pushLiteral();
            const register = `A${(libNumber-8) as 0|1|2|3|4|5|6|7}` as const;
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
          const libNumber = code[code_i + 3]!;
          const target = code.readUint16BE(code_i + 4);
          if (libNumber === 0) {
            pushLiteral();
            sections.push({type:'Rjsr', target});
            literal_start_i = code_i += 6;
            continue escapeCheck;
          }
          else if (libNumber < 27) {
            pushLiteral();
            sections.push({type:'Ljsr', target, libNumber});
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
