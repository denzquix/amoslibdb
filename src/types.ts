
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
  a1?: string;
  d0?: string;
  d1?: string;
  d2?: string;
  d3?: string;
  d4?: string;
  d5?: string;
  d6?: string;
  d7?: string;
  ccr?: boolean;
};

export type SignatureDef = {
  in?: Access;
  out?: Access;
};

export interface LibraryDef {
  md5: string;
  type: 'creator' | 'pro';
  name: string;
  version: string;
  extends?: LibraryDef;
  removed?: string[];
  skip?: string[];
  renamed?: {[name: string]: string};
  routines: {[name: string]: RoutineDef};
  signatures?: {[name: string]: {in?: Access, out?: Access}};
  same?: {[name: string]: string};
  ignore?: (routineNumber: number) => boolean;
}
