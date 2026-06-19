import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Panel
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

const initialNodes = [];

const initialEdges = [];

function AutomataCanvas() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>

        <Panel position="top-left">
          <div className="app-heading">
            AutomataApp
          </div>
        </Panel>

        <Panel position="center-left">
          <div className="tools-panel">
            <button>Add Node</button>
            <button>Add Edge</button>
            <button>Add Accepting State</button>
            <button>Add Starting State</button>
            <button>Delete Tool</button>
          </div>
        </Panel>

        <Panel position="center-right">
          <div className="info-panel">
            <input
              type="text"
              placeholder="Enter regex, e.g. (a|b)*abb"
            />
            <button>Convert to NFA</button>
          </div>
        </Panel>

        <Background
          variant={BackgroundVariant.Lines}
          gap={24}
          size={1}
        />

        <Controls />
      </ReactFlow>
    </div>
  );
}

export default AutomataCanvas;