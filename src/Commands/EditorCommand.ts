import { FormattedBlock } from '../Model/FormattedBlock';
import { EditorActions } from './EditorAction';

/**
 * Abstract base class for editor commands
 * (Command design pattern https://en.wikipedia.org/wiki/Command_pattern)
 */
export abstract class EditorCommand {
  constructor(public readonly action: EditorActions) { }

  public abstract get Inverse(): EditorCommand;
  public abstract execute(blocks: FormattedBlock[]): FormattedBlock[];
}
