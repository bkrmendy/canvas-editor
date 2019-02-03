import { EditorCommand } from './Commands/EditorCommand';
import { InsertTextCommand } from './Commands/InsertTextCommand';
import { RemoveTextCommand } from './Commands/RemoveTextCommand';
import { SetFormatCommand } from './Commands/SetFormatCommand';
import { CursorDirection } from './Cursor/CursorDirection';
import { CursorMode, CursorState } from './Cursor/CursorState';
import { DisplayBlock } from './Display/DisplayBlock';
import { Style, Styles } from './Display/Styles';
import { TextLine } from './Display/TextLine';
import { Change } from './History/Change';
import { History } from './History/History';
import { FormattedBlock } from './Model/FormattedBlock';
import { Selection } from './Model/Selection';
import { editorWidth } from './utils/Constants';
import { Rect } from './utils/Rect';
import { BackendBlocks, Line, Offset } from './utils/Types';

/**
 * Class containing the editor state and text
 * Handles editing actions
 * Decoupled from ing functions
 */
export class Editor {
  private blocks: FormattedBlock[];
  private lines: TextLine[];
  constructor(
    blocks: BackendBlocks,
    public selection: Selection = new Selection(0, 0, 0, 0),
    private history: History = new History(),
  ) {
    this.blocks = this.parseDocument(blocks);
  }

  /**
   * Returns the length of current selection in characters (if selection is expanded)
   */
  get selectionLength() {
    const { beginLine, beginOffset, finishLine, finishOffset } = this.selection.orderedSelection;
    if (beginLine === finishLine) {
      return Math.abs(finishOffset - beginOffset);
    } else if (finishLine - beginLine === 1) {
      return this.lines[beginLine].TextLength - beginOffset + finishOffset;
    } else {
      let length = 0;
      for (let i = 0; i < this.lines.length; i++) {
        if (i === beginLine) {
          length += this.lines[i].TextLength - beginOffset;
        } else if (i > beginLine && i < finishLine) {
          length += this.lines[i].TextLength;
        } else if (i === finishLine) {
          length += finishOffset;
        }
      }
      return length;
    }
  }

  /**
   * returns the formatted lines generated by the editor
   */
  get Lines() {
    return this.lines;
  }

  /**
   * Accessor for blocks
   */
  get Blocks() {
    return this.blocks;
  }

  /**
   * Setter for blocks
   */
  set Blocks(newValue: FormattedBlock[]) {
    this.blocks = newValue;
  }

  /**
   * Returns the Y coord of the line above the cursor (first line if cursos is at the top)
   */
  get PreviousLineY() {
    const { endLine } = this.selection;
    return this.lines[endLine > 0 ? endLine - 1 : 0].Y;
  }

  /**
   * Returns the Y coord of the line below the cursor (last line if cursos is at the bottom)
   */
  get NextLineY() {
    const { endLine } = this.selection;
    return this.lines[endLine < this.lines.length - 1 ? endLine + 1 : this.lines.length - 1].Y;
  }

  public getBlockIndexAtStart() {
    const { beginLine, beginOffset } = this.selection.orderedSelection;
    return this.getBlockIndexAtPoint(beginLine, beginOffset);
  }

  public getBlockIndexAtEnd() {
    const { finishLine, finishOffset } = this.selection.orderedSelection;
    return this.getBlockIndexAtPoint(finishLine, finishOffset);
  }

  // TODO:  eventually optimize this function by re-rendering only the lines affected by
  //        a given change (low prio)
  /**
   * Renders displayable lines from the formatted blocks
   */
  public generateLines = (context: CanvasRenderingContext2D, maxWidth: number): TextLine[] => {
    const { blocks } = this;
    const textLines = new Array<TextLine>();

    let displayBlocks = new Array<DisplayBlock>();
    let currentX = 0;
    let currentY = blocks[0].Height;

    for (const block of blocks) {
      const { brokenBlocks, newY, newX } = block.break(currentX, currentY, maxWidth, context);

      displayBlocks = [...displayBlocks, ...brokenBlocks];
      currentX = newX;
      currentY = newY;
    }

    let blocksForLine = [displayBlocks[0]];
    for (let i = 1; i < displayBlocks.length; i++) {
      if (blocksForLine[0].Y === displayBlocks[i].Y) {
        blocksForLine.push(displayBlocks[i]);
      } else {
        textLines.push(new TextLine(blocksForLine));
        blocksForLine = [displayBlocks[i]];
      }
    }
    textLines.push(new TextLine(blocksForLine));

    this.lines = textLines;

    return this.lines;
  };

  /**
   * Moves point selection by one character in a given direction
   * @param direction Direction to move cursor
   */
  public moveSelection(selection: Selection, direction: CursorDirection, steps: Offset = 1): Selection {
    if (selection.isExtended) {
      if (direction === CursorDirection.RIGHT) {
        selection.collapseToEnd();
      } else if (direction === CursorDirection.LEFT) {
        selection.collapseToStart();
      } else if (direction === CursorDirection.UP) {
        selection.collapseToStart();
      } else if (direction === CursorDirection.DOWN) {
        selection.collapseToEnd();
      }
    }
    const { startOffset, startLine } = selection;
    const { newLine, newOffset } = this.setSelectionInDirection(direction, startLine, startOffset, steps);
    selection.moveTo(newLine, newOffset);
    return selection;
  }

  /**
   * Extends selection by one character into a given direction
   * @param direction Direction to move cursor
   */
  public extendSelection(direction: CursorDirection) {
    const { endOffset, endLine } = this.selection;
    const { newLine, newOffset } = this.setSelectionInDirection(direction, endLine, endOffset);
    this.selection.extendTo(newLine, newOffset);
  }

  /**
   * Moves point selection near a given coordinate
   * @param targetX target X coordinate
   * @param targetY target Y coordinate
   * @param context Canvas context used to measure text
   */
  public moveSelectionTo(
    selection: Selection,
    targetX: number,
    targetY: number,
    context: CanvasRenderingContext2D,
  ): Selection {
    const { newLine, newOffset } = this.getSelectionFromCoords(targetX, targetY, context);
    return selection.moveTo(newLine, newOffset);
  }

  /**
   * Extends point selection near a given x, y coordinate pair
   * @param targetX target X coordinate
   * @param targetY target Y coordinate
   * @param context Canvas context used to measure text
   */
  public extendSelectionTo(selection: Selection, targetX: number, targetY: number, context: CanvasRenderingContext2D) {
    const { newLine, newOffset } = this.getSelectionFromCoords(targetX, targetY, context);
    return selection.extendTo(newLine, newOffset);
  }

  /**
   * Selects the whole line near to a given pair of x, y coords
   * @param targetX Target X coordinate
   * @param targetY Target Y coordinate
   * @param context Canvas context used for measuring text
   */
  public selectLineAt(targetX: number, targetY: number, context: CanvasRenderingContext2D) {
    const { newLine } = this.getSelectionFromCoords(targetX, targetY, context);
    this.selection.moveTo(newLine, 0).extendTo(newLine, this.lines[newLine].Text.length);
  }

  /**
   * Selects a word from behind the first char to after the last cahr near a given pair of x y coords
   * @param targetX Target X coordinate
   * @param targetY Target Y coordinate
   * @param context Canvas context used for measuring text
   */
  public selectWordAt(targetX: number, targetY: number, context: CanvasRenderingContext2D) {
    const { newLine, newOffset } = this.getSelectionFromCoords(targetX, targetY, context);
    const wordBegin = this.getWordBoundaryInDirection(CursorDirection.LEFT, newLine, newOffset);
    const wordEnd = this.getWordBoundaryInDirection(CursorDirection.RIGHT, newLine, newOffset);
    this.selection.moveTo(newLine, wordBegin + 1).extendTo(newLine, wordEnd);
  }

  /**
   * returns selection state and region (depens on state - region for extended and coord for collapsed)
   * @param context Canvas context used to measure text
   */
  public getSelection = (context: CanvasRenderingContext2D): CursorState => {
    if (this.selection.isCollapsed) {
      const mode = CursorMode.COLLAPSED;
      const { startLine, startOffset } = this.selection;
      let coords;
      if (startLine >= this.lines.length) {
        const correctLine = this.lines.length - 1;
        const correctOffset = this.lines[correctLine].Text.length;
        coords = this.getCursorCoords(context, correctLine, correctOffset);
        this.selection.moveTo(correctLine, correctOffset);
      } else {
        coords = this.getCursorCoords(context, startLine, startOffset);
      }
      return {
        mode,
        coords,
      };
    }
    const { beginLine, beginOffset, finishLine, finishOffset } = this.selection.orderedSelection;
    const { lines } = this;
    const rects = new Array<Rect>();
    if (beginLine === finishLine) {
      rects.push(this.lines[beginLine].getBoundingBoxFromOffsetToOffset(beginOffset, finishOffset, context));
    } else if (finishLine - beginLine === 1) {
      rects.push(this.lines[beginLine].getBoundingBoxFromOffsetToEnd(beginOffset, context));
      rects.push(this.lines[finishLine].getBoundingBoxFromBeginTo(finishOffset, context));
    } else {
      rects.push(this.lines[beginLine].getBoundingBoxFromOffsetToEnd(beginOffset, context));
      for (let i = 0; i < lines.length; i++) {
        if (i > beginLine && i < finishLine) {
          rects.push(lines[i].getBoundingBoxFromBeginToEnd(context));
        }
      }
      rects.push(this.lines[finishLine].getBoundingBoxFromBeginTo(finishOffset, context));
    }
    return {
      mode: CursorMode.EXPANDED,
      rects,
    };
  };

  //#region CopyPaste

  public copy(): string {
    if (this.selection.isCollapsed) {
      throw Error('Copy: selection is collapsed');
    }
    const { blocks, selection } = this;
    const { beginLine, beginOffset } = selection.orderedSelection;
    const index = this.getIndexInText(beginLine, beginOffset);
    const length = this.selectionLength;
    return this.getTextFromBlocks(blocks, index, length);
  }

  public cut(context: CanvasRenderingContext2D): string {
    const text = this.copy();
    this.removeSelection(context);
    return text;
  }

  //#endregion

  //#region Editing
  /**
   * If selection is expanded, deletes selection
   * If selection is collapsed, generates & executes a backspace action
   * @param context Canvas context for measuring & rendering text
   */
  public backSpace(context: CanvasRenderingContext2D) {
    if (this.selection.isExtended) {
      this.removeSelection(context);
    } else {
      // tslint:disable:no-debugger
      debugger;
      const { startLine, startOffset } = this.selection;
      const index = this.getBlockIndexAtStart();
      const offset = this.getOffsetInBlock(this.getIndexInText(startLine, startOffset), index);
      const afterSelection = this.moveSelection(this.selection.clone(), CursorDirection.LEFT);
      const command = new RemoveTextCommand(
        index,
        offset - 1,
        this.getTextFromBlocks(this.blocks, this.getIndexInText(startLine, startOffset) - 1, 1),
      );
      this.executeCommand([command], () => afterSelection, context);
    }
  }

  /**
   * If selection is expanded, deletes selection
   * If collapsed, deletes one char in front of selection
   * @param context Canvas context for measuring & rendering text
   */
  public frontSpace(context: CanvasRenderingContext2D) {
    if (this.selection.isExtended) {
      this.removeSelection(context);
    } else {
      const { startLine, startOffset } = this.selection;
      const index = this.getBlockIndexAtStart();
      const offset = this.getOffsetInBlock(this.getIndexInText(startLine, startOffset), index);
      const afterSelection = this.selection.clone();
      const command = new RemoveTextCommand(index, offset, this.getTextFromBlocks(this.blocks, index, 1));
      this.executeCommand([command], () => afterSelection, context);
    }
  }

  /**
   * If selection is expanded, deletes selection, and then
   * inserts a linebreak into the formatted block at selection.
   * @param context Canvas context for measuring & rendering text
   */
  public enter(context: CanvasRenderingContext2D) {
    if (this.selection.isExtended) {
      this.removeSelection(context);
    }
    const { startLine, startOffset } = this.selection;
    const index = this.getBlockIndexAtStart();
    const offset = this.getOffsetInBlock(this.getIndexInText(startLine, startOffset), index);
    const command = new InsertTextCommand(index, offset, '\n');
    this.executeCommand([command], () => this.moveSelection(this.selection.clone(), CursorDirection.RIGHT, 1), context);
  }

  /**
   * If selection is expanded, deletes selection, and then
   * inserts text at new (collapsed selection).
   * @param context Canvas context for measuring & rendering text
   */
  public insertText(text: string, context: CanvasRenderingContext2D) {
    if (this.selection.isExtended) {
      this.removeSelection(context);
    }
    const { startLine, startOffset } = this.selection;
    const index = this.getBlockIndexAtStart();
    const offset = this.getOffsetInBlock(this.getIndexInText(startLine, startOffset), index);
    const command = new InsertTextCommand(index, offset, text);
    this.executeCommand(
      [command],
      () => this.moveSelection(this.selection.clone(), CursorDirection.RIGHT, text.length),
      context,
    );
  }

  /**
   * Sets the format for the selection.
   * @param format Format type
   * @param context Canvas context for measuring & rendering text
   */
  public setFormat(format: string, context: CanvasRenderingContext2D) {
    const commands = new Array<SetFormatCommand>();
    const { blocks } = this;
    const { beginLine, beginOffset, finishLine, finishOffset } = this.selection.orderedSelection;
    const afterSelection = this.selection.clone();
    const style = Styles[format];

    const startingBlockIndex = this.getBlockIndexAtStart();
    const endingBlockIndex = this.getBlockIndexAtEnd();
    const startOffset = this.getOffsetInBlock(this.getIndexInText(beginLine, beginOffset), startingBlockIndex);
    const endOffset = this.getOffsetInBlock(this.getIndexInText(finishLine, finishOffset), endingBlockIndex);

    if (startingBlockIndex === endingBlockIndex) {
      commands.push(new SetFormatCommand(startingBlockIndex, startOffset, endOffset, style));
    } else if (endingBlockIndex - startingBlockIndex === 1) {
      commands.push(
        new SetFormatCommand(startingBlockIndex, startOffset, blocks[startingBlockIndex].Text.length, style),
      );
      commands.push(new SetFormatCommand(endingBlockIndex, 0, endOffset, style));
    } else {
      commands.push(
        new SetFormatCommand(startingBlockIndex, startOffset, blocks[startingBlockIndex].Text.length, style),
      );
      commands.push(new SetFormatCommand(endingBlockIndex, 0, endOffset, style));
      for (let i = startingBlockIndex + 1; i < endingBlockIndex; i++) {
        commands.push(new SetFormatCommand(i, 0, blocks[i].Text.length, style));
      }
    }

    this.executeCommand(commands, () => afterSelection, context);
  }

  //#endregion

  //#region History

  /**
   * Undoes last command.
   * @param context Context used for measuring text in `generateLines`
   */
  public undo(context: CanvasRenderingContext2D) {
    if (!this.history.isAtStart()) {
      const { blocks, selection } = this.history.undoLast(this.blocks, 1);
      this.blocks = blocks;
      this.selection = selection;
      this.generateLines(context, 500);
    }
  }

  /**
   * Redoes last undid command.
   * @param context Context used for measuring text in `generateLines`
   */
  public redo(context: CanvasRenderingContext2D) {
    if (!this.history.isAtEnd()) {
      const { blocks, selection } = this.history.redoLast(this.blocks, 1);
      this.blocks = blocks;
      this.selection = selection;
      this.generateLines(context, 500);
    }
  }

  //#endregion

  public getLineUnderCoords(x: number, y: number): TextLine {
    const { lines } = this;
    if (y <= lines[0].Y - lines[0].LineHeight) {
      return lines[0];
    }
    if (y > lines[lines.length - 1].Y) {
      return lines[lines.length - 1];
    }
    for (const line of lines) {
      if (line.Y - line.LineHeight <= y && y < line.Y) {
        return line;
      }
    }
    return lines[lines.length - 1];
  }

  /**
   * Returns a string of text from the editor formatted blocks starting at `index` through `length`.
   * @param blocks Editor blocks to get text from
   * @param startIndex Text start index
   * @param length Text length
   */
  private getTextFromBlocks(blocks: FormattedBlock[], startIndex: number, length: number): string {
    let textCounter = 0;
    let result = '';
    for (const block of blocks) {
      if (textCounter <= startIndex && startIndex < textCounter + block.Text.length) {
        if (length <= block.Text.length) {
          result += block.Text.slice(startIndex - textCounter, startIndex - textCounter + length);
          return result;
        } else {
          result += block.Text.slice(startIndex - textCounter);
          length -= block.Text.length;
        }
      } else {
        textCounter += block.Text.length;
      }
    }
    return result;
  }

  /**
   * Parses the backend data structure to Formatted Blocks.
   * @param formats Format stack
   * @param text Raw text
   */
  private parseDocument(blocks: BackendBlocks): FormattedBlock[] {
    const formattedBlocks = new Array<FormattedBlock>();

    for (const block of blocks) {
      formattedBlocks.push(new FormattedBlock(Style.fromJSON(block.style), block.text));
    }

    return formattedBlocks;
  }

  /**
   * Executes an EditorCommand.
   * @param command Command to execute
   * @param context Canvas context for command
   */
  private executeCommand(
    commands: EditorCommand[],
    selectionCallBack: () => Selection,
    context: CanvasRenderingContext2D,
  ) {
    const beforeSelection = this.selection.clone();
    const change = new Change(commands);
    this.blocks = change.execute(this.blocks);
    this.lines = this.generateLines(context, editorWidth);
    const afterSelection = selectionCallBack();
    this.history.push({ beforeSelection, change, afterSelection });
    this.selection = afterSelection;
  }

  /**
   * Generates command that removes current selection (if selection is expanded).
   * @param context Canvas context for command
   */
  private removeSelection = (context: CanvasRenderingContext2D) => {
    if (this.selection.isCollapsed) {
      throw Error('Selection is collapsed');
    }
    const commands = new Array<RemoveTextCommand>();
    const { blocks } = this;
    const { beginLine, beginOffset, finishLine, finishOffset } = this.selection.orderedSelection;

    const afterSelection = this.selection.clone().collapseToStart();

    const startingBlockIndex = this.getBlockIndexAtStart();
    const endingBlockIndex = this.getBlockIndexAtEnd();
    const startOffset = this.getOffsetInBlock(this.getIndexInText(beginLine, beginOffset), startingBlockIndex);
    const endOffset = this.getOffsetInBlock(this.getIndexInText(finishLine, finishOffset), endingBlockIndex);

    if (startingBlockIndex === endingBlockIndex) {
      commands.push(
        new RemoveTextCommand(
          startingBlockIndex,
          startOffset,
          blocks[startingBlockIndex].Text.slice(startOffset, endOffset),
        ),
      );
    } else if (endingBlockIndex - startingBlockIndex === 1) {
      commands.push(
        new RemoveTextCommand(startingBlockIndex, startOffset, blocks[startingBlockIndex].Text.slice(startOffset)),
      );
      commands.push(new RemoveTextCommand(endingBlockIndex, 0, blocks[endingBlockIndex].Text.slice(0, endOffset)));
    } else {
      commands.push(
        new RemoveTextCommand(startingBlockIndex, startOffset, blocks[startingBlockIndex].Text.slice(startOffset)),
      );
      commands.push(new RemoveTextCommand(endingBlockIndex, 0, blocks[endingBlockIndex].Text.slice(0, endOffset)));
      for (let i = startingBlockIndex + 1; i < endingBlockIndex; i++) {
        commands.push(new RemoveTextCommand(i, 0, blocks[i].Text));
      }
    }

    this.executeCommand(commands, () => afterSelection, context);
  };

  /**
   * Determines new line and offset when moved into `direction`, handling edge cases.
   * @param direction Direction to move selection to
   * @param line Starting line
   * @param offset Starting offset
   */
  private setSelectionInDirection = (
    direction: CursorDirection,
    line: Line,
    offset: Offset,
    steps: number = 1,
  ): { newLine: Line; newOffset: Offset } => {
    let newLine = line;
    let newOffset = offset;

    if (direction === CursorDirection.RIGHT) {
      while (steps > 0) {
        // Skip newline character
        if (this.lines[newLine].Text[newOffset] === '\n') {
          newLine += 1;
          newOffset = 0;
        }
        // determine if at end of line
        else if (newOffset === this.lines[newLine].Text.length) {
          // determine if at end of file, if yes, state remains unchanged
          if (newLine !== this.lines.length - 1) {
            newLine = newLine + 1;
            newOffset = 0;
          }
        } else {
          newOffset += 1;
        }
        steps -= 1;
      }
    } else if (direction === CursorDirection.LEFT) {
      while (steps > 0) {
        // determine if at beginning of line
        if (newOffset === 0) {
          // determine if at beginning of file
          if (newLine > 0) {
            newLine -= 1;
            newOffset = this.lines[newLine].Text.length - 1;
          }
        } else {
          newOffset -= 1;
        }
        steps -= 1;
      }
    }

    return { newLine, newOffset };
  };

  /**
   * Returns selection from a pair of x, y coordinates.
   * @param targetX Target X coordinate
   * @param targetY Target Y coordinate
   */
  private getSelectionFromCoords = (targetX: number, targetY: number, context: CanvasRenderingContext2D) => {
    let newLine: Line = 0;
    let newOffset: Offset = 0;
    if (targetY < this.lines[0].Y - this.lines[0].LineHeight) {
      if (targetX < this.lines[0].X) {
        return { newLine: 0, newOffset: 0 };
      } else if (targetX > this.lines[0].getWidth(context)) {
        return {
          newLine: 0,
          newOffset: this.lines[0].EndsInNewLine ? this.lines[0].Text.length - 1 : this.lines[0].Text.length,
        };
      }
      return { newLine: 0, newOffset: this.lines[0].getOffsetAt(targetX, context) };
    } else if (targetY > this.lines[this.lines.length - 1].Y) {
      if (targetX < this.lines[this.lines.length - 1].X) {
        return { newLine: this.lines.length - 1, newOffset: 0 };
      } else if (targetX > this.lines[this.lines.length - 1].getWidth(context)) {
        return {
          newLine: this.lines.length - 1,
          newOffset: this.lines[this.lines.length - 1].EndsInNewLine
            ? this.lines[this.lines.length - 1].Text.length - 1
            : this.lines[this.lines.length - 1].Text.length,
        };
      }
      return {
        newLine: this.lines.length - 1,
        newOffset: this.lines[this.lines.length - 1].getOffsetAt(targetX, context),
      };
    }
    // search for line
    for (let i = 0; i < this.lines.length; i++) {
      if (this.lines[i].Y >= targetY && targetY >= this.lines[i].Y - this.lines[i].LineHeight) {
        const line = this.lines[i];
        newLine = i;
        // search for offset
        if (targetX < 0) {
          return {
            newLine,
            newOffset: 0,
          };
        } else if (targetX > this.lines[i].getWidth(context)) {
          return {
            newLine,
            newOffset: this.lines[i].EndsInNewLine ? this.lines[i].Text.length - 1 : this.lines[i].Text.length,
          };
        }
        newOffset = line.getOffsetAt(targetX, context);
        return { newLine, newOffset };
      }
    }
    return { newLine: this.lines.length - 1, newOffset: this.lines[this.lines.length - 1].Text.length };
  };

  /**
   * Gets the word boundary in a given direction (LEFT, RIGHT) near a line, offset coordinate
   * @param direction Direction to start searching
   * @param line Target line
   * @param offset target offset
   */
  private getWordBoundaryInDirection(direction: CursorDirection, line: Line, offset: Offset): Offset {
    const text = this.lines[line].Text;
    const spaces = text
      .split('')
      .map((_, i: number) => i)
      .filter((i) => text[i] === ' ');
    for (let i = 0; i < spaces.length - 1; i++) {
      if (spaces[i] <= offset && spaces[i + 1] >= offset) {
        if (direction === CursorDirection.LEFT) {
          return spaces[i];
        } else if (direction === CursorDirection.RIGHT) {
          return spaces[i + 1];
        }
      }
    }
    return 0;
  }

  private getBlockIndexAtPoint(line: Line, offset: Offset): number {
    const { blocks } = this;
    const textIndex = this.getIndexInText(line, offset);
    let textCounter = 0;
    for (let i = 0; i < blocks.length; i++) {
      if (textCounter <= textIndex && textIndex <= textCounter + blocks[i].Text.length) {
        return i;
      }
      textCounter += blocks[i].Text.length;
    }
    return blocks.length - 1;
  }

  private getIndexInText(line: Line, offset: Offset): number {
    let index = 0;
    for (let i = 0; i < line; i++) {
      index += this.lines[i].TextLength;
    }
    index += offset;
    return index;
  }

  private getOffsetInBlock(indexInText: number, blockIndex: number): number {
    let textCounter = 0;
    for (let i = 0; i < blockIndex; i++) {
      textCounter += this.blocks[i].Text.length;
    }
    return indexInText - textCounter;
  }

  /**
   * Gets collapsed cursor coords near a (line, offset) coordinate
   * @param context Canvas context used for measuring text
   * @param line Target line
   * @param offset Target offset
   */
  private getCursorCoords(
    context: CanvasRenderingContext2D,
    line: Line,
    offset: Offset,
  ): { x: number; y: number; height: number } {
    const { x, y } = this.lines[line].getCursorCoordsAt(offset, context);
    const height = this.lines[line].getHeight(context);
    return { x, y, height };
  }
}
