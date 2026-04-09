import { useMemo } from "react";

interface NeuralVisualizationProps {
  connectionStrength: number;
  pulseKey: number;
  isLearned: boolean;
}

type NodePoint = {
  id: string;
  x: number;
  y: number;
};

type Edge = {
  from: string;
  to: string;
};

const nodes: NodePoint[] = [
  { id: "n1", x: 60, y: 70 },
  { id: "n2", x: 170, y: 35 },
  { id: "n3", x: 170, y: 110 },
  { id: "n4", x: 280, y: 70 },
];

const edges: Edge[] = [
  { from: "n1", to: "n2" },
  { from: "n1", to: "n3" },
  { from: "n2", to: "n4" },
  { from: "n3", to: "n4" },
];

const nodeById = new Map(nodes.map((node) => [node.id, node]));

const NeuralVisualization = ({
  connectionStrength,
  pulseKey,
  isLearned,
}: NeuralVisualizationProps) => {
  const normalizedStrength = Math.min(connectionStrength, 8);
  const strokeWidth = 2 + normalizedStrength * 0.8;
  const edgeOpacity = 0.35 + normalizedStrength * 0.08;

  const animationDuration = useMemo(
    () => `${Math.max(0.9, 1.5 - normalizedStrength * 0.08)}s`,
    [normalizedStrength],
  );

  return (
    <div className="rounded-xl border border-cyan-300/20 bg-black/20 p-4">
      <svg viewBox="0 0 340 150" className="w-full h-auto" role="img" aria-label="Neural graph visualization">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isLearned ? "#86efac" : "#67e8f9"} stopOpacity="0.95" />
            <stop offset="100%" stopColor={isLearned ? "#22c55e" : "#0ea5e9"} stopOpacity="0.35" />
          </radialGradient>
        </defs>

        {edges.map((edge) => {
          const fromNode = nodeById.get(edge.from);
          const toNode = nodeById.get(edge.to);
          if (!fromNode || !toNode) return null;

          return (
            <line
              key={`${edge.from}-${edge.to}-${pulseKey}`}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={isLearned ? "#34d399" : "#22d3ee"}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{ opacity: Math.min(edgeOpacity, 1), transition: "stroke-width 220ms ease, opacity 220ms ease" }}
            >
              <animate
                attributeName="stroke-opacity"
                values={`0.35;${Math.min(edgeOpacity + 0.25, 1)};${Math.min(edgeOpacity, 1)}`}
                dur={animationDuration}
                repeatCount="1"
              />
            </line>
          );
        })}

        {nodes.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={16} fill="url(#nodeGlow)">
              <animate
                attributeName="r"
                values="14;18;16"
                dur={animationDuration}
                repeatCount="1"
              />
            </circle>
            <circle cx={node.x} cy={node.y} r={5} fill={isLearned ? "#f0fdf4" : "#ecfeff"} />
          </g>
        ))}
      </svg>

      <div className="mt-3 flex items-center justify-between text-xs sm:text-sm text-cyan-100/90">
        <span>Connection strength: {connectionStrength}</span>
        <span className={isLearned ? "text-emerald-300 font-semibold" : "text-cyan-300"}>
          {isLearned ? "Learned state active" : "Reinforcement in progress"}
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-cyan-900/50">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isLearned ? "bg-emerald-400" : "bg-cyan-300"}`}
          style={{ width: `${Math.min(100, (connectionStrength / 3) * 100)}%` }}
        />
      </div>
    </div>
  );
};

export default NeuralVisualization;
