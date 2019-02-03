import { FormattedBlock } from '../Model/FormattedBlock';
import { Selection } from '../Model/Selection';
import { ChangeSnapshot } from './ChangeSnapshot';

/**
 * Class encapsulating editor state history.
 * Implements a basic version of the Memento pattern (https://en.wikipedia.org/wiki/Memento_pattern), in the sense
 * that the text/formatting state is only kept through the commands (would be really impractical to keep the whole
 * text/formatting on every change), but the selection state is fully preserved in the selection stack.
 */
export class History {
  constructor(
    private snapshots: ChangeSnapshot[] = new Array<ChangeSnapshot>(),
    private pointer: number = -1 // history pointer, always points at topmost element
  ) { }

  /**
   * Returns whether the history pointer is at the bottom of the history (command/selection) stack.
   */
  public isAtStart() {
    return this.pointer === -1;
  }

  /**
   * Returns whether the history pointer is at the top of the history (command/selection) stack.
   */
  public isAtEnd() {
    return this.pointer === this.snapshots.length - 1;
  }

  /**
   * Increments the history pointer and pushes a new editor state on the history stack, truncating the history stacks
   * at the history pointer (no braching).
   * @param command New command to be added to the command stack
   * @param selection New seleciton state to be added to the selection state stack
   */
  public push(changeSnapshot: ChangeSnapshot): void {
    this.pointer += 1;
    this.snapshots = this.snapshots.slice(0, this.pointer);

    this.snapshots.push(changeSnapshot);
  }

  /**
   * Rolls back the last `n` changes, performing the inverse operations on `blocks`, returning the modified blocks and
   * the selection state after the rollback.
   * @param blocks Formatted blocks from editor to perform the undo command on
   * @param steps Number of changes to roll back
   */
  public undoLast(blocks: FormattedBlock[], steps: number): { blocks: FormattedBlock[]; selection: Selection } {
    let selection = this.snapshots[this.pointer].beforeSelection;
    while (this.pointer > -1 && steps > 0) {
      const inverseCommands = this.snapshots[this.pointer].change.Reverse
      for (const command of inverseCommands) {
        blocks = command.execute(blocks)
      }
      selection = this.snapshots[this.pointer].beforeSelection;
      this.pointer -= 1;
      steps -= 1;
    }
    return { blocks, selection };
  }

  /**
   * Redoes `n` changes after the current history pointer, performing the editing commands on `blocks`, returning the
   * modified blocks and the selection state after the rollback.
   * @param blocks Formatted blocks from editor to perform the undo command on
   * @param steps Number of changes to roll back
   */
  public redoLast(blocks: FormattedBlock[], steps: number): { blocks: FormattedBlock[]; selection: Selection } {
    let selection = this.snapshots[this.pointer + 1].afterSelection;
    while (this.pointer < this.snapshots.length && steps > 0) {
      this.pointer += 1;
      blocks = this.snapshots[this.pointer].change.execute(blocks);
      selection = this.snapshots[this.pointer].afterSelection;
      steps -= 1;
    }
    return { blocks, selection };
  }
}
