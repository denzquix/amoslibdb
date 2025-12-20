
const escapes: {[v: number]: Array<Buffer | number | 'stop'>} = {
  0:  [Buffer.from([0x4E, 0xF9]), 4],
  // 1 is a special case
  2:  [Buffer.from([0x60, 0x00]), 2],  // Rbra - BRA.W
  3:  [Buffer.from([0x61, 0x00]), 2],  // Rbsr - BSR.W
  4:  [Buffer.from([0x67, 0x00]), 2],  // Rbeq - BEQ.W
  5:  [Buffer.from([0x66, 0x00]), 2],  // Rbne - BNE.W
  6:  [Buffer.from([0x65, 0x00]), 2],  // Rbcs - BCS.W
  7:  [Buffer.from([0x64, 0x00]), 2],  // Rbcc - BCC.W
  8:  [Buffer.from([0x6D, 0x00]), 2],  // Rblt - BLT.W
  9:  [Buffer.from([0x6C, 0x00]), 2],  // Rbge - BGE.W
  10: [Buffer.from([0x63, 0x00]), 2],  // Rbls - BLS.W
  11: [Buffer.from([0x62, 0x00]), 2],  // Rbhi - BHI.W
  12: [Buffer.from([0x6F, 0x00]), 2],  // Rble - BLE.W
  13: [Buffer.from([0x6A, 0x00]), 2],  // Rbpl - BPL.W
  14: [Buffer.from([0x6B, 0x00]), 2],  // Rbmi - BMI.W  
  15: [Buffer.from([0x4e, 0x71, 0x4e, 0x71]), 'stop'],
};

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
