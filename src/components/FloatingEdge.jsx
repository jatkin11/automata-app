import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  Position,
} from "@xyflow/react";

function getNodeWidth(node) {
  return node.measured?.width ?? node.width ?? 150;
}

function getNodeHeight(node) {
  return node.measured?.height ?? node.height ?? 60;
}

function getNodeCenter(node) {
  const width = getNodeWidth(node);
  const height = getNodeHeight(node);

  return {
    x: node.internals.positionAbsolute.x + width / 2,
    y: node.internals.positionAbsolute.y + height / 2,
  };
}

function getFloatingPoint(fromNode, toNode) {
  const fromCenter = getNodeCenter(fromNode);
  const toCenter = getNodeCenter(toNode);

  const width = getNodeWidth(fromNode);
  const height = getNodeHeight(fromNode);

  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx === 0 && absDy === 0) {
    return {
      x: fromCenter.x + width / 2,
      y: fromCenter.y,
      position: Position.Right,
    };
  }

  if (absDx / width > absDy / height) {
    return {
      x: fromCenter.x + Math.sign(dx) * width / 2,
      y: fromCenter.y + dy * (width / 2) / absDx,
      position: dx > 0 ? Position.Right : Position.Left,
    };
  }

  return {
    x: fromCenter.x + dx * (height / 2) / absDy,
    y: fromCenter.y + Math.sign(dy) * height / 2,
    position: dy > 0 ? Position.Bottom : Position.Top,
  };
}

function getSelfLoopPath(node) {
  const width = getNodeWidth(node);
  const height = getNodeHeight(node);
  const center = getNodeCenter(node);

  const sourceX = center.x + width / 2;
  const sourceY = center.y;
  const targetX = center.x;
  const targetY = center.y - height / 2;

  const loopSize = 60;

  const path = `
    M ${sourceX} ${sourceY}
    C ${sourceX + loopSize} ${sourceY - loopSize},
      ${targetX + loopSize} ${targetY - loopSize},
      ${targetX} ${targetY}
  `;

  return {
    path,
    labelX: center.x + loopSize,
    labelY: center.y - loopSize,
  };
}

export default function FloatingEdge({
  id,
  source,
  target,
  label,
  markerEnd,
  style,
}) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  let edgePath;
  let labelX;
  let labelY;

  if (source === target) {
    const selfLoop = getSelfLoopPath(sourceNode);

    edgePath = selfLoop.path;
    labelX = selfLoop.labelX;
    labelY = selfLoop.labelY;
  } else {
    const sourcePoint = getFloatingPoint(sourceNode, targetNode);
    const targetPoint = getFloatingPoint(targetNode, sourceNode);

    const [path, calculatedLabelX, calculatedLabelY] = getBezierPath({
      sourceX: sourcePoint.x,
      sourceY: sourcePoint.y,
      sourcePosition: sourcePoint.position,
      targetX: targetPoint.x,
      targetY: targetPoint.y,
      targetPosition: targetPoint.position,
    });

    edgePath = path;
    labelX = calculatedLabelX;
    labelY = calculatedLabelY;
  }

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
            className="floating-edge-label"
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