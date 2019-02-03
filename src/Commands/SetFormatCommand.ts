import { Style, Styles } from '../Display/Styles';
import { FormattedBlock } from '../Model/FormattedBlock';
import { EditorActions } from './EditorAction';
import { EditorCommand } from './EditorCommand';

/**
 * Encapsulates the action of setting the formatting on a string of characters, from a given index through length
 * Creates new blocks
 */
export class SetFormatCommand extends EditorCommand {
  constructor(
    public readonly inBlock: number,
    public readonly from: number,
    public readonly to: number,
    public readonly style: Style,
  ) {
    super(EditorActions.SET_FORMAT);
  }

  public get Inverse() {
    return new SetFormatCommand(this.inBlock, this.from, this.to, Styles.Plain);
  }

  public execute(blocks: FormattedBlock[]): FormattedBlock[] {
    const affectedBlock = blocks[this.inBlock];
    const newBlocks = [
      new FormattedBlock(affectedBlock.Style, affectedBlock.Text.slice(0, this.from)),
      new FormattedBlock(this.style, affectedBlock.Text.slice(this.from, this.to)),
      new FormattedBlock(affectedBlock.Style.clone(), affectedBlock.Text.slice(this.to)),
    ].filter((b) => b.Text.length > 0);
    return [...blocks.slice(0, this.inBlock), ...newBlocks, ...blocks.slice(this.inBlock + 1)];
  }
}
