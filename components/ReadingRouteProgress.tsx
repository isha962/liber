"use client";

type Point = { x: number; y: number };

const WIDTH = 980;
const HEIGHT = 340;
const SAFE_X = 96;
const SAFE_Y = 60;
const START_X = 108;
const END_X = WIDTH - 108;
const BASE_Y = HEIGHT / 2;
const MIN_COMPLETED_RATIO = 0.12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function cubicPoint(t: number, p0: Point, p1: Point, p2: Point, p3: Point) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
    y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
  };
}

function pathFromPoints(points: Point[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
}

function segmentPath(start: Point, controlOne: Point, controlTwo: Point, end: Point) {
  return `M ${start.x} ${start.y} C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${end.x} ${end.y}`;
}

function createVariantPoints(variant: number) {
  const span = END_X - START_X;
  const x1 = START_X + span * 0.18;
  const x2 = START_X + span * 0.38;
  const x3 = START_X + span * 0.58;
  const x4 = START_X + span * 0.78;

  switch (variant) {
    case 0:
      return [
        { x: START_X, y: 178 },
        { x: x1, y: 238 },
        { x: x2, y: 124 },
        { x: x3, y: 192 },
        { x: x4, y: 136 },
        { x: END_X, y: 186 },
      ];
    case 1:
      return [
        { x: START_X, y: 204 },
        { x: x1, y: 214 },
        { x: x2, y: 82 },
        { x: x3, y: 98 },
        { x: x4, y: 214 },
        { x: END_X, y: 190 },
      ];
    case 2:
      return [
        { x: START_X, y: 168 },
        { x: x1, y: 214 },
        { x: x2, y: 148 },
        { x: x3, y: 202 },
        { x: x4, y: 146 },
        { x: END_X, y: 178 },
      ];
    case 3:
      return [
        { x: START_X, y: 192 },
        { x: x1, y: 98 },
        { x: x2, y: 188 },
        { x: x3, y: 92 },
        { x: x4, y: 180 },
        { x: END_X, y: 170 },
      ];
    default:
      return [
        { x: START_X, y: 146 },
        { x: x1, y: 212 },
        { x: x2, y: 234 },
        { x: x3, y: 162 },
        { x: x4, y: 106 },
        { x: END_X, y: 156 },
      ];
  }
}

function buildSmoothSegments(points: Point[]) {
  const segments: Array<{ start: Point; c1: Point; c2: Point; end: Point }> = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;

    const c1 = {
      x: current.x + (next.x - previous.x) / 6,
      y: clamp(current.y + (next.y - previous.y) / 6, SAFE_Y, HEIGHT - SAFE_Y),
    };
    const c2 = {
      x: next.x - (afterNext.x - current.x) / 6,
      y: clamp(next.y - (afterNext.y - current.y) / 6, SAFE_Y, HEIGHT - SAFE_Y),
    };

    segments.push({ start: current, c1, c2, end: next });
  }

  return segments;
}

function routePoint(progress: number, segments: Array<{ start: Point; c1: Point; c2: Point; end: Point }>) {
  const normalized = clamp(progress, 0, 1);
  const segmentLength = 1 / segments.length;
  const segmentIndex = Math.min(segments.length - 1, Math.floor(normalized / segmentLength));
  const localProgress = segmentIndex === segments.length - 1 ? (normalized - segmentIndex * segmentLength) / segmentLength : (normalized % segmentLength) / segmentLength;
  const segment = segments[segmentIndex];
  return cubicPoint(localProgress, segment.start, segment.c1, segment.c2, segment.end);
}

function sampleRoutePoints(segments: Array<{ start: Point; c1: Point; c2: Point; end: Point }>, steps = 180) {
  return Array.from({ length: steps + 1 }, (_, index) => routePoint(index / steps, segments));
}

export function ReadingRouteProgress({
  title,
  startPage,
  endPage,
  totalPages,
}: {
  title: string;
  startPage: number;
  endPage: number;
  totalPages: number;
}) {
  const hash = hashString(`${title}-${totalPages}`);
  const variant = hash % 5;
  const routePoints = createVariantPoints(variant);
  const segments = buildSmoothSegments(routePoints);
  const safeTotal = Math.max(totalPages, 1);
  const startProgress = clamp(startPage / safeTotal, 0, 1);
  const actualProgress = clamp(endPage / safeTotal, startProgress, 1);
  const displayProgress = clamp(
    startProgress + Math.max(actualProgress - startProgress, endPage > startPage ? MIN_COMPLETED_RATIO : 0),
    startProgress,
    1,
  );

  const startPoint = routePoint(startProgress, segments);
  const currentPoint = routePoint(displayProgress, segments);
  const finishPoint = routePoints[routePoints.length - 1];
  const sampledPoints = sampleRoutePoints(segments);
  const startIndex = Math.round(startProgress * (sampledPoints.length - 1));
  const currentIndex = Math.round(displayProgress * (sampledPoints.length - 1));
  const completedPath = pathFromPoints(sampledPoints.slice(startIndex, Math.max(startIndex + 1, currentIndex + 1)));
  const remainingPath = pathFromPoints(sampledPoints.slice(currentIndex, sampledPoints.length));
  const fullPath = segments.map((segment, index) => `${index === 0 ? "M" : "C"} ${index === 0 ? `${segment.start.x} ${segment.start.y} C ` : ""}${segment.c1.x} ${segment.c1.y}, ${segment.c2.x} ${segment.c2.y}, ${segment.end.x} ${segment.end.y}`).join(" ");

  const currentAnchor = actualProgress < 0.18 ? "start" : actualProgress > 0.84 ? "end" : "middle";
  const currentLabelX = clamp(
    currentAnchor === "start" ? currentPoint.x + 32 : currentAnchor === "end" ? currentPoint.x - 32 : currentPoint.x,
    220,
    780,
  );
  const currentGuideBottom = clamp(currentPoint.y + 64, SAFE_Y + 36, HEIGHT - SAFE_Y - 82);
  const currentLabelY = clamp(currentGuideBottom + 28, SAFE_Y + 84, HEIGHT - SAFE_Y + 2);
  const currentPageY = clamp(currentLabelY + 30, SAFE_Y + 110, HEIGHT - 18);
  const startLabelX = clamp(startPoint.x + 38, 120, 260);
  const finishLabelX = clamp(finishPoint.x - 42, 760, 920);
  const startLabelY = clamp(startPoint.y + 64, SAFE_Y + 70, HEIGHT - SAFE_Y + 4);
  const startPageY = clamp(startLabelY + 28, SAFE_Y + 98, HEIGHT - 12);
  const finishLabelY = clamp(finishPoint.y + 64, SAFE_Y + 70, HEIGHT - SAFE_Y + 4);
  const finishPageY = clamp(finishLabelY + 28, SAFE_Y + 98, HEIGHT - 12);

  return (
    <div
      className="h-full w-full"
      data-testid="reading-route-progress"
      data-progress={(actualProgress * 100).toFixed(2)}
      data-variant={variant}
    >
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-full w-full overflow-visible" aria-hidden="true" fill="none">
        <defs>
          <linearGradient id="liber-reading-route" x1={START_X} y1={BASE_Y} x2={END_X} y2={BASE_Y} gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff5cf" />
            <stop offset="0.55" stopColor="#ffe082" />
            <stop offset="1" stopColor="#ffd166" />
          </linearGradient>
        </defs>

        <path d={fullPath} stroke="rgba(252,76,2,0.34)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d={remainingPath} stroke="rgba(252,76,2,0.48)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d={completedPath} stroke="url(#liber-reading-route)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />

        <circle cx={startPoint.x} cy={startPoint.y} r="16.2" fill="#fc4c02" stroke="white" strokeWidth="6.8" />
        <circle cx={finishPoint.x} cy={finishPoint.y} r="16.2" stroke="rgba(255,214,102,0.95)" strokeWidth="6.8" />
        <circle cx={currentPoint.x} cy={currentPoint.y} r="21.6" fill="#fff5cf" stroke="#fc4c02" strokeWidth="6.8" />
        <path d={`M ${currentPoint.x} ${currentPoint.y + 26} L ${currentPoint.x} ${currentGuideBottom}`} stroke="#fc4c02" strokeDasharray="5 6" strokeLinecap="round" strokeWidth="3.4" />

        <text x={startLabelX} y={startLabelY} textAnchor="start" fill="rgba(255,255,255,0.76)" fontSize="20" fontWeight="700">
          START
        </text>
        <text x={startLabelX} y={startPageY} textAnchor="start" fill="white" fontSize="24" fontWeight="600">
          {`Page ${startPage}`}
        </text>

        <text x={currentLabelX} y={currentLabelY} textAnchor={currentAnchor} fill="#fc4c02" fontSize="20" fontWeight="700">
          YOU ARE HERE
        </text>
        <text x={currentLabelX} y={currentPageY} textAnchor={currentAnchor} fill="white" fontSize="26" fontWeight="800">
          {`Page ${endPage}`}
        </text>

        <text x={finishLabelX} y={finishLabelY} textAnchor="end" fill="rgba(255,255,255,0.76)" fontSize="20" fontWeight="700">
          FINISH
        </text>
        <text x={finishLabelX} y={finishPageY} textAnchor="end" fill="rgba(255,255,255,0.92)" fontSize="24" fontWeight="600">
          {`Page ${totalPages}`}
        </text>
      </svg>
    </div>
  );
}
