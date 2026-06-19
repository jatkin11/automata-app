import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

const initialNodes = [];

const initialEdges = [];

function AutomataCanvas() {
  return (
    <div style={{ width: "100vh", height: "100vh" }}>
      <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
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