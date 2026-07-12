"use client";
import { motion } from "framer-motion";

interface SpeedometerProps {
  score: number; // 0–100
  size?: number;
}

/**
 * Semicircle gauge (180°). Arc, fill, ticks, and needle share one angle model.
 * SVG y-down: angles measured clockwise from +x after converting from math degrees.
 */
export default function SpeedometerGauge({ score, size = 220 }: SpeedometerProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const centerX = size / 2;
  const centerY = size * 0.58;
  const radius = size * 0.4;
  const strokeWidth = size * 0.07;

  // Left (0) → right (100) along bottom semicircle: 180° → 360°
  const startAngle = 180;
  const totalAngle = 180;

  const polarToXY = (angleDeg: number, r: number) => {
    // Convert: 0° = right, 90° = down in SVG after standard math polar with -90 offset
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: centerX + r * Math.cos(rad),
      y: centerY + r * Math.sin(rad),
    };
  };

  const describeArc = (from: number, to: number, r: number) => {
    const s = polarToXY(from, r);
    const e = polarToXY(to, r);
    const sweep = to - from;
    const large = Math.abs(sweep) > 180 ? 1 : 0;
    // sweep-flag 1 = clockwise in SVG when y increases downward... use 1 for 180→360
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const getColor = () => {
    if (clamped < 40) return "#E23E57";
    if (clamped < 65) return "#D4A843";
    return "#34D399";
  };

  const color = getColor();
  const arcLength = Math.PI * radius; // 180° of circumference
  const fillLength = (clamped / 100) * arcLength;
  const needleAngle = startAngle + (clamped / 100) * totalAngle;
  const needleEnd = polarToXY(needleAngle, radius * 0.82);
  const endAngle = startAngle + totalAngle;

  const viewH = size * 0.72;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={viewH}
        viewBox={`0 0 ${size} ${viewH + 8}`}
        role="img"
        aria-label={`Pitch health score ${clamped} out of 100`}
      >
        {/* Track */}
        <path
          d={describeArc(startAngle, endAngle, radius)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Value fill */}
        <motion.path
          d={describeArc(startAngle, endAngle, radius)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${fillLength} ${arcLength + 20}`}
          initial={{ strokeDasharray: `0 ${arcLength + 20}` }}
          animate={{ strokeDasharray: `${fillLength} ${arcLength + 20}` }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />

        {/* Ticks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = startAngle + (tick / 100) * totalAngle;
          const inner = polarToXY(angle, radius - strokeWidth * 0.85);
          const outer = polarToXY(angle, radius + strokeWidth * 0.35);
          return (
            <line
              key={tick}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Needle */}
        <motion.line
          x1={centerX}
          y1={centerY}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke="rgba(232,228,220,0.95)"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{
            x2: polarToXY(startAngle, radius * 0.82).x,
            y2: polarToXY(startAngle, radius * 0.82).y,
          }}
          animate={{ x2: needleEnd.x, y2: needleEnd.y }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
        />

        <circle cx={centerX} cy={centerY} r={5} fill="rgba(232,228,220,0.95)" />

        {/* Score */}
        <text
          x={centerX}
          y={centerY - radius * 0.22}
          textAnchor="middle"
          fill={color}
          fontSize={size * 0.14}
          fontWeight="700"
          fontFamily="var(--font-space), system-ui, sans-serif"
        >
          {clamped}
        </text>
        <text
          x={centerX}
          y={centerY - radius * 0.02}
          textAnchor="middle"
          fill="rgba(226,232,240,0.45)"
          fontSize={size * 0.055}
          fontFamily="var(--font-inter), system-ui, sans-serif"
        >
          / 100
        </text>

        <text
          x={polarToXY(startAngle, radius + 18).x}
          y={polarToXY(startAngle, radius + 18).y + 4}
          textAnchor="middle"
          fill="rgba(226,62,87,0.7)"
          fontSize={10}
        >
          0
        </text>
        <text
          x={polarToXY(endAngle, radius + 18).x}
          y={polarToXY(endAngle, radius + 18).y + 4}
          textAnchor="middle"
          fill="rgba(52,211,153,0.7)"
          fontSize={10}
        >
          100
        </text>
      </svg>

      <p className="text-xs font-space" style={{ color: "var(--ash)" }}>
        PITCH HEALTH SCORE
      </p>
    </div>
  );
}
