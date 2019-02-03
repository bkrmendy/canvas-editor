import { Line, Offset } from '../utils/Types';

/**
 * Encapsulates the information related to the selection state.
 */
export class Selection {
  constructor(public startOffset: Offset, public startLine: Line, public endOffset: Offset, public endLine: Line) { }

  /**
   * Returns whether the selection is collapsed
   */
  get isCollapsed(): boolean {
    return this.startOffset === this.endOffset && this.startLine === this.endLine;
  }

  /**
   * Returns whether the selection is expanded, wraps `isCollapsed` for convenience and better readibility
   */
  get isExtended(): boolean {
    return !this.isCollapsed;
  }

  /**
   * Returns a similar interface as the normal Selection values, only ordered "visually"
   * (Beginline is the line earlier in the text than finishLine, while if selection is backwards, endLine may be
   * earlier than startLine)
   */
  get orderedSelection() {
    let beginLine: Line;
    let finishLine: Line;
    let beginOffset: Offset;
    let finishOffset: Offset;
    if (this.startLine === this.endLine) {
      beginLine = this.startLine;
      finishLine = this.endLine;
      beginOffset = Math.min(this.startOffset, this.endOffset);
      finishOffset = Math.max(this.startOffset, this.endOffset);
    } else if (this.startLine < this.endLine) {
      beginLine = this.startLine;
      finishLine = this.endLine;
      beginOffset = this.startOffset;
      finishOffset = this.endOffset;
    } else {
      beginLine = this.endLine;
      finishLine = this.startLine;
      beginOffset = this.endOffset;
      finishOffset = this.startOffset;
    }
    return {
      beginLine,
      beginOffset,
      finishLine,
      finishOffset,
    };
  }

  /**
   * Collapses selection to the end offset/line, according to text order (endline becomes the line later in text than
   * startline)
   */
  public collapseToEnd(): Selection {
    this.endLine = Math.max(this.endLine, this.startLine);
    this.endOffset = Math.max(this.endOffset, this.startOffset);
    this.startLine = this.endLine;
    this.startOffset = this.endOffset;
    return this;
  }

  /**
   * Collapses selection to the start offset/line, according to text order
   */
  public collapseToStart(): Selection {
    this.startLine = Math.min(this.startLine, this.endLine);
    this.startOffset = Math.min(this.startOffset, this.endOffset);
    this.endLine = this.startLine;
    this.endOffset = this.startOffset;
    return this;
  }

  /**
   * Moves (and possibly collapses) selection to a given line/coordinate pair
   * @param line Line
   * @param offset Offset
   */
  public moveTo(line: Line, offset: Offset): Selection {
    this.startLine = line;
    this.endLine = line;
    this.startOffset = offset;
    this.endOffset = offset;
    return this;
  }

  /**
   * Extends the logical selection to a given line/coordinate pair
   * @param line Line
   * @param offset Offset
   */
  public extendTo(line: Line, offset: Offset): Selection {
    this.endLine = line;
    this.endOffset = offset;
    return this;
  }

  public clone(): Selection {
    return new Selection(this.startOffset, this.startLine, this.endOffset, this.endLine);
  }
}
