"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface SpeedometerProps {
  score: number; // 0–100
  size?: number;
}

export default function SpeedometerGauge({ score, size = 220 }: SpeedometerProps) {
  const needleRef = useRef<SVGLineElement>(null);
  const center = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.08;

  // Arc from 210deg to 330deg (spread of 240deg)
  const startAngle = 210;
  const endAngle = 330;
  const totalAngle = 360 - startAngle + endAngle; // 240deg

  const polarToXY = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: center + r * Math.cos(rad), y: center + r * Math.sin(rad) };
  };

  const describeArc = (from: number, to: number, r: number) => {
    const s = polarToXY(from, r);
    const e = polarToXY(to, r);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  // Color based on score
  const getColor = () => {
    if (score < 40) return "#ff3366";
    if (score < 65) return "#ffb800";
    return "#00ff88";
  };

  const needleAngle = startAngle + (score / 100) * totalAngle;
  const needleEnd = polarToXY(needleAngle, radius * 0.85);
  const color = getColor();

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size}`}>
        {/* Background arc */}
        <path
          d={describeArc(startAngle, endAngle, radius)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored fill arc */}
        <motion.path
          d={describeArc(startAngle, endAngle, radius)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * (2 * Math.PI * radius * (240 / 360))} 9999`}
          initial={{ strokeDasharray: "0 9999" }}
          animate={{
            strokeDasharray: `${(score / 100) * (2 * Math.PI * radius * (240 / 360))} 9999`,
          }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />

        {/* Tick marks */}
        {[0, 20, 40, 60, 80, 100].map((tick) => {
          const angle = startAngle + (tick / 100) * totalAngle;
          const inner = polarToXY(angle, radius - strokeWidth * 0.8);
          const outer = polarToXY(angle, radius + strokeWidth * 0.2);
          return (
            <line
              key={tick}
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Needle */}
        <motion.line
          ref={needleRef}
          x1={center} y1={center}
          x2={needleEnd.x} y2={needleEnd.y}
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          initial={{
            x2: polarToXY(startAngle, radius * 0.85).x,
            y2: polarToXY(startAngle, radius * 0.85).y,
          }}
          animate={{ x2: needleEnd.x, y2: needleEnd.y }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
          style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))" }}
        />

        {/* Center dot */}
        <circle cx={center} cy={center} r={6} fill="white" opacity={0.9} />

        {/* Score text */}
        <text
          x={center}
          y={center + radius * 0.55}
          textAnchor="middle"
          fill={color}
          fontSize={size * 0.12}
          fontWeight="700"
          fontFamily="var(--font-space)"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        >
          {score}
        </text>
        <text
          x={center}
          y={center + radius * 0.75}
          textAnchor="middle"
          fill="rgba(226,232,240,0.4)"
          fontSize={size * 0.06}
          fontFamily="var(--font-inter)"
        >
          / 100
        </text>

        {/* Labels */}
        <text x={polarToXY(startAngle, radius + 24).x} y={polarToXY(startAngle, radius + 24).y}
          textAnchor="middle" fill="rgba(255,51,102,0.6)" fontSize={10} fontFamily="var(--font-inter)">0</text>
        <text x={polarToXY(endAngle, radius + 24).x} y={polarToXY(endAngle, radius + 24).y}
          textAnchor="middle" fill="rgba(0,255,136,0.6)" fontSize={10} fontFamily="var(--font-inter)">100</text>
      </svg>

      <p className="text-xs font-space" style={{ color: "rgba(226,232,240,0.4)" }}>
        PITCH HEALTH SCORE
      </p>
    </div>
  );
}
