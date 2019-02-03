export class RGB {
  public readonly r: number;
  public readonly g: number;
  public readonly b: number;

  // numbers are capped between 0 and 255
  constructor(r: number, g: number, b: number) {
    this.r = r % 255;
    this.g = g % 255;
    this.b = b % 255;
  }

  get CSS() {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }
}
