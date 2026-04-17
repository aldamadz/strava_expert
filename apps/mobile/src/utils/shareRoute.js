export function buildNormalizedRoute(route, width, height, padding = 18) {
  if (!route || route.length === 0) {
    return [];
  }

  const lats = route.map((point) => point.latitude);
  const lons = route.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latSpan = Math.max(maxLat - minLat, 0.00001);
  const lonSpan = Math.max(maxLon - minLon, 0.00001);
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  return route.map((point) => {
    const x = padding + ((point.longitude - minLon) / lonSpan) * drawWidth;
    const y = padding + (1 - (point.latitude - minLat) / latSpan) * drawHeight;
    return { x, y };
  });
}

export function buildSmoothSvgPath(points) {
  if (!points || points.length === 0) {
    return "";
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }
  // Use polyline path to avoid bezier overshoot that can exceed frame bounds.
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

export function fitRouteToBounds(points, width, height, padding = 10) {
  if (!points || points.length === 0) {
    return [];
  }
  if (points.length === 1) {
    return [{ x: width / 2, y: height / 2 }];
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const targetWidth = Math.max(width - padding * 2, 1);
  const targetHeight = Math.max(height - padding * 2, 1);
  const scale = Math.min(targetWidth / spanX, targetHeight / spanY);

  const srcCenterX = (minX + maxX) / 2;
  const srcCenterY = (minY + maxY) / 2;
  const dstCenterX = width / 2;
  const dstCenterY = height / 2;

  return points.map((point) => ({
    x: dstCenterX + (point.x - srcCenterX) * scale,
    y: dstCenterY + (point.y - srcCenterY) * scale
  }));
}
