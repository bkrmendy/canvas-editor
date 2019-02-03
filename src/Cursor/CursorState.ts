import { Rect } from '../utils/Rect';

export enum CursorMode {
  EXPANDED,
  COLLAPSED,
}

export interface CursorState {
  mode: CursorMode;
  rects?: Rect[];
  coords?: { x: number; y: number; height: number };
}
