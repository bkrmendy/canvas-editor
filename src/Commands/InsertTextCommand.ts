import { FormattedBlock } from '../Model/FormattedBlock';
import { EditorActions } from './EditorAction';
import { EditorCommand } from './EditorCommand';
import { RemoveTextCommand } from './RemoveTextCommand';

/**
 * Encapsulates the action of inserting a new string of characters into a FormattedBlock at a given index
 */
export class InsertTextCommand extends EditorCommand {
  constructor(public readonly inBlock: number, public readonly at: number, public readonly toInsert: string) {
    super(EditorActions.ADD_TEXT);
  }

  public get Inverse() {
    return new RemoveTextCommand(this.inBlock, this.at, this.toInsert);
  }

  public execute(blocks: FormattedBlock[]): FormattedBlock[] {
    if (this.at < blocks[this.inBlock].Text.length) {
      const newBlock = new FormattedBlock(
        blocks[this.inBlock].Style,
        blocks[this.inBlock].Text.slice(0, this.at) + this.toInsert + blocks[this.inBlock].Text.slice(this.at)
      );
      return [...blocks.slice(0, this.inBlock), newBlock, ...blocks.slice(this.inBlock + 1)];
    }
    const lastBlock = blocks[blocks.length - 1]
    return [...blocks.slice(0, -1), new FormattedBlock(lastBlock.Style, lastBlock.Text + this.toInsert)]
  }
}
