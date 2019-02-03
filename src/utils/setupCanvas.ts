/**
 * Utility function for setting up canvas with a correct dpi value for device
 * Proudly stolen from: https://www.html5rocks.com/en/tutorials/canvas/hidpi/
 * @param canvas Canvas HTML DOM element
 */

export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | undefined {
  // Get the device pixel ratio, falling back to 1.
  const dpr = window.devicePixelRatio || 1;
  // Get the size of the canvas in CSS pixels.
  const rect = canvas.getBoundingClientRect();
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    return undefined;
  }
  // Scale all drawing operations by the dpr, so you
  // don't have to worry about the difference.
  ctx.scale(dpr, dpr);
  return ctx;
}
