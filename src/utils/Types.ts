export interface IRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface BackendStyle {
  fontWeight: string;
  fontStyle: string;
  fontSize: number;
  lineHeight: number;
  textColor?: IRGBA;
  highLight?: IRGBA;
  underLine?: IRGBA;
}
interface BackendBlock {
  style: BackendStyle;
  text: string;
}
export type BackendBlocks = BackendBlock[];

/**
 * Typedef for Line and Offset, to avoid bugs from mixing up Line with Offset
 * Here to add semantic information
 */
export type Line = number;
export type Offset = number;
