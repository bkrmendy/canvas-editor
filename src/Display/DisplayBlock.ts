import { RGBA } from '../utils/RGBA';
import { Offset } from '../utils/Types';

/**
 * A string of charaters with the same formatting, broken into a chunk that fits between either the previous
 * DisplayBlock and the next or the edge of the canvas area
 */
export class DisplayBlock {
  constructor(
    private font: string, // CSS font string corresponding to this style
    private lineHeight: number, //  Height of line in pixels
    private text: string, // raw text of this block
    private offsetX: number, // X offset of the block from the left edge of the canvas
    private offsetY: number, // Y offset of the block from the top of the canvas
    public textColor: RGBA,
    public highLight?: RGBA,
    public underLine?: RGBA,
  ) {}

  /**
   * Accessor for offsetX
   */
  get X() {
    return this.offsetX;
  }

  /**
   * Accessor for offsetY
   */
  get Y() {
    return this.offsetY;
  }

  /**
   * Accessor for lineHeight
   */
  get LineHeight() {
    return this.lineHeight;
  }

  /**
   * Returns the length of the text contained within this block
   */
  get Length() {
    return this.text.length;
  }

  /**
   * Accessor for text
   */
  get Text() {
    return this.text;
  }

  /**
   * Returns an approximation of the height this block's font
   * @param context Canavas context used for measuring text
   */
  public getTextHeight(context: CanvasRenderingContext2D) {
    context.font = this.font;
    return context.measureText('W').width * 1.2;
  }

  /**
   * Returns the width of this block's text in pixels
   * @param context Canvas context used for measuring text
   */
  public getTextWidth(context: CanvasRenderingContext2D) {
    context.font = this.font;
    return context.measureText(this.text).width;
  }

  /**
   * Returns the cursor coords for a fiven offset within this block, measured with the block's font settings.
   * @param offset Character offset
   * @param context Canvas context for measuring text width
   */
  public getCursorCoordsAt(offset: Offset, context: CanvasRenderingContext2D): { x: number; y: number } {
    const y = this.offsetY;
    context.font = this.font;
    return { x: context.measureText(this.text.slice(0, offset)).width, y };
  }

  /**
   * Returns the closest charater offset for a given X coordinate within this block.
   * @param targetX X coordinate to find the nearest offset to
   * @param context Canvas context used for measuring text width
   */
  public getOffsetAt(targetX: number, context: CanvasRenderingContext2D): Offset {
    context.font = this.font;
    for (let i = 1; i < this.text.length; i++) {
      const beforeCursorWidth = context.measureText(this.text.slice(0, i - 1)).width;
      const afterCursorWidth = context.measureText(this.text.slice(0, i)).width;
      if (afterCursorWidth >= targetX && targetX >= beforeCursorWidth) {
        const clickedChar = this.text.slice(i - 1, i);
        const charWidth = context.measureText(clickedChar).width;
        return targetX - beforeCursorWidth > charWidth / 2 ? i : i - 1;
      }
    }
    return this.text.slice(-1) === '\n' ? this.text.length - 1 : this.text.length;
  }

  public isPointInBounds(x: number, y: number, context: CanvasRenderingContext2D): boolean {
    return (
      this.offsetX <= x &&
      x < this.offsetX + this.getTextWidth(context) &&
      this.offsetY - this.lineHeight <= y &&
      y < this.offsetY
    );
  }

  /**
   * Draws this block according to its font settings
   * @param context Canvas context used for drawing
   */
  public draw(context: CanvasRenderingContext2D) {
    context.font = this.font;
    if (this.highLight) {
      context.fillStyle = this.highLight.CSS;
      context.fillRect(
        this.offsetX,
        this.offsetY - this.lineHeight,
        context.measureText(this.text.trim()).width,
        this.lineHeight,
      );
    }
    if (this.underLine) {
      context.strokeStyle = this.underLine.CSS;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(this.offsetX, this.offsetY);
      context.lineTo(this.offsetX + context.measureText(this.text.trim()).width, this.offsetY);
      context.stroke();
    }
    context.fillStyle = this.textColor.CSS;
    context.font = this.font;
    context.fillText(this.text, this.offsetX, this.offsetY - (this.lineHeight / 2 - this.getTextHeight(context) / 2));
  }
}
