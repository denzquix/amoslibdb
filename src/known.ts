import type { LibraryDef } from "./types.js";
import AGA from "./known/AGS.js";
import AMCAF from "./known/AMCAF.js";
import Amon from "./known/Amon.js";
import AMOS from "./known/AMOS.js";
import Compact from "./known/Compact.js";
import { CRAFT, MusiCRAFT } from "./known/CRAFT.js";
import Delta from "./known/Delta.js";
import DoomMusic from "./known/DoomMusic.js";
import EasyLife from "./known/EasyLife.js";
import FD25 from "./known/FS25.js";
import Game from "./known/Game.js";
import GUI from "./known/GUI.js";
import Int from "./known/Int.js";
import IntuiExtend from "./known/IntuiExtend.js";
import IOPorts from "./known/IOPorts.js";
import { JD, JDColour, JDInt, JDK, Prt } from "./known/JD.js";
import LDos from "./known/LDos.js";
import Make from "./known/Make.js";
import { Colours, CoolStars, DBench, Effects, Ercole, First, Jotre, JVP, Locale, Lserial, Misc, P61, TFT, THX } from "./known/Misc.js";
import Music from "./known/Music.js";
import OpalVision from "./known/OpalVision.js";
import OSDevKit from "./known/OSDevKit.js";
import Personnal from "./known/Personnal.js";
import PowerBobs from "./known/PowerBobs.js";
import Requester from "./known/Requester.js";
import SLN from "./known/SLN.js";
import Tools from "./known/Tools.js";
import Turbo from "./known/Turbo.js";
import AMOS3D from "./known/AMOS3D.js";
import EME from "./known/EME.js";

export const ALL: LibraryDef[] = [
  AMOS.V1_34,
  AMOS.ProV2_00,
  AMOS.ProV2_00_Compiled,
  AMOS.ProV2_00_ALT1,
  AMOS.ProV2_00_ALT2,
  AMOS3D.V1_00,
  AMOS3D.V1_50,
  AMOS3D.ProV1_02,
  Compact.V1_20,
  Compact.V1_20_ALT1,
  Compact.V1_20_ALT2,
  Compact.V1_20_ALT3,
  Compact.ProV2_00,
  Music.V1_30,
  Music.V1_30_ALT,
  Music.V1_54,
  Music.V1_55,
  Music.V1_62,
  Music.V1_62_ALT,
  Music.ProV2_00,
  EME.V3_00DEMO,
  EME.ProV3_00DEMO,
  Requester.ProV2_00,
  IOPorts.V2_00,
  GUI.V1_50B,
  GUI.V1_61,
  GUI.V1_62,
  GUI.V1_70,
  GUI.V1_70B,
  GUI.V1_75,
  GUI.V2_00,
  AGA.ProV1_00,
  Colours.V1_00,
  CoolStars.V1_00,
  CRAFT.V1_00,
  MusiCRAFT.V1_00,
  DBench.V0_42,
  Personnal.V1_00B,
  THX.V0_6,
  OpalVision.V1_1,
  AMCAF.V1_19,
  AMCAF.V1_40_EN,
  AMCAF.V1_40_DE,
  AMCAF.V1_50B4_EN,
  AMCAF.V1_50B4_DE,
  Amon.V1_03,
  Amon.V1_04,
  Delta.V1_40,
  Delta.V1_60,
  Tools.V1_00,
  Tools.V1_01,
  DoomMusic.V2_00,
  EasyLife.V1_09,
  EasyLife.V1_10,
  EasyLife.V1_44,
  Effects.V0_15,
  Ercole.V1_70,
  FD25.V1_00,
  First.V0_10,
  Game.V0_90,
  IntuiExtend.V1_30B,
  IntuiExtend.V1_60,
  IntuiExtend.V2_01B,
  Int.V1_00,
  JDColour.V2_00,
  JDInt.V1_30,
  JDK.V1_10,
  JD.V4_60,
  JD.V5_30,
  JD.V5_90,
  Jotre.V1_00,
  Jotre.V1_00_ALT,
  JVP.V1_01,
  LDos.V1_00,
  LDos.V1_10,
  Locale.V0_26,
  Lserial.V1_00,
  Lserial.V1_00_ALT,
  Make.V1_20,
  Make.V1_30,
  Misc.V1_00,
  OSDevKit.V1_20,
  OSDevKit.V1_61,
  P61.V1_10,
  P61.V1_20,
  PowerBobs.BETA6,
  PowerBobs.V1_00,
  Prt.V1_10,
  Prt.V1_40,
  SLN.V2_00,
  TFT.V0_6,
  Turbo.V1_90,
  Turbo.PlusV1_00,
  Turbo.PlusV1_50,
  Turbo.PlusV2_00,
  Turbo.PlusV2_15,
];

export const byMD5 = new Map(ALL.map(lib => [lib.md5, lib]));
