import { useCallback, useMemo, useState } from "react";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  useEdgesState,
  useNodesState,
  addEdge as addReactFlowEdge,
  MarkerType,
  ConnectionMode,
} from "@xyflow/react";

import dagre from "@dagrejs/dagre";

import "@xyflow/react/dist/style.css";
import "./automata-flow.css";

import AutomataNode from "./AutomataNode";
import AutomataEdge from "./AutomataEdge";
import SelfLoopEdge from "./SelfLoopEdge";

import {
  handleConvertFromRegexToNFA,
  handleConvertToDFA,
} from "../api/automataApi";

const nodeTypes = {
  automata: AutomataNode,
};

const edgeTypes = {
  automataEdge: AutomataEdge,
  selfLoop: SelfLoopEdge,
};

const NODE_WIDTH = 64;
const NODE_HEIGHT = 64;

const initialNodes = [
  {
    id: "q0",
    type: "automata",
    position: { x: 100, y: 220 },
    data: {
      label: "q0",
      start: true,
      accepting: false,
    },
  },
];

const initialEdges = [];

function getEdgeId(source, target, label = "") {
  return `${source}-${target}-${label}-${Date.now()}`;
}

function ensureSingleStart(nodes) {
  if (nodes.length === 0) {
    return nodes;
  }

  let startIndex = nodes.findIndex((node) => Boolean(node.data?.start));

  if (startIndex === -1) {
    startIndex = 0;
  }

  return nodes.map((node, index) => ({
    ...node,
    data: {
      ...node.data,
      start: index === startIndex,
    },
  }));
}

function normaliseNodes(rawNodes = []) {
  const styledNodes = rawNodes.map((node, index) => ({
    ...node,
    id: String(node.id),
    type: "automata",
    position: node.position ?? {
      x: 100 + index * 150,
      y: 220,
    },
    data: {
      ...node.data,
      label: node.data?.label ?? node.label ?? String(node.id),
      start: Boolean(node.data?.start),
      accepting: Boolean(node.data?.accepting),
    },
  }));

  return ensureSingleStart(styledNodes);
}

function getBestHandlesForEdge(sourceNode, targetNode, isSelfLoop) {
  if (isSelfLoop) {
    return {
      sourceHandle: "top-left",
      targetHandle: "top-right",
    };
  }

  if (!sourceNode || !targetNode) {
    return {
      sourceHandle: "right",
      targetHandle: "left",
    };
  }

  const sourceX = sourceNode.position?.x ?? 0;
  const targetX = targetNode.position?.x ?? 0;

  if (sourceX <= targetX) {
    return {
      sourceHandle: "right",
      targetHandle: "left",
    };
  }

  return {
    sourceHandle: "left",
    targetHandle: "right",
  };
}

function normaliseEdges(rawEdges = [], nodes = []) {
  return rawEdges.map((edge) => {
    const source = String(edge.source);
    const target = String(edge.target);
    const label = edge.label ?? edge.data?.label ?? "";
    const isSelfLoop = source === target;

    const sourceNode = nodes.find((node) => node.id === source);
    const targetNode = nodes.find((node) => node.id === target);

    const { sourceHandle, targetHandle } = getBestHandlesForEdge(
      sourceNode,
      targetNode,
      isSelfLoop
    );

    return {
      ...edge,
      id: edge.id ?? getEdgeId(source, target, label),
      source,
      target,
      label,
      type: isSelfLoop ? "selfLoop" : "automataEdge",
      sourceHandle,
      targetHandle,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      data: {
        ...edge.data,
        label,
        curveOffset: 0,
      },
    };
  });
}

function combineParallelEdges(edges) {
  const grouped = new Map();

  for (const edge of edges) {
    const key = `${edge.source}__${edge.target}__${edge.sourceHandle}__${edge.targetHandle}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        ...edge,
        label: edge.label ? String(edge.label) : "",
        data: {
          ...edge.data,
          label: edge.label ? String(edge.label) : "",
        },
      });
    } else {
      const existing = grouped.get(key);

      const existingLabels = existing.label
        ? String(existing.label)
            .split(",")
            .map((label) => label.trim())
        : [];

      const newLabels = edge.label
        ? String(edge.label)
            .split(",")
            .map((label) => label.trim())
        : [];

      const mergedLabels = Array.from(
        new Set([...existingLabels, ...newLabels].filter(Boolean))
      );

      grouped.set(key, {
        ...existing,
        label: mergedLabels.join(", "),
        data: {
          ...existing.data,
          label: mergedLabels.join(", "),
        },
      });
    }
  }

  return Array.from(grouped.values());
}

function addCurveOffsets(edges) {
  return edges.map((edge) => {
    if (edge.source === edge.target) {
      return edge;
    }

    const hasReverseEdge = edges.some(
      (otherEdge) =>
        otherEdge.source === edge.target &&
        otherEdge.target === edge.source
    );

    if (!hasReverseEdge) {
      return {
        ...edge,
        data: {
          ...edge.data,
          curveOffset: 0,
        },
      };
    }

    const directionKey = `${edge.source}__${edge.target}`;

    const sortedDirectionKey =
      edge.source < edge.target
        ? `${edge.source}__${edge.target}`
        : `${edge.target}__${edge.source}`;

    const curveOffset = directionKey === sortedDirectionKey ? -55 : 55;

    return {
      ...edge,
      data: {
        ...edge.data,
        curveOffset,
      },
    };
  });
}

function prepareEdges(rawEdges = [], nodes = []) {
  const normalised = normaliseEdges(rawEdges, nodes);
  const combined = combineParallelEdges(normalised);
  return addCurveOffsets(combined);
}

function getNextNodeId(nodes) {
  const usedIds = new Set(nodes.map((node) => node.id));

  let index = 0;

  while (usedIds.has(`q${index}`)) {
    index++;
  }

  return `q${index}`;
}

function layoutWithDagre(nodes, edges, direction = "LR") {
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 120,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    if (edge.source !== edge.target) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const position = dagreGraph.node(node.id);

    if (!position) {
      return node;
    }

    return {
      ...node,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
    };
  });
}

function AutomataCanvasInner() {
  const [regexInput, setRegexInput] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.selected),
    [nodes]
  );

  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.selected),
    [edges]
  );

  const applyBackendGraph = useCallback(
    (graph) => {
      const styledNodes = normaliseNodes(graph.nodes ?? []);
      const laidOutNodes = layoutWithDagre(styledNodes, graph.edges ?? [], "LR");
      const styledEdges = prepareEdges(graph.edges ?? [], laidOutNodes);

      setNodes(laidOutNodes);
      setEdges(styledEdges);
    },
    [setNodes, setEdges]
  );

  const makeStartNode = useCallback(
    (nodeId) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            start: node.id === nodeId,
          },
        }))
      );
    },
    [setNodes]
  );

  const toggleAcceptingNode = useCallback(
    (nodeId) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  accepting: !node.data.accepting,
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const addNode = useCallback(() => {
    setNodes((currentNodes) => {
      const newNodeId = getNextNodeId(currentNodes);

      const newNode = {
        id: newNodeId,
        type: "automata",
        position: {
          x: 120 + currentNodes.length * 110,
          y: 260,
        },
        data: {
          label: newNodeId,
          start: currentNodes.length === 0,
          accepting: false,
        },
      };

      return ensureSingleStart([...currentNodes, newNode]);
    });
  }, [setNodes]);

  const deleteSelected = useCallback(() => {
    if (selectedNode) {
      setNodes((currentNodes) => {
        const remainingNodes = currentNodes.filter(
          (node) => node.id !== selectedNode.id
        );

        return ensureSingleStart(remainingNodes);
      });

      setEdges((currentEdges) =>
        addCurveOffsets(
          currentEdges.filter(
            (edge) =>
              edge.source !== selectedNode.id && edge.target !== selectedNode.id
          )
        )
      );

      return;
    }

    if (selectedEdge) {
      setEdges((currentEdges) =>
        addCurveOffsets(
          currentEdges.filter((edge) => edge.id !== selectedEdge.id)
        )
      );
    }
  }, [selectedNode, selectedEdge, setNodes, setEdges]);

  const layoutCurrentGraph = useCallback(() => {
    setNodes((currentNodes) => {
      const laidOutNodes = layoutWithDagre(currentNodes, edges, "LR");

      setEdges((currentEdges) => prepareEdges(currentEdges, laidOutNodes));

      return laidOutNodes;
    });
  }, [edges, setNodes, setEdges]);

  const onNodeDoubleClick = useCallback(
    (event, node) => {
      makeStartNode(node.id);
    },
    [makeStartNode]
  );

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      toggleAcceptingNode(node.id);
    },
    [toggleAcceptingNode]
  );

  const onEdgeDoubleClick = useCallback(
    (event, edge) => {
      event.preventDefault();

      const newLabel = window.prompt(
        "Transition symbol, e.g. a, b, ε",
        edge.label ?? ""
      );

      if (newLabel === null) {
        return;
      }

      const trimmedLabel = newLabel.trim();

      setEdges((currentEdges) =>
        currentEdges.map((currentEdge) =>
          currentEdge.id === edge.id
            ? {
                ...currentEdge,
                label: trimmedLabel,
                data: {
                  ...currentEdge.data,
                  label: trimmedLabel,
                },
              }
            : currentEdge
        )
      );
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (connection) => {
      const labelInput = window.prompt("Transition symbol, e.g. a, b, ε", "");

      if (labelInput === null) {
        return;
      }

      const label = labelInput.trim();
      const isSelfLoop = connection.source === connection.target;

      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      const { sourceHandle, targetHandle } = getBestHandlesForEdge(
        sourceNode,
        targetNode,
        isSelfLoop
      );

      const newEdge = {
        ...connection,
        id: getEdgeId(connection.source, connection.target, label),
        type: isSelfLoop ? "selfLoop" : "automataEdge",
        sourceHandle,
        targetHandle,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        label,
        data: {
          label,
          curveOffset: 0,
        },
      };

      setEdges((currentEdges) => {
        const updatedEdges = addReactFlowEdge(newEdge, currentEdges);
        const combinedEdges = combineParallelEdges(updatedEdges);

        return addCurveOffsets(combinedEdges);
      });
    },
    [nodes, setEdges]
  );

  const convertRegexToNFA = useCallback(async () => {
    const graph = await handleConvertFromRegexToNFA(regexInput);
    applyBackendGraph(graph);
  }, [regexInput, applyBackendGraph]);

  const convertToDFA = useCallback(async () => {
    const currentGraph = {
      automataType: "NFA",
      nodes,
      edges,
    };

    const graph = await handleConvertToDFA(currentGraph);
    applyBackendGraph(graph);
  }, [nodes, edges, applyBackendGraph]);

  return (
    <div className="canvas-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeDoubleClick={onEdgeDoubleClick}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />

        <Panel position="top-left" className="automata-panel">
          <div className="panel-row">
            <input
              className="regex-input"
              value={regexInput}
              onChange={(event) => setRegexInput(event.target.value)}
              placeholder="Enter regex e.g. (a|b)*abb"
            />

            <button onClick={convertRegexToNFA}>Regex → NFA</button>
            <button onClick={convertToDFA}>NFA → DFA</button>
            <button onClick={layoutCurrentGraph}>Auto layout</button>
          </div>

          <div className="panel-row">
            <button onClick={addNode}>Add state</button>

            <button
              onClick={() => selectedNode && makeStartNode(selectedNode.id)}
              disabled={!selectedNode}
            >
              Make start
            </button>

            <button
              onClick={() =>
                selectedNode && toggleAcceptingNode(selectedNode.id)
              }
              disabled={!selectedNode}
            >
              Toggle accepting
            </button>

            <button
              onClick={deleteSelected}
              disabled={!selectedNode && !selectedEdge}
            >
              Delete selected
            </button>
          </div>

          <div className="panel-help">
            Draw an edge to add a transition symbol. Double-click an edge to
            edit its symbol. Double-click a node to make it start. Right-click a
            node to toggle accepting.
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function AutomataCanvas() {
  return (
    <ReactFlowProvider>
      <AutomataCanvasInner />
    </ReactFlowProvider>
  );
}