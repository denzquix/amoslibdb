
export type RoutineDef = (
  | number
  /*
  | {type:'extern', library:LibraryDef, routineName:string}
  | {type:'return', value:number}
  | {type:'error', errcode:number}
  | {type:'common', func:never}
  */
);

type Access = {
  stack?: string;
  a0?: string;
  d0?: string;
  d3?: string;
  ccr?: boolean;
};

export interface LibraryDef {
  md5: string;
  type: 'creator' | 'pro';
  name: string;
  version: string;
  extends?: LibraryDef;
  removed?: string[];
  renamed?: {[name: string]: string};
  routines: {[name: string]: RoutineDef};
  signatures?: {[name: string]: {in?: Access, out?: Access}};
}
