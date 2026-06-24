import { Handle, Position } from "@xyflow/react";

export default function AutomataNode({ data, selected }) {
  return (
    <div
      className={[
        "automata-node",
        data.start ? "automata-node--start" : "",
        data.accepting ? "automata-node--accepting" : "",
        selected ? "automata-node--selected" : "",
      ].join(" ")}
    >
      {data.start && <div className="automata-start-arrow">→</div>}

      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        className="automata-handle"
      />

      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        className="automata-handle"
      />

      <Handle
        id="top-source"
        type="source"
        position={Position.Top}
        className="automata-loop-handle automata-loop-source"
      />

      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        className="automata-loop-handle automata-loop-target"
      />

      <span className="automata-node-label">{data.label}</span>
    </div>
  );
}