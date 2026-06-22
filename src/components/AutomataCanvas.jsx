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
  addEdge as addReactFlowEdge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

const initialNodes = [];
const initialEdges = [];

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedTool, setSelectedTool] = useState("select");
  const [selectedItem, setSelectedItem] = useState(null);

  const [automataType, setAutomataType] = useState("NFA");
  const [convertedRegex, setConvertedRegex] = useState("");

  const nextNodeNumber = useRef(0);

  const { screenToFlowPosition } = useReactFlow();

  const handlePaneClick = useCallback(
    (event) => {
      if (selectedTool !== "add-node") {
        setSelectedItem(null);
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeId = `q${nextNodeNumber.current}`;

      const newNode = {
        id: nodeId,
        position: {
          x: position.x - 30,
          y: position.y - 30,
        },
        data: {
          label: nodeId,
        },
      };

      setNodes((currentNodes) => [...currentNodes, newNode]);

      nextNodeNumber.current = nextNodeNumber.current + 1;
    },
    [selectedTool, screenToFlowPosition, setNodes]
  );

  const handleConnect = useCallback(
    (connection) => {
      if (selectedTool !== "add-edge") {
        return;
      }

      const edgeLabel = prompt("Enter transition symbol:");

      const newEdge = {
        ...connection,
        id: `${connection.source}-${connection.target}-${Date.now()}`,
        label: edgeLabel || "",
        type: "smoothstep",
      };

      setEdges((currentEdges) =>
        addReactFlowEdge(newEdge, currentEdges)
      );
    },
    [selectedTool, setEdges]
  );

  const handleSelectionChange = useCallback(({ nodes, edges }) => {
    if (nodes.length > 0) {
      setSelectedItem({
        type: "node",
        item: nodes[0],
      });
      return;
    }

    if (edges.length > 0) {
      setSelectedItem({
        type: "edge",
        item: edges[0],
      });
      return;
    }

    setSelectedItem(null);
  }, []);

  function handleConvertToRegex() {
    setConvertedRegex("(placeholder-regex)");
  }

  function handleConvertToDFA() {
    console.log("Convert to DFA placeholder");
  }

  return (
    <div className="canvas-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handlePaneClick}
        onConnect={handleConnect}
        onSelectionChange={handleSelectionChange}
        nodesConnectable={selectedTool === "add-edge"}
        fitView
      >
        <Panel position="top-left">
          <div className="app-heading">
            AutomataApp
          </div>
        </Panel>

        <Panel position="center-left">
          <div className="left-tool-stack">
            <div className="tools-panel">
              <div className="automata-toggle">
                <button
                  onClick={() => setAutomataType("NFA")}
                  className={automataType === "NFA" ? "toggle-active" : ""}
                >
                  NFA
                </button>

                <button
                  onClick={() => setAutomataType("DFA")}
                  className={automataType === "DFA" ? "toggle-active" : ""}
                >
                  DFA
                </button>
              </div>

              <button
                onClick={() => setSelectedTool("select")}
                className={selectedTool === "select" ? "tool-active" : ""}
              >
                Select / Move
              </button>

              <button
                onClick={() => setSelectedTool("add-node")}
                className={selectedTool === "add-node" ? "tool-active" : ""}
              >
                Add Node
              </button>

              <button
                onClick={() => setSelectedTool("add-edge")}
                className={selectedTool === "add-edge" ? "tool-active" : ""}
              >
                Add Edge
              </button>

              <button>Add Accepting State</button>
              <button>Add Starting State</button>
              <button>Delete Tool</button>
            </div>

            <div className="conversion-panel">
              <div className="conversion-title">
                {automataType} Conversion
              </div>

              {automataType === "NFA" && (
                <button onClick={handleConvertToDFA}>
                  Convert to DFA
                </button>
              )}

              <button onClick={handleConvertToRegex}>
                Convert to Regex
              </button>

              {convertedRegex && (
                <div className="converted-regex-output">
                  <strong>Regex:</strong> {convertedRegex}
                </div>
              )}
            </div>

            <div className="regex-panel">
              <label className="regex-label">
                Regex Conversion
              </label>

              <div className="regex-input-row">
                <input
                  type="text"
                  placeholder="e.g. (a|b)*abb"
                />
                <button>Convert to NFA</button>
              </div>
            </div>
          </div>
        </Panel>

        {selectedItem && (
          <Panel position="bottom-right">
            <div className="inspector-panel">
              <h3>
                Selected {selectedItem.type}
              </h3>

              {selectedItem.type === "node" && (
                <>
                  <p>
                    <strong>ID:</strong> {selectedItem.item.id}
                  </p>
                  <p>
                    <strong>Label:</strong> {selectedItem.item.data?.label}
                  </p>
                  <p>
                    <strong>X:</strong>{" "}
                    {Math.round(selectedItem.item.position.x)}
                  </p>
                  <p>
                    <strong>Y:</strong>{" "}
                    {Math.round(selectedItem.item.position.y)}
                  </p>
                </>
              )}

              {selectedItem.type === "edge" && (
                <>
                  <p>
                    <strong>ID:</strong> {selectedItem.item.id}
                  </p>
                  <p>
                    <strong>From:</strong> {selectedItem.item.source}
                  </p>
                  <p>
                    <strong>To:</strong> {selectedItem.item.target}
                  </p>
                  <p>
                    <strong>Label:</strong>{" "}
                    {selectedItem.item.label || "none"}
                  </p>
                </>
              )}
            </div>
          </Panel>
        )}

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