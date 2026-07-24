import React, { useEffect, useLayoutEffect, useRef } from "react";

type Direction = "up" | "down" | "left" | "right";

type Props = {
  imageSrc: string;
  gridSize?: number;
  transitionColor?: string;
  edgeHeight?: number;
  duration?: number;
  direction?: Direction;
  style?: React.CSSProperties;
};

const DEFAULTS = {
  gridSize: 15,
  transitionColor: "#000000",
  edgeHeight: 10,
  duration: 2,
  direction: "up" as Direction,
};

export default function PixelReveal(props: Props) {
  const {
    imageSrc,
    gridSize = DEFAULTS.gridSize,
    transitionColor = DEFAULTS.transitionColor,
    edgeHeight = DEFAULTS.edgeHeight,
    duration = DEFAULTS.duration,
    direction = DEFAULTS.direction,
    style,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const progressRef = useRef(0);
  const linearProgressRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const completedRef = useRef(false);
  const triggeredOnceRef = useRef(false);

  const gridRef = useRef<{
    cols: number;
    rows: number;
    cellW: number;
    cellH: number;
    cssW: number;
    cssH: number;
    thresholds: Float32Array;
  } | null>(null);

  const propsRef = useRef({ gridSize, edgeHeight, direction, transitionColor, duration });
  useEffect(() => {
    propsRef.current = { gridSize, edgeHeight, direction, transitionColor, duration };
  }, [gridSize, edgeHeight, direction, transitionColor, duration]);

  const rebuildGrid = (entry?: ResizeObserverEntry) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const cr = entry?.contentRect;
    const rectW = cr?.width || container.clientWidth || container.getBoundingClientRect().width;
    const rectH = cr?.height || container.clientHeight || container.getBoundingClientRect().height;
    const cssW = Math.max(1, Math.floor(rectW) || 600);
    const cssH = Math.max(1, Math.floor(rectH) || 400);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxRef.current = ctx;

    const gs = Math.max(1, propsRef.current.gridSize);
    const cols = Math.max(1, Math.ceil(cssW / gs));
    const rows = Math.max(1, Math.ceil(cssH / gs));
    const cellW = cssW / cols;
    const cellH = cssH / rows;

    const eh = Math.max(0, Math.min(1, propsRef.current.edgeHeight / 100));
    const dir = propsRef.current.direction;
    const thresholds = new Float32Array(cols * rows);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let base: number;
        if (dir === "up") {
          base = rows === 1 ? 0 : 1 - r / (rows - 1);
        } else if (dir === "down") {
          base = rows === 1 ? 0 : r / (rows - 1);
        } else if (dir === "left") {
          base = cols === 1 ? 0 : 1 - c / (cols - 1);
        } else {
          base = cols === 1 ? 0 : c / (cols - 1);
        }
        thresholds[r * cols + c] = base * (1 - eh) + Math.random() * eh;
      }
    }

    gridRef.current = { cols, rows, cellW, cellH, cssW, cssH, thresholds };
  };

  const draw = () => {
    const ctx = ctxRef.current;
    const grid = gridRef.current;
    if (!ctx || !grid) return;

    const { cols, rows, cellW, cellH, cssW, cssH, thresholds } = grid;
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = propsRef.current.transitionColor;

    const p = progressRef.current;
    const padW = cellW + 1;
    const padH = cellH + 1;

    for (let r = 0; r < rows; r++) {
      const yBase = r * cellH;
      const rowOff = r * cols;
      for (let c = 0; c < cols; c++) {
        if (thresholds[rowOff + c] > p) {
          ctx.fillRect(c * cellW, yBase, padW, padH);
        }
      }
    }
  };

  const stopRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    runningRef.current = false;
  };

  const loop = (now: number) => {
    if (!runningRef.current) return;
    const dur = Math.max(0.0001, propsRef.current.duration);
    if (startTimeRef.current == null) {
      startTimeRef.current = now;
    }
    const elapsed = (now - startTimeRef.current) / 1000;
    const linear = Math.max(0, Math.min(1, elapsed / dur));
    linearProgressRef.current = linear;
    // easeInOut
    progressRef.current =
      linear < 0.5 ? 2 * linear * linear : 1 - Math.pow(-2 * linear + 2, 2) / 2;
    draw();

    if (linear >= 1) {
      stopRaf();
      completedRef.current = true;
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
  };

  const startRaf = () => {
    if (runningRef.current) return;
    runningRef.current = true;
    const dur = Math.max(0.0001, propsRef.current.duration);
    const offsetMs = linearProgressRef.current * dur * 1000;
    startTimeRef.current = performance.now() - offsetMs;
    rafRef.current = requestAnimationFrame(loop);
  };

  const triggerFn = () => {
    completedRef.current = false;
    stopRaf();
    progressRef.current = 0;
    linearProgressRef.current = 0;
    startTimeRef.current = null;
    draw();
    startRaf();
  };

  useLayoutEffect(() => {
    rebuildGrid();
    draw();
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      rebuildGrid(entries[0]);
      draw();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    rebuildGrid();
    draw();
  }, [gridSize, edgeHeight, direction]);

  useEffect(() => {
    draw();
  }, [transitionColor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (triggeredOnceRef.current) continue;
            triggeredOnceRef.current = true;
            triggerFn();
          }
        }
      },
      { threshold: 0 }
    );
    io.observe(container);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          draggable={false}
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      ) : null}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
