import * as React from 'react';
import * as ReactDOM from 'react-dom';
import EditorComponent from './EditorComponent';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<EditorComponent />, div);
  ReactDOM.unmountComponentAtNode(div);
});
