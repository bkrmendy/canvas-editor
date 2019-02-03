import { DisplayBlock } from '../Display/DisplayBlock';
import { Style } from '../Display/Styles';

const tokenize = (text: string): string[] => {
  const letters = text.split('');
  let words = [letters[0]];

  for (const char of letters.slice(1)) {
    const [last] = words.slice(-1);
    if (char === '\n') {
      words = [...words, char];
    } else if ((last.slice(-1) === ' ' && char !== ' ') || last === '\n') {
      words = [...words, char];
    } else {
      words = [...words.slice(0, -1), last + char];
    }
  }

  return words;
};

/**
 * FormattedBlcks are a logical unit of text that has the same formatting and possibly ends with a linebreak.
 * A string of characters with the same formatting but containing a newline character are broken up into two
 * FormattedBlocks in the parsing phase
 */
export class FormattedBlock {
  constructor(private style: Style, private text: string) {}

  /**
   * Accessor for text
   */
  get Text() {
    return this.text;
  }

  /**
   * Setter for text
   */
  set Text(value: string) {
    this.text = value;
  }

  /**
   * Accessor for lineHeight
   */
  get Height() {
    return this.style.LineHeight;
  }

  /**
   * Accessor for the style field of this block
   */
  get Style() {
    return this.style;
  }

  /**
   * Setter for the Style field of this block
   */
  set Style(newValue: Style) {
    this.style = newValue;
  }

  /**
   * Breaks up the block into a set of DisplayBlocks that fit within the bounds of the editor, breaking on word
   * boundaries
   * @param startX X offset of first block
   * @param startY Y offset of first block
   * @param maxWidth Maximum width of editor, not to be exceeded by any block
   * @param context Canvas context used for measuring text
   */
  public break(
    startX: number,
    startY: number,
    maxWidth: number,
    context: CanvasRenderingContext2D,
  ): { brokenBlocks: DisplayBlock[]; newX: number; newY: number } {
    const displayBlocks = new Array<DisplayBlock>();
    const words = tokenize(this.text);
    let x = startX;
    let y = startY;
    let startIndex = 0;
    let textIndex = 1;

    context.font = this.style.CSS;

    while (textIndex < words.length) {
      if (words[textIndex - 1] === '\n') {
        displayBlocks.push(
          new DisplayBlock(
            this.style.CSS,
            this.style.LineHeight,
            words.slice(startIndex, textIndex).join(''),
            x,
            y,
            this.style.textColor,
            this.style.highLight,
            this.style.underLine,
          ),
        );
        startIndex = textIndex;
        x = 0;
        y += this.Height;
      } else if (context.measureText(words.slice(startIndex, textIndex).join('')).width > maxWidth - x) {
        displayBlocks.push(
          new DisplayBlock(
            this.style.CSS,
            this.style.LineHeight,
            words.slice(startIndex, textIndex - 1).join(''),
            x,
            y,
            this.style.textColor,
            this.style.highLight,
            this.style.underLine,
          ),
        );
        startIndex = textIndex - 1;
        x = 0;
        y += this.Height;
      }
      textIndex++;
    }

    if (startIndex < words.length) {
      const textFragment = words.slice(startIndex).join('');
      displayBlocks.push(
        new DisplayBlock(
          this.style.CSS,
          this.style.LineHeight,
          textFragment,
          x,
          y,
          this.style.textColor,
          this.style.highLight,
          this.style.underLine,
        ),
      );
      if (textFragment.slice(-1) === '\n') {
        x = 0;
        y += this.Height;
      } else {
        x += context.measureText(textFragment).width;
      }
    }

    return {
      brokenBlocks: displayBlocks,
      newX: x,
      newY: y,
    };
  }
}
