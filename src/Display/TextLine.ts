import { Rect } from '../utils/Rect';
import { Offset } from '../utils/Types';
import { DisplayBlock } from './DisplayBlock';

/**
 * Encapsulates a set of DisplayBlocks that are in the same row visually.
 */
export class TextLine {
  private text: string;
  private x: number;
  private y: number;
  constructor(public blocks: DisplayBlock[]) {
    this.text = this.blocks.map((block) => block.Text).join('');
    this.x = this.blocks[0].X;
    this.y = Math.max.apply(undefined, this.blocks.map((block) => block.Y));
  }

  /**
   * Returns the leftmost X coordinate from the blocks contained in this line
   */
  get X(): number {
    return this.x;
  }

  /**
   * Returns the Y coordinate of the leftmost DisplayBlock
   */
  get Y(): number {
    return this.y;
  }

  /**
   * Returns the maximum of the line heights of the blocks contained in this line
   */
  get LineHeight(): number {
    return Math.max.apply(undefined, this.blocks.map((block) => block.LineHeight));
  }

  /**
   * Returns the combined text of the blocks contained in this line
   */
  get Text(): string {
    return this.text;
  }

  get TextLength(): number {
    return this.text.length;
  }

  get EndsInNewLine(): boolean {
    return this.blocks[this.blocks.length - 1].Text === '\n';
  }

  /**
   * Returns the max of the character heights of the blocks
   * @param context Canvas context used for measuring
   */
  public getHeight(context: CanvasRenderingContext2D): number {
    return Math.max.apply(undefined, this.blocks.map((block) => block.getTextHeight(context)));
  }

  /**
   * Returns the combined width of the blocks contained in this line
   * @param context Canvas context used for measuring text
   */
  public getWidth(context: CanvasRenderingContext2D): number {
    return this.blocks.reduce((acc, val) => acc + val.getTextWidth(context), 0);
  }

  /**
   * Returns the x, y coords for a given offset in this line
   * @param offset Offset in text
   * @param context Context for measuing text
   */
  public getCursorCoordsAt(offset: Offset, context: CanvasRenderingContext2D): { x: number; y: number } {
    let offsetCounter = 0;
    let offsetXCounter = 0;
    for (const block of this.blocks) {
      if (offsetCounter + block.Length >= offset && offset >= offsetCounter) {
        const { x: blockX, y } = block.getCursorCoordsAt(offset - offsetCounter, context);
        return { x: blockX + offsetXCounter, y };
      } else {
        offsetCounter += block.Length;
        offsetXCounter += block.getTextWidth(context);
      }
    }
    throw Error('Could not find offset in clicked region');
  }

  /**
   * Returns the closest offset for a given X offset in this line
   * @param targetX X offset within this line
   * @param context Canvas context used for drawing
   */
  public getOffsetAt(targetX: number, context: CanvasRenderingContext2D): Offset {
    let offsetCounter = 0;
    let widthCounter = 0;
    for (const block of this.blocks) {
      const blockWidth = block.getTextWidth(context);
      if (widthCounter + blockWidth >= targetX && targetX >= widthCounter) {
        return offsetCounter + block.getOffsetAt(targetX - widthCounter, context);
      } else {
        offsetCounter += block.Length;
        widthCounter += blockWidth;
      }
    }
    throw Error('Could not find offset from click coordinates');
  }

  /**
   * Returns the bounding box for the selection between two offsets in the same line
   * @param begin Beginning offset
   * @param end Ending offset
   * @param context Canvas context used for measuring text
   */
  public getBoundingBoxFromOffsetToOffset(begin: Offset, end: Offset, context: CanvasRenderingContext2D): Rect {
    const lineHeight = this.LineHeight;
    const xAtBegin = this.getCursorCoordsAt(begin, context).x;
    const xAtEnd = this.getCursorCoordsAt(end, context).x;
    return {
      x: this.x + xAtBegin,
      y: this.y - lineHeight,
      width: xAtEnd - xAtBegin,
      height: lineHeight,
    };
  }

  /**
   * Returns the bounding box for the selection from the beginning of the line to a given offset
   * @param offset Beginning offset
   * @param context Canvas context used for measuring text
   */
  public getBoundingBoxFromBeginTo(offset: number, context: CanvasRenderingContext2D): Rect {
    const xAtBegin = this.getCursorCoordsAt(offset, context).x;
    const lineHeight = this.LineHeight;
    return {
      x: this.x,
      y: this.y - lineHeight,
      width: this.x + xAtBegin,
      height: lineHeight,
    };
  }

  /**
   * Returns the bounding box for the selection from a given offset to the end of the line
   * @param offset Ending offset
   * @param context Canvas context used for measuring text
   */
  public getBoundingBoxFromOffsetToEnd(offset: number, context: CanvasRenderingContext2D): Rect {
    const lineHeight = this.LineHeight;
    const xAtBegin = this.getCursorCoordsAt(offset, context).x;
    return {
      x: this.x + xAtBegin,
      y: this.y - lineHeight,
      width: this.getWidth(context) - xAtBegin,
      height: lineHeight,
    };
  }

  /**
   * Returns the selection rectangle for the whole line
   * @param context Canvas context used for measuring text
   */
  public getBoundingBoxFromBeginToEnd(context: CanvasRenderingContext2D): Rect {
    const lineHeight = this.LineHeight;
    return {
      x: this.x,
      y: this.y - lineHeight,
      width: this.getWidth(context),
      height: lineHeight,
    };
  }

  public displayBlockUnderMouse(x: number, y: number, context: CanvasRenderingContext2D): DisplayBlock | undefined {
    for (const block of this.blocks) {
      if (block.isPointInBounds(x, y, context)) {
        return block;
      }
    }
    return undefined;
  }

  /**
   * Draws the line
   * @param context Canvas context used for drawing text
   */
  public draw = (context: CanvasRenderingContext2D) => {
    for (const block of this.blocks) {
      block.draw(context);
    }
  };
}
