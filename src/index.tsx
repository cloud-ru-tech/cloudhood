import React, { StrictMode } from 'react';
import { render } from 'react-dom';
import { App } from './app/App';
import './index.css'

render(
  <StrictMode>
    <App />
  </StrictMode>,
  window.document.querySelector('#app-container')
);

// TODO: add typings
// @ts-ignore
if (module.hot) module.hot.accept();
