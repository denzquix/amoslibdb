import { readdir, readFile } from "node:fs/promises";
import * as fspath from 'node:path';
import { createHash } from 'node:crypto';
import { parseHunk } from "./amiga-hunk.js";
import { parseAmosLib } from "./amoslib.js";

const libNameByHash: {[md5: string]: {name:string, version:string}} = {
  ab1d615bde71d06d53de098768e5384e: {name:'AMOS Pro', version:'?'},
};

async function main() {
  for (const fn of await readdir('amoslibs', {withFileTypes:true})) {
    if (fn.isFile() && /\.lib$/i.test(fn.name)) {
      const path = fspath.join(fn.parentPath, fn.name);
      const libData = await readFile(path);
      const libMD5 = createHash('md5').update(libData).digest('hex');
      const { hunks } = parseHunk(libData);
      console.log(hunks);
      console.log(libMD5);
      const libRef = libNameByHash[libMD5] ?? {name:fn.name.replace(/\.lib$/i, ''), version:'?'};
      console.log(libRef);
      const libInfo = parseAmosLib(hunks[0]!.data!);
      console.log(libInfo.codeBlocks.length + ' code blocks');
      console.table(libInfo.tokenInfo);
    }
  }
}

main();
