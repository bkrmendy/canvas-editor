import { IRGBA } from './Types';

export class RGBA {
  public readonly r: number;
  public readonly g: number;
  public readonly b: number;
  public readonly a: number;

  // numbers are capped between 0 and 255
  constructor(r: number, g: number, b: number, a: number) {
    this.r = r % 256;
    this.g = g % 256;
    this.b = b % 256;
    if (a > 1.0) {
      this.a = 1.0;
    } else if (a < 0) {
      this.a = 0.0;
    } else {
      this.a = a;
    }
  }

  public static fromJSON(rgbaJSON: IRGBA) {
    return new RGBA(rgbaJSON.r, rgbaJSON.g, rgbaJSON.b, rgbaJSON.a);
  }

  get CSS() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }
}
