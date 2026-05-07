"use client";

type Point = { x: number; y: number };

const startPoint = { x: 74, y: 250 };
const controlOne = { x: 190, y: 320 };
const controlTwo = { x: 286, y: 160 };
const bendOne = { x: 404, y: 196 };
const controlThree = { x: 492, y: 228 };
const controlFour = { x: 594, y: 108 };
const bendTwo = { x: 708, y: 144 };
const controlFive = { x: 796, y: 170 };
const controlSix = { x: 852, y: 228 };
const endPoint = { x: 914, y: 266 };
const minCompletedRatio = 0.12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function routePoint(progress: number) {
  const normalized = clamp(progress, 0, 1);
  if (normalized <= 0.33) return cubicPoint(normalized / 0.33, startPoint, controlOne, controlTwo, bendOne);
  if (normalized <= 0.66) return cubicPoint((normalized - 0.33) / 0.33, bendOne, controlThree, controlFour, bendTwo);
  return cubicPoint((normalized - 0.66) / 0.34, bendTwo, controlFive, controlSix, endPoint);
}

function sampleRoutePoints(steps = 120) {
  return Array.from({ length: steps + 1 }, (_, index) => routePoint(index / steps));
}

function pathFromPoints(points: Point[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
}

export function ReadingRouteProgress({
  startPage,
  endPage,
  totalPages,
}: {
  startPage: number;
  endPage: number;
  totalPages: number;
}) {
  const safeTotal = Math.max(totalPages, 1);
  const startProgress = clamp(startPage / safeTotal, 0, 1);
  const actualProgress = clamp(endPage / safeTotal, startProgress, 1);
  const displayProgress = clamp(
    startProgress + Math.max(actualProgress - startProgress, endPage > startPage ? minCompletedRatio : 0),
    startProgress,
    1,
  );
  const currentPoint = routePoint(displayProgress);
  const startedPoint = routePoint(startProgress);
  const points = sampleRoutePoints();
  const startIndex = Math.round(startProgress * (points.length - 1));
  const currentIndex = Math.round(displayProgress * (points.length - 1));
  const completedPath = pathFromPoints(points.slice(startIndex, Math.max(startIndex + 1, currentIndex + 1)));
  const remainingPath = pathFromPoints(points.slice(currentIndex, points.length));
  const fullPath = [
    `M ${startPoint.x} ${startPoint.y}`,
    `C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${bendOne.x} ${bendOne.y}`,
    `C ${controlThree.x} ${controlThree.y}, ${controlFour.x} ${controlFour.y}, ${bendTwo.x} ${bendTwo.y}`,
    `C ${controlFive.x} ${controlFive.y}, ${controlSix.x} ${controlSix.y}, ${endPoint.x} ${endPoint.y}`,
  ].join(" ");

  return (
    <div className="h-full w-full" data-testid="reading-route-progress" data-progress={(actualProgress * 100).toFixed(2)}>
      <svg viewBox="0 0 980 420" className="h-full w-full overflow-visible" aria-hidden="true" fill="none">
        <defs>
          <linearGradient id="liber-reading-route" x1="74" y1="250" x2="914" y2="266" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff5cf" />
            <stop offset="0.55" stopColor="#ffe082" />
            <stop offset="1" stopColor="#ffd166" />
          </linearGradient>
        </defs>

        <path d={fullPath} pathLength="100" stroke="rgba(252,76,2,0.34)" strokeWidth="18" strokeLinecap="round" />
        <path d={remainingPath} stroke="rgba(252,76,2,0.48)" strokeWidth="18" strokeLinecap="round" />
        <path d={completedPath} stroke="url(#liber-reading-route)" strokeWidth="18" strokeLinecap="round" />

        <circle cx={startedPoint.x} cy={startedPoint.y} r="16.2" fill="#fc4c02" stroke="white" strokeWidth="6.8" />
        <circle cx={endPoint.x} cy={endPoint.y} r="16.2" stroke="rgba(255,214,102,0.95)" strokeWidth="6.8" />
        <circle cx={currentPoint.x} cy={currentPoint.y} r="21.6" fill="#fff5cf" stroke="#fc4c02" strokeWidth="6.8" />
        <path d={`M ${currentPoint.x} ${currentPoint.y + 26} L ${currentPoint.x} ${currentPoint.y + 104}`} stroke="#fc4c02" strokeDasharray="5 6" strokeLinecap="round" strokeWidth="3.4" />

        <text x={startedPoint.x - 22} y={startedPoint.y + 74} textAnchor="end" fill="rgba(255,255,255,0.76)" fontSize="20" fontWeight="700">
          START
        </text>
        <text x={startedPoint.x - 22} y={startedPoint.y + 106} textAnchor="end" fill="white" fontSize="24" fontWeight="600">
          {`Page ${startPage}`}
        </text>
        <text x={currentPoint.x} y={currentPoint.y + 144} textAnchor="middle" fill="#fc4c02" fontSize="20" fontWeight="700">
          YOU ARE HERE
        </text>
        <text x={currentPoint.x} y={currentPoint.y + 176} textAnchor="middle" fill="white" fontSize="26" fontWeight="800">
          {`Page ${endPage}`}
        </text>
        <text x={endPoint.x + 28} y={endPoint.y + 74} textAnchor="start" fill="rgba(255,255,255,0.76)" fontSize="20" fontWeight="700">
          FINISH
        </text>
        <text x={endPoint.x + 28} y={endPoint.y + 106} textAnchor="start" fill="rgba(255,255,255,0.92)" fontSize="24" fontWeight="600">
          {`Page ${totalPages}`}
        </text>
      </svg>
    </div>
  );
}
