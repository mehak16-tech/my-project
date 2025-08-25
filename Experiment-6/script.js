const svg = document.getElementById("drawingArea");

let isDrawing = false;
let currentPath = null;

// utility: get SVG coordinates
function getSvgPoint(evt) {
  const pt = svg.createSVGPoint();
  const source = evt.touches ? evt.touches[0] : evt;
  pt.x = source.clientX;
  pt.y = source.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

// start drawing
function startDraw(evt) {
  evt.preventDefault();
  isDrawing = true;

  const p = getSvgPoint(evt);
  currentPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  currentPath.setAttribute("fill", "none");
  currentPath.setAttribute("stroke", "#1e90ff");
  currentPath.setAttribute("stroke-width", "2.5");
  currentPath.setAttribute("stroke-linecap", "round");
  currentPath.setAttribute("stroke-linejoin", "round");
  currentPath.setAttribute("d", `M ${p.x} ${p.y}`); // ✅ fixed syntax

  svg.appendChild(currentPath);
}

// extend stroke
function draw(evt) {
  if (!isDrawing || !currentPath) return;
  const p = getSvgPoint(evt);
  const d = currentPath.getAttribute("d") + ` L ${p.x} ${p.y}`;
  currentPath.setAttribute("d", d);
}

// end stroke
function endDraw() {
  isDrawing = false;
  currentPath = null;
}

// clear canvas
document.getElementById("clearBtn").addEventListener("click", () => {
  svg.innerHTML = "";
});

// mouse events
svg.addEventListener("mousedown", startDraw);
svg.addEventListener("mousemove", draw);
window.addEventListener("mouseup", endDraw);
svg.addEventListener("mouseleave", endDraw);

// touch events
svg.addEventListener("touchstart", startDraw, { passive: false });
svg.addEventListener("touchmove", draw, { passive: false });
svg.addEventListener("touchend", endDraw, { passive: false });
