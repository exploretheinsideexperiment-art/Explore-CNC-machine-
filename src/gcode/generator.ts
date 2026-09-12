import { VectorStroke } from '../types';

export interface GCodeGenerationOptions {
  feedrate?: number;       // Drawing speed in mm/min (default: 600)
  rapidFeedrate?: number;  // Rapid traverse speed (default: 1200)
  penUpCommand?: string;   // Default: M5
  penDownCommand?: string; // Default: M3
  returnToOrigin?: boolean;// Default: true
  maxX?: number;           // Default: 200
  maxY?: number;           // Default: 200
  dwellMs?: number;        // Dwell after pen up/down (default: 120)
}

export interface GeneratedGCodeResult {
  gcode: string;
  lines: string[];
  totalLines: number;
  estimatedTimeSeconds: number;
  outOfBoundsCount: number;
  totalDistanceMm: number;
  drawDistanceMm: number;
  rapidDistanceMm: number;
}

export function strokesToGCode(
  strokes: VectorStroke[],
  options: GCodeGenerationOptions = {}
): GeneratedGCodeResult {
  const {
    feedrate = 600,
    rapidFeedrate = 1200,
    penUpCommand = 'M5',
    penDownCommand = 'M3',
    returnToOrigin = true,
    maxX = 200,
    maxY = 200,
    dwellMs = 120,
  } = options;

  const lines: string[] = [];
  lines.push('; Explore CNC Plotter - Generated G-Code');
  lines.push('; Generated at ' + new Date().toISOString());
  lines.push('G21 ; Millimeter units');
  lines.push('G90 ; Absolute distance mode');
  lines.push(penUpCommand + ' ; Ensure pen is UP');
  lines.push(`G4 P${dwellMs} ; Settle pen`);

  let currentX = 0;
  let currentY = 0;
  let totalDistanceMm = 0;
  let drawDistanceMm = 0;
  let rapidDistanceMm = 0;
  let outOfBoundsCount = 0;

  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;

    const startPt = stroke.points[0];

    // Check bounds
    if (startPt.x < 0 || startPt.x > maxX || startPt.y < 0 || startPt.y > maxY) {
      outOfBoundsCount++;
    }

    // Rapid travel with pen up to stroke start
    const rapidDist = Math.hypot(startPt.x - currentX, startPt.y - currentY);
    rapidDistanceMm += rapidDist;
    totalDistanceMm += rapidDist;

    lines.push(`G0 X${startPt.x.toFixed(2)} Y${startPt.y.toFixed(2)}`);
    currentX = startPt.x;
    currentY = startPt.y;

    // Lower pen
    lines.push(penDownCommand + ' ; Pen DOWN');
    lines.push(`G4 P${dwellMs}`);

    // Draw lines along points
    for (let i = 1; i < stroke.points.length; i++) {
      const pt = stroke.points[i];
      if (pt.x < 0 || pt.x > maxX || pt.y < 0 || pt.y > maxY) {
        outOfBoundsCount++;
      }

      const dist = Math.hypot(pt.x - currentX, pt.y - currentY);
      drawDistanceMm += dist;
      totalDistanceMm += dist;

      lines.push(`G1 X${pt.x.toFixed(2)} Y${pt.y.toFixed(2)} F${feedrate}`);
      currentX = pt.x;
      currentY = pt.y;
    }

    // Raise pen after stroke
    lines.push(penUpCommand + ' ; Pen UP');
    lines.push(`G4 P${dwellMs}`);
  }

  // Return to origin if requested
  if (returnToOrigin && (currentX !== 0 || currentY !== 0)) {
    const returnDist = Math.hypot(currentX, currentY);
    rapidDistanceMm += returnDist;
    totalDistanceMm += returnDist;
    lines.push('G0 X0.00 Y0.00 ; Return to origin');
  }

  lines.push('; Job End');

  // Estimate execution time:
  // Draw time = (drawDistance / feedrate) * 60 seconds
  // Rapid time = (rapidDistance / rapidFeedrate) * 60 seconds
  // Dwell / pen lift time = strokes * (2 * dwellMs / 1000)
  const drawTimeSec = (drawDistanceMm / (feedrate / 60));
  const rapidTimeSec = (rapidDistanceMm / (rapidFeedrate / 60));
  const penActionTimeSec = strokes.length * (dwellMs * 2 / 1000);
  const estimatedTimeSeconds = Math.round(drawTimeSec + rapidTimeSec + penActionTimeSec);

  return {
    gcode: lines.join('\n'),
    lines,
    totalLines: lines.length,
    estimatedTimeSeconds,
    outOfBoundsCount,
    totalDistanceMm: Math.round(totalDistanceMm),
    drawDistanceMm: Math.round(drawDistanceMm),
    rapidDistanceMm: Math.round(rapidDistanceMm),
  };
}
