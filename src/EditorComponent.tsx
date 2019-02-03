import { isKeyHotkey } from 'is-hotkey';
import * as React from 'react';
import { Cursor } from './Cursor/Cursor';
import { Editor } from './Editor';
import { editorWidth } from './utils/Constants';
import { setupCanvas } from './utils/setupCanvas';
import { BackendBlocks } from './utils/Types';

const blocks: BackendBlocks = [
  {
    style: {
      fontStyle: 'normal',
      fontWeight: 'bold',
      lineHeight: 48,
      fontSize: 36,
      textColor: undefined,
      highLight: undefined,
      underLine: undefined,
    },
    text: 'Lorem ipsum\n',
  },
  {
    style: {
      fontStyle: 'normal',
      fontWeight: 'normal',
      lineHeight: 28,
      fontSize: 16,
      textColor: undefined,
      highLight: undefined,
    },
    text: 'Lorem ipsum ',
  },
  {
    style: {
      fontStyle: 'normal',
      fontWeight: 'bold',
      lineHeight: 28,
      fontSize: 16,
    },
    text: 'dolor sit amet,',
  },
  {
    style: {
      fontStyle: 'normal',
      fontWeight: 'normal',
      lineHeight: 28,
      fontSize: 16,
    },
    text:
      ' consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nLorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n',
  },
];

interface AppState {
  canvas: React.RefObject<HTMLCanvasElement>;
  container: React.RefObject<HTMLDivElement>;
  ctx?: CanvasRenderingContext2D;
  editor: Editor;
  cursor: Cursor;
  currentBlockInfo: string;
}

type Props = {};

/**
 * React component for editor
 */
class EditorComponent extends React.Component<Props, AppState> {
  private undoShortCut = isKeyHotkey('mod+z');
  private redoShortCut = isKeyHotkey('mod+shift+z');

  private boldShortCut = isKeyHotkey('mod+b');
  private italicShortCut = isKeyHotkey('mod+i');

  private deleteKey = isKeyHotkey('Delete');

  constructor(props: Props) {
    super(props);
    this.state = {
      canvas: React.createRef<HTMLCanvasElement>(),
      container: React.createRef<HTMLDivElement>(),
      ctx: undefined,
      editor: new Editor(blocks),
      cursor: new Cursor(0, 0, 0, 0),
      currentBlockInfo: '',
    };
  }

  public componentDidMount() {
    const { canvas, container, cursor, editor } = this.state;
    const ctx = setupCanvas(canvas.current!)!;

    if (canvas.current === null) {
      throw new Error('Canvas ref is not set to DOM element');
    }

    canvas.current!.focus();

    canvas.current!.addEventListener('keypress', this.onKeyPress);
    canvas.current!.addEventListener('keydown', this.onKeyDown);

    container.current!.addEventListener('mousemove', this.onMouseMove);
    container.current!.addEventListener('mousedown', this.onClick);

    document.addEventListener('copy', this.copy);
    document.addEventListener('paste', this.paste);
    document.addEventListener('cut', this.cut);

    cursor.drawState = ctx.getImageData(0, 0, canvas.current!.width, canvas.current!.height);

    this.setState({ ctx }, () => {
      editor.generateLines(ctx, editorWidth);
      this.drawOnCanvas();
    });
  }

  public render() {
    const { canvas, container } = this.state;
    return (
      <div className="container">
        <div>
          <div>
            <div className="buttons">
              <button onClick={() => this.setFormat('Title')}>Title</button>
              <button onClick={() => this.setFormat('Subtitle')}>Subtitle</button>
              <button onClick={() => this.setFormat('Plain')}>Normal</button>
              <button onClick={() => this.setFormat('Bold')}>Bold</button>
              <button onClick={() => this.setFormat('Italic')}>Italic</button>
            </div>
            <div>
              <button onClick={this.undo}>Undo</button>
              <button onClick={this.redo}>Redo</button>
            </div>
          </div>
          <div ref={container} className="canvasContainer">
            <canvas
              style={{ width: '500px', height: '500px', cursor: 'text', outline: 'none' }}
              tabIndex={0}
              ref={canvas}
            >
              Canvas
            </canvas>
          </div>
        </div>
      </div>
    );
  }

  private setFormat = (format: string) => {
    const { ctx, editor } = this.state;
    editor.setFormat(format, ctx!);
    this.drawOnCanvas();
  };

  private undo = () => {
    const { editor, ctx } = this.state;
    editor.undo(ctx!);
    this.drawOnCanvas();
  };

  private redo = () => {
    const { editor, ctx } = this.state;
    editor.redo(ctx!);
    this.drawOnCanvas();
  };

  private copy = (event: ClipboardEvent) => {
    event.preventDefault();
    const { editor } = this.state;
    if (editor.selection.isExtended) {
      const text = editor.copy();
      event.clipboardData.setData('text', text);
    }
  };

  private cut = (event: ClipboardEvent) => {
    event.preventDefault();
    const { ctx, editor } = this.state;
    if (editor.selection.isExtended) {
      const text = editor.cut(ctx!);
      event.clipboardData.setData('text', text);
      this.drawOnCanvas();
    }
  };

  private paste = (event: ClipboardEvent) => {
    event.preventDefault();
    const { ctx, editor } = this.state;
    const text = event.clipboardData.getData('text');
    editor.insertText(text, ctx!);
    this.drawOnCanvas();
  };

  private onKeyDown = (event: KeyboardEvent) => {
    const { keyCode, shiftKey } = event;
    const { ctx, cursor } = this.state;

    // Delete key, does not fire on KeyPress, has to be handled here
    if (this.undoShortCut(event)) {
      event.preventDefault();
      this.undo();
    } else if (this.boldShortCut(event)) {
      event.preventDefault();
      this.setFormat('Bold');
    } else if (this.italicShortCut(event)) {
      event.preventDefault();
      this.setFormat('Italic');
    } else if (this.redoShortCut(event)) {
      event.preventDefault();
      this.redo();
    } else if (this.deleteKey(event)) {
      event.preventDefault();
      this.state.editor.frontSpace(ctx!);
      this.drawOnCanvas();
    } else if (keyCode === 37 || keyCode === 39) {
      // User intends to extend the selection
      if (shiftKey) {
        this.state.editor.extendSelection(keyCode);
      }
      // Arrow navigation
      else {
        const selection = this.state.editor.selection;
        this.state.editor.selection = this.state.editor.moveSelection(selection, keyCode);
      }
      cursor.draw(this.state.editor.getSelection(ctx!), ctx!);
    } else if (keyCode === 38) {
      if (shiftKey) {
        const { selection } = this.state.editor;
        this.state.editor.selection = this.state.editor.extendSelectionTo(
          selection,
          cursor.endX,
          this.state.editor.PreviousLineY,
          ctx!,
        );
      } else {
        const { selection } = this.state.editor;
        this.state.editor.selection = this.state.editor.moveSelectionTo(
          selection,
          cursor.startX,
          this.state.editor.PreviousLineY,
          ctx!,
        );
      }
      cursor.draw(this.state.editor.getSelection(ctx!), ctx!);
    } else if (keyCode === 8) {
      event.preventDefault();
      this.state.editor.backSpace(ctx!);
      this.drawOnCanvas();
    } else if (keyCode === 40) {
      const { selection } = this.state.editor;
      if (shiftKey) {
        this.state.editor.selection = this.state.editor.extendSelectionTo(
          selection,
          cursor.endX,
          this.state.editor.NextLineY,
          ctx!,
        );
      } else {
        this.state.editor.selection = this.state.editor.moveSelectionTo(
          selection,
          cursor.startX,
          this.state.editor.NextLineY,
          ctx!,
        );
      }
      cursor.draw(this.state.editor.getSelection(ctx!), ctx!);
    }
  };

  private onKeyPress = (event: KeyboardEvent) => {
    const { which, metaKey } = event;
    const { ctx } = this.state;

    // Enter
    if (which === 13) {
      this.state.editor.enter(ctx!);
    }
    // Any other printable key
    else if (!metaKey) {
      const text = String.fromCharCode(which);
      this.state.editor.insertText(text, ctx!);
    }
    this.drawOnCanvas();
  };

  private onClick = (event: MouseEvent) => {
    const { clientX, clientY, shiftKey, detail } = event;
    const { cursor, ctx } = this.state;
    const { x: canvasX, y: canvasY } = this.toCanvasCoords(clientX, clientY);
    if (detail === 2) {
      this.state.editor.selectWordAt(canvasX, canvasY, ctx!);
    } else if (detail === 3) {
      this.state.editor.selectLineAt(canvasX, canvasY, ctx!);
    } else if (shiftKey) {
      const { selection } = this.state.editor;
      this.state.editor.extendSelectionTo(selection, canvasX, canvasY, ctx!);
    } else {
      const { selection } = this.state.editor;
      this.state.editor.moveSelectionTo(selection, canvasX, canvasY, ctx!);
    }
    cursor.draw(this.state.editor.getSelection(ctx!), ctx!);
  };

  private onMouseMove = (event: MouseEvent) => {
    const { buttons, clientX, clientY } = event;
    const { ctx, cursor } = this.state;
    const { x: canvasX, y: canvasY } = this.toCanvasCoords(clientX, clientY);
    if (buttons === 1) {
      const { selection } = this.state.editor;
      this.state.editor.extendSelectionTo(selection, canvasX, canvasY, ctx!);
      cursor.draw(this.state.editor.getSelection(ctx!), ctx!);
    } else {
      const line = this.state.editor.getLineUnderCoords(canvasX, canvasY);
      const block = line.displayBlockUnderMouse(canvasX, canvasY, ctx!);
      if (block) {
        this.setState({ currentBlockInfo: block.Text });
      }
      this.drawOnCanvas();
    }
  };

  private drawOnCanvas = () => {
    // TODO: optimize line (and eventually page) rendering
    const { editor, cursor, canvas, ctx } = this.state;

    const lines = editor.Lines;

    ctx!.clearRect(0, 0, editorWidth, editorWidth);

    for (const line of lines) {
      line.draw(ctx!);
    }

    cursor.drawState = ctx!.getImageData(0, 0, canvas.current!.width, canvas.current!.height);
    cursor.draw(this.state.editor.getSelection(ctx!), ctx!);
  };

  /**
   * Translates click coords from client space to canvas space
   */
  private toCanvasCoords = (x: number, y: number) => {
    const { container } = this.state;
    const offset = 0;
    const rect = container.current!.getBoundingClientRect();
    return { x: x - offset - rect.left, y: y - offset - rect.top };
  };
}

export default EditorComponent;
