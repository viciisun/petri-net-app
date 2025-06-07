import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import ReactFlowCanvas from './components/ReactFlowCanvas';
import './App.css';

function App() {
  return (
    <div className="app">
      <ReactFlowProvider>
        <Header />
        <div className="main-content">
          <Toolbar />
          <div className="canvas-container">
            <ReactFlowCanvas />
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
}

export default App;
