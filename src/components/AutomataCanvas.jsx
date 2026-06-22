import { useState, useRef, useCallback } from "react";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

const initialNodes = [];
const initialEdges = [];

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedTool, setSelectedTool] = useState(null);
  const nextNodeNumber = useRef(0);

  const { screenToFlowPosition } = useReactFlow();

  const handlePaneClick = useCallback(
    (event) => {
      if (selectedTool !== "add-node") {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeId = `q${nextNodeNumber.current}`;

      const newNode = {
        id: nodeId,
        position: position,
        data: {
          label: nodeId,
        },
      };

      setNodes((currentNodes) => [...currentNodes, newNode]);

      nextNodeNumber.current = nextNodeNumber.current + 1;
    },
    [selectedTool, screenToFlowPosition, setNodes]
  );

  function addEdge() {
    console.log("Add edge tool not built yet");
  }

  function addAcceptingState() {
    console.log("Add accepting state tool not built yet");
  }

  function addStartingState() {
    console.log("Add starting state tool not built yet");
  }

  function deleteTool() {
    console.log("Delete tool not built yet");
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handlePaneClick}
        fitView
      >
        <Panel position="top-left">
          <div className="app-heading">
            AutomataApp
          </div>
        </Panel>

        <Panel position="center-left">
          <div className="tools-panel">
            <button
              onClick={() => setSelectedTool("add-node")}
              className={selectedTool === "add-node" ? "tool-active" : ""}
            >
              Add Node
            </button>

            <button onClick={addEdge}>Add Edge</button>
            <button onClick={addAcceptingState}>Add Accepting State</button>
            <button onClick={addStartingState}>Add Starting State</button>
            <button onClick={deleteTool}>Delete Tool</button>
          </div>
        </Panel>

        <Panel position="center-right">
          <div className="regex-panel">
            <label className="regex-label">Regex Conversion</label>

            <div className="regex-input-row">
              <input
                type="text"
                placeholder="e.g. (a|b)*abb"
              />
              <button>Convert</button>
            </div>
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

function AutomataCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}

export default AutomataCanvas;