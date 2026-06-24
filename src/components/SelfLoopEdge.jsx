import { BaseEdge, EdgeLabelRenderer } from "@xyflow/react";

export default function SelfLoopEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  label,
}) {
  const loopHeight = 75;
  const loopWidth = 80;

  const edgePath = `
    M ${sourceX} ${sourceY}
    C ${sourceX - loopWidth} ${sourceY - loopHeight},
      ${targetX + loopWidth} ${targetY - loopHeight},
      ${targetX} ${targetY}
  `;

  const labelX = (sourceX + targetX) / 2;
  const labelY = Math.min(sourceY, targetY) - loopHeight - 10;

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
            className="self-loop-label"
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