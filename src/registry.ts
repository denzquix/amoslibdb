
export interface LibInfo {
  name: string;
  version: string;
  libraryNumber: number;
}

const registry: {[md5: string]: LibInfo} = {
  // official
  'ab1d615bde71d06d53de098768e5384e': {name:'ProCore', version:'V2.00', libraryNumber:0},
  'ddf2f65aaa9df85d642317e199105d53': {name:'ProMusic', version:'V2.00', libraryNumber:1},
  '57e035efd4d37cb5504bd7d619a99933': {name:'ProCompact', version:'V2.00', libraryNumber:2},
  '7d3df35f6a37886c2d4c84542b9300e0': {name:'ProRequester', version:'V2.00', libraryNumber:3},
  '241e45afbbad3871e5dad9135dacd1cb': {name:'ProIOPorts', version:'V2.00', libraryNumber:6},
  'd3429df16a9810f55e724a808a87a32f': {name:'ProCore', version:'V2.00-Alt1', libraryNumber:0},
  'ca931a098b87141a11e9c8ec061a7cb5': {name:'ProCore', version:'V2.00-Alt2', libraryNumber:0},

  '1287e5ce2930a37b23c892973f225749': {name:'CreatorCore', version:'V1.12', libraryNumber:0},
  '2d4087f5635f1617695f2119c8a6b8e3': {name:'CreatorCore', version:'V1.34', libraryNumber:0},
  '9a7c2211cc479d8751d4262cd5872c25': {name:'CreatorCore', version:'V1.34a', libraryNumber:0},
  '22f05edd0edef32e860312b7d929b1c9': {name:'CreatorCore', version:'V1.34f', libraryNumber:0},

  // third party
  '18ed1e8c39eb633bd26a5da129002a64': {name:'OpalVision', version:'V1.1', libraryNumber:21},
};

export default registry;
