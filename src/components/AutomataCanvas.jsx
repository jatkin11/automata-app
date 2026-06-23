import { useState, useRef, useCallback, useMemo } from "react";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  MarkerType,
  useEdgesState,
  useNodesState,
  useReactFlow,
  addEdge as addReactFlowEdge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
  handleConvertFromRegexToNFA,
  handleConvertToDFA,
  handleConvertFromAutomataToRegex,
} from "../api/automataApi";

import FloatingEdge from "./FloatingEdge";

const initialNodes = [];
const initialEdges = [];

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedTool, setSelectedTool] = useState("select");
  const [selectedItem, setSelectedItem] = useState(null);

  const [automataType, setAutomataType] = useState("NFA");
  const [convertedRegex, setConvertedRegex] = useState("");

  const [regexInput, setRegexInput] = useState("");

  const nextNodeNumber = useRef(0);

  const { screenToFlowPosition } = useReactFlow();

  const edgeTypes = useMemo(
    () => ({
      floating: FloatingEdge,
    }),
    []
  );

  const selectedNode =
    selectedItem?.type === "node"
      ? nodes.find((node) => node.id === selectedItem.id)
      : null;

  const selectedEdge =
    selectedItem?.type === "edge"
      ? edges.find((edge) => edge.id === selectedItem.id)
      : null;

  function getCurrentGraph() {
    return {
      automataType,
      nodes,
      edges,
    };
  }

  function makeFloatingEdges(graphEdges) {
    return graphEdges.map((edge) => ({
      ...edge,
      type: "floating",
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: {
        ...edge.style,
        strokeWidth: 3,
      },
    }));
  }

  function updateNextNodeNumberFromGraph(graphNodes) {
    let highestNodeNumber = -1;

    graphNodes.forEach((node) => {
      const textToCheck = `${node.id} ${node.data?.label ?? ""}`;
      const matches = textToCheck.matchAll(/q(\d+)/g);

      for (const match of matches) {
        const number = Number(match[1]);

        if (number > highestNodeNumber) {
          highestNodeNumber = number;
        }
      }
    });

    nextNodeNumber.current = highestNodeNumber + 1;
  }

  function applyReturnedGraph(result) {
    if (!result) {
      return;
    }

    const returnedNodes = result.nodes ?? [];
    const returnedEdges = makeFloatingEdges(result.edges ?? []);

    setNodes(returnedNodes);
    setEdges(returnedEdges);

    if (result.automataType) {
      setAutomataType(result.automataType);
    }

    setSelectedItem(null);
    updateNextNodeNumberFromGraph(returnedNodes);
  }

  async function convertNfaToDfa() {
    const result = await handleConvertToDFA(getCurrentGraph());
    applyReturnedGraph(result);
  }

  async function convertRegexToNFA(regexInput) {
    const result = await handleConvertFromRegexToNFA(regexInput);

    applyReturnedGraph(result);
    setAutomataType("NFA");
  }

  async function convertToRegex() {
    const result = await handleConvertFromAutomataToRegex(getCurrentGraph());

    if (!result) {
      return;
    }

    setConvertedRegex(result);
  }

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
          start: false,
          accepting: false,
        },
      };

      setNodes((currentNodes) => [...currentNodes, newNode]);

      setSelectedItem({
        type: "node",
        id: nodeId,
      });

      nextNodeNumber.current = nextNodeNumber.current + 1;
    },
    [selectedTool, screenToFlowPosition, setNodes]
  );

  const handleNodeClick = useCallback(
    (event, clickedNode) => {
      setSelectedItem({
        type: "node",
        id: clickedNode.id,
      });

      if (selectedTool === "delete") {
        setNodes((currentNodes) =>
          currentNodes.filter((node) => node.id !== clickedNode.id)
        );

        setEdges((currentEdges) =>
          currentEdges.filter(
            (edge) =>
              edge.source !== clickedNode.id && edge.target !== clickedNode.id
          )
        );

        setSelectedItem(null);
        return;
      }

      if (selectedTool === "add-accepting-state") {
        setNodes((currentNodes) =>
          currentNodes.map((node) =>
            node.id === clickedNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    accepting: !Boolean(node.data?.accepting),
                  },
                }
              : node
          )
        );

        return;
      }

      if (selectedTool === "add-start-state") {
        setNodes((currentNodes) => {
          const clickedNodeInCurrentState = currentNodes.find(
            (node) => node.id === clickedNode.id
          );

          const clickedNodeAlreadyStart = Boolean(
            clickedNodeInCurrentState?.data?.start
          );

          return currentNodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              start: clickedNodeAlreadyStart
                ? false
                : node.id === clickedNode.id,
            },
          }));
        });
      }
    },
    [selectedTool, setNodes, setEdges]
  );

  const handleEdgeClick = useCallback(
    (event, clickedEdge) => {
      event.stopPropagation();

      setSelectedItem({
        type: "edge",
        id: clickedEdge.id,
      });

      if (selectedTool === "delete") {
        setEdges((currentEdges) =>
          currentEdges.filter((edge) => edge.id !== clickedEdge.id)
        );

        setSelectedItem(null);
      }
    },
    [selectedTool, setEdges]
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
        type: "floating",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: {
          strokeWidth: 3,
        },
      };

      setEdges((currentEdges) => addReactFlowEdge(newEdge, currentEdges));
    },
    [selectedTool, setEdges]
  );

  const handleSelectionChange = useCallback(({ nodes, edges }) => {
    if (nodes.length > 0) {
      setSelectedItem({
        type: "node",
        id: nodes[0].id,
      });
      return;
    }

    if (edges.length > 0) {
      setSelectedItem({
        type: "edge",
        id: edges[0].id,
      });
      return;
    }

    setSelectedItem(null);
  }, []);

  return (
    <div className="canvas-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onConnect={handleConnect}
        onSelectionChange={handleSelectionChange}
        nodesConnectable={selectedTool === "add-edge"}
        fitView
      >
        <Panel position="top-left">
          <div className="app-heading">AutomataApp</div>
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

              <button
                onClick={() => setSelectedTool("add-accepting-state")}
                className={
                  selectedTool === "add-accepting-state" ? "tool-active" : ""
                }
              >
                Add Accepting State
              </button>

              <button
                onClick={() => setSelectedTool("add-start-state")}
                className={
                  selectedTool === "add-start-state" ? "tool-active" : ""
                }
              >
                Add Starting State
              </button>

              <button
                onClick={() => setSelectedTool("delete")}
                className={selectedTool === "delete" ? "tool-active" : ""}
              >
                Delete Tool
              </button>
            </div>

            <div className="conversion-panel">
              <div className="conversion-title">{automataType} Conversion</div>

              {automataType === "NFA" && (
                <button onClick={convertNfaToDfa}>Convert to DFA</button>
              )}

              <button onClick={convertToRegex}>Convert to Regex</button>

              {convertedRegex && (
                <div className="converted-regex-output">
                  <strong>Regex:</strong> {convertedRegex}
                </div>
              )}
            </div>

            <div className="regex-panel">
              <label className="regex-label">Regex Conversion</label>

              <div className="regex-input-row">
                <input
                  type="text"
                  placeholder="e.g. (a|b)*abb"
                  value={regexInput}
                  onChange={(event) => setRegexInput(event.target.value)}
                />

                <button onClick={() => convertRegexToNFA(regexInput)}>
                  Convert to NFA
                </button>
              </div>
            </div>
          </div>
        </Panel>

        {(selectedNode || selectedEdge) && (
          <Panel position="bottom-right">
            <div className="inspector-panel">
              {selectedNode && (
                <>
                  <h3>Selected node</h3>

                  <p>
                    <strong>ID:</strong> {selectedNode.id}
                  </p>

                  <p>
                    <strong>Label:</strong> {selectedNode.data?.label}
                  </p>

                  <p>
                    <strong>Start state:</strong>{" "}
                    {selectedNode.data?.start ? "Yes" : "No"}
                  </p>

                  <p>
                    <strong>Accepting state:</strong>{" "}
                    {selectedNode.data?.accepting ? "Yes" : "No"}
                  </p>

                  <p>
                    <strong>X:</strong>{" "}
                    {Math.round(selectedNode.position.x)}
                  </p>

                  <p>
                    <strong>Y:</strong>{" "}
                    {Math.round(selectedNode.position.y)}
                  </p>
                </>
              )}

              {selectedEdge && (
                <>
                  <h3>Selected edge</h3>

                  <p>
                    <strong>ID:</strong> {selectedEdge.id}
                  </p>

                  <p>
                    <strong>From:</strong> {selectedEdge.source}
                  </p>

                  <p>
                    <strong>To:</strong> {selectedEdge.target}
                  </p>

                  <p>
                    <strong>Label:</strong>{" "}
                    {selectedEdge.label || "none"}
                  </p>
                </>
              )}
            </div>
          </Panel>
        )}

        <Background variant={BackgroundVariant.Lines} gap={24} size={1} />

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