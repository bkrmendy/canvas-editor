import { FormattedBlock } from '../Model/FormattedBlock';
import { EditorActions } from './EditorAction';
import { EditorCommand } from './EditorCommand';
import { InsertTextCommand } from './InsertTextCommand';

/**
 * Encapsulates the action of removing a string of characters of `length` length starting from a given index
 */
export class RemoveTextCommand extends EditorCommand {
  constructor(public readonly inBlock: number, public readonly at: number, public readonly text: string) {
    super(EditorActions.REMOVE_TEXT);
  }

  public get Inverse(): EditorCommand {
    return new InsertTextCommand(this.inBlock, this.at, this.text);
  }

  public execute(blocks: FormattedBlock[]): FormattedBlock[] {
    const affectedBlock = blocks[this.inBlock];
    return [
      ...blocks.slice(0, this.inBlock),
      new FormattedBlock(
        affectedBlock.Style,
        affectedBlock.Text.slice(0, this.at) + affectedBlock.Text.slice(this.at + this.text.length),
      ),
      ...blocks.slice(this.inBlock + 1),
    ];
  }
}
