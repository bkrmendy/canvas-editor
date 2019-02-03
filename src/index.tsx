import * as React from 'react';
import * as ReactDOM from 'react-dom';
import EditorComponent from './EditorComponent';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<EditorComponent />, document.getElementById('root') as HTMLElement);
registerServiceWorker();
