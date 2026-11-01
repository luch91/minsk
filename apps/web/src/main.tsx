import React from 'react';
import { createRoot } from 'react-dom/client';
import MinskApp from './MinskApp';
import './workbench/styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><MinskApp /></React.StrictMode>);
