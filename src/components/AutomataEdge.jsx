import { BaseEdge, EdgeLabelRenderer } from "@xyflow/react";

export default function AutomataEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  label,
  data,
}) {
  const offset = data?.curveOffset ?? 0;

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;

  const normalX = -dy / distance;
  const normalY = dx / distance;

  const controlX = midX + normalX * offset;
  const controlY = midY + normalY * offset;

  const labelX = midX + normalX * offset * 0.55;
  const labelY = midY + normalY * offset * 0.55;

  const edgePath = `
    M ${sourceX} ${sourceY}
    Q ${controlX} ${controlY}
      ${targetX} ${targetY}
  `;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            className="automata-edge-label"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}