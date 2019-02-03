import { Selection } from '../Model/Selection';
import { Change } from './Change';

export interface ChangeSnapshot {
  readonly beforeSelection: Selection;
  readonly change: Change;
  readonly afterSelection: Selection;
}
