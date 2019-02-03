import { RGBA } from '../utils/RGBA';
import { BackendStyle } from '../utils/Types';

/**
 * Typedef for CSS font weight property subset used by current styles
 * Reference: https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight
 */
type FontWeight = 'bold' | 'normal';

/**
 * Typedef for CSS font style property subset used by current styles
 * Reference: https://developer.mozilla.org/en-US/docs/Web/CSS/font-style
 */
type FontStyle = 'italic' | 'normal';

/**
 * Class for CSS font attributes used by the editor styles
 * Reference: https://developer.mozilla.org/en-US/docs/Web/CSS/font
 */
export class Style {
  constructor(
    private fontStyle: FontStyle = 'normal',
    private fontWeight: FontWeight = 'normal',
    private lineHeight: number = 28,
    private fontSize: number = 16,
    public textColor: RGBA = new RGBA(0, 0, 0, 1),
    public highLight?: RGBA,
    public underLine?: RGBA,
  ) {}

  static fromJSON(styleJSON: BackendStyle) {
    let highLight;
    let underLine;
    let textColor = new RGBA(0, 0, 0, 1);
    if (styleJSON.highLight) {
      highLight = RGBA.fromJSON(styleJSON.highLight);
    }
    if (styleJSON.underLine) {
      underLine = RGBA.fromJSON(styleJSON.underLine);
    }
    if (styleJSON.textColor) {
      textColor = RGBA.fromJSON(styleJSON.textColor);
    }
    return new Style(
      styleJSON.fontStyle as FontStyle,
      styleJSON.fontWeight as FontWeight,
      styleJSON.lineHeight,
      styleJSON.fontSize,
      textColor,
      highLight,
      underLine,
    );
  }

  get FontStyle() {
    return this.fontStyle;
  }
  set FontStyle(newValue: FontStyle) {
    if (this.fontStyle === newValue) {
      this.fontStyle = 'normal';
    } else {
      this.fontStyle = newValue;
    }
  }

  get FontWeight() {
    return this.fontWeight;
  }
  set FontWeight(newValue: FontWeight) {
    if (this.fontWeight === newValue) {
      this.fontWeight = 'normal';
    } else {
      this.fontWeight = newValue;
    }
  }

  get LineHeight() {
    return this.lineHeight;
  }

  /**
   * Returns attributes as CSS font string
   */
  get CSS(): string {
    return `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px serif`;
  }

  public clone(): Style {
    return new Style(this.fontStyle, this.fontWeight, this.lineHeight, this.fontSize);
  }
}

const TitleStyle = new Style('normal', 'bold', 48, 36);
const SubtitleStyle = new Style('normal', 'normal', 37, 28);
const PlainStyle = new Style('normal', 'normal', 28, 16);
const EmphasizedStyle = new Style('normal', 'bold', 28, 16);
const ItalicStyle = new Style('italic', 'normal', 28, 16);

export const Styles = {
  Title: TitleStyle,
  Subtitle: SubtitleStyle,
  Plain: PlainStyle,
  Bold: EmphasizedStyle,
  Italic: ItalicStyle,
};
