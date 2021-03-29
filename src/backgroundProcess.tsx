import React from 'react';
import { render } from 'react-dom';
import InitializeBackgroundProcess from './backgroundProcess';

InitializeBackgroundProcess();

render(<h1>Background Process</h1>, document.getElementById('root'));
