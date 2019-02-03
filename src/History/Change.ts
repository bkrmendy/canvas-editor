import { EditorCommand } from '../Commands/EditorCommand';
import { FormattedBlock } from '../Model/FormattedBlock';

export class Change {
  constructor(public readonly commands: EditorCommand[]) {}

  get Reverse() {
    return this.commands.map((command) => command.Inverse);
  }

  public execute(blocks: FormattedBlock[]): FormattedBlock[] {
    for (const command of this.commands) {
      blocks = command.execute(blocks);
    }
    return blocks;
  }
}
