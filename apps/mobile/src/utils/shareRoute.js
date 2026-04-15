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

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

