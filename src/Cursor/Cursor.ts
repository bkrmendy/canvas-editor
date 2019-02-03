import { blinkOff, blinkOn } from '../utils/Constants';
import { Rect } from '../utils/Rect';
import { RGBA } from '../utils/RGBA';
import { CursorMode, CursorState } from './CursorState';

export class Cursor {
  // Data to grab pixels from when erasing cursor (cursor is overdrawn with whatever pixels were "under" it)
  public drawState: ImageData;

  // Collapsed cursor color
  private cursorStyle = new RGBA(0, 0, 0, 0.9).CSS;

  // Selection color
  private selectionStyle = new RGBA(103, 188, 251, 0.5).CSS;

  constructor(
    public startX: number, // X coord of selection start (anchor point)
    public endX: number, // X coord of selection end (focus point)
    public startY: number, // Y coord of selection start (anchor point)
    public endY: number, // Y coord of selection end (focus point)
    public width: number = 1.5, // Cursor width when collapsed
    public height: number = 20, // Cursor height when collapsed
    /**
     * Reference to blink interval timer
     * https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setInterval#Return_value
     */
    private blinkTimer: number = -1,
  ) {}

  /**
   * draws cursor depending on the parameters received in cursorState
   * @param cursorState Describes the which mode (expanded or collapsed) should be drawn
   * @param context Canvas context for drawing
   */
  public draw(cursorState: CursorState, context: CanvasRenderingContext2D): void {
    if (cursorState.mode === CursorMode.EXPANDED) {
      const { rects } = cursorState;
      this.drawExpanded(context, rects!);
    } else if (cursorState.mode === CursorMode.COLLAPSED) {
      const { x, y, height } = cursorState.coords!;
      this.height = height;
      this.drawCollapsed(context, x, y);
    }
  }

  /**
   * Used by the timer to redraw the cursor at its last known coordinates
   * @param context: Canvas context for drawing
   */
  private reDraw = (context: CanvasRenderingContext2D) => {
    context.fillStyle = this.cursorStyle;
    context.fillRect(this.startX, this.startY, this.width, this.height);
  };

  /**
   * Highlights current (expanded) selection
   * @param context Canvas context for drawing
   * @param selection Rectangles that cover the DisplayBlocks within the current selection
   */
  private drawExpanded = (context: CanvasRenderingContext2D, selection: Rect[]) => {
    window.clearInterval(this.blinkTimer);
    this.erase(context);
    context.fillStyle = this.selectionStyle;
    for (const rect of selection) {
      context.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
    const firstRect = selection[0];
    const lastRect = selection[selection.length - 1];
    if (firstRect.x === this.startX) {
      this.endX = lastRect.x + lastRect.width;
      this.endY = lastRect.y + lastRect.height - this.height;
    } else {
      this.endX = firstRect.x;
      this.endY = lastRect.y - this.height;
    }
  };

  /**
   * Erases (draws original image over) cursor
   * @param context Canvas context for drawing
   */
  private erase = (context: CanvasRenderingContext2D) => {
    context.putImageData(this.drawState, 0, 0);
  };

  /**
   * Draws cursor in collapsed state (as a thin bar)
   * @param context Canvas context for drawing
   * @param x X coordinate of bottom left corner of cursor
   * @param y Y coordinate of bottom left corner of cursor
   */
  private drawCollapsed = (context: CanvasRenderingContext2D, x: number, y: number) => {
    this.erase(context);
    this.startX = this.endX = x;
    this.startY = this.endY = y - this.height;
    context.fillStyle = this.cursorStyle;
    context.fillRect(this.startX, this.startY, this.width, this.height);
    this.blink(context, blinkOff, blinkOn);
  };

  /**
   * Sets up the blink timer that periodically erases and redraws the cursor
   * @param context Canvas context for rendering
   * @param offInterval Time spent erased
   * @param onInterval Time spent drawn on screen
   */
  private blink = (context: CanvasRenderingContext2D, offInterval: number, onInterval: number) => {
    if (this.blinkTimer) {
      window.clearInterval(this.blinkTimer);
    }
    this.blinkTimer = window.setInterval(() => {
      this.reDraw(context);
      window.setTimeout(() => {
        this.erase(context);
      }, onInterval);
    }, onInterval + offInterval);
  };
}
