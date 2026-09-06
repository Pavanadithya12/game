import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../hooks/useSocket';
import { Stroke, Point, Tool, GamePhase, StrokeSegment } from '../types';

const VIRTUAL_WIDTH = 800;
const VIRTUAL_HEIGHT = 600;

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<Point | null>(null);
  const currentPointsRef = useRef<Point[]>([]);
  const currentStrokeIdRef = useRef<string>('');

  const store = useGameStore();
  const socket = getSocket();

  const isDrawer = store.currentDrawerId === store.playerId && store.phase === GamePhase.DRAWING;

  // Draw a single line segment directly onto the canvas (0.01ms O(1) rendering)
  const drawSegment = useCallback((
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    color: string,
    brushSize: number,
    tool: Tool
  ) => {
    ctx.beginPath();
    ctx.strokeStyle = tool === Tool.ERASER ? '#FFFFFF' : color;
    ctx.fillStyle = tool === Tool.ERASER ? '#FFFFFF' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // Fill small circle at the end to ensure smooth continuous joints
    ctx.beginPath();
    ctx.arc(to.x, to.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  // Redraw all strokes from history (only called on undo, clear, or initial mount)
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    store.strokes.forEach((stroke) => {
      if (stroke.points.length < 1) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === Tool.ERASER ? '#FFFFFF' : stroke.color;
      ctx.fillStyle = stroke.tool === Tool.ERASER ? '#FFFFFF' : stroke.color;
      ctx.lineWidth = stroke.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          const prev = stroke.points[i - 1];
          const curr = stroke.points[i];
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(curr.x, curr.y);
          ctx.stroke();
        }
      }
    });
  }, [store.strokes]);

  // Initial mount & stroke changes (undo/clear/new turn)
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Listen for real-time stroke segments from other players for zero-lag live viewing
  useEffect(() => {
    if (!socket) return;

    const handleLiveSegment = (segment: StrokeSegment) => {
      // If we are the drawer, ignore our own echoed segments
      if (isDrawer) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawSegment(ctx, segment.from, segment.to, segment.color, segment.brushSize, segment.tool);
    };

    socket.on('strokeSegmentReceived', handleLiveSegment);
    return () => {
      socket.off('strokeSegmentReceived', handleLiveSegment);
    };
  }, [socket, isDrawer, drawSegment]);

  // Convert client coordinates to virtual canvas (800x600)
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = VIRTUAL_WIDTH / rect.width;
    const scaleY = VIRTUAL_HEIGHT / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    if (!isDrawer) return;
    const point = getCoordinates(e);
    if (!point) return;

    setIsDrawing(true);
    lastPointRef.current = point;
    currentPointsRef.current = [point];
    currentStrokeIdRef.current = Math.random().toString(36).substring(2, 9);

    // Draw single dot on start
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.fillStyle = store.currentTool === Tool.ERASER ? '#FFFFFF' : store.currentColor;
        ctx.arc(point.x, point.y, store.brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    if (!isDrawing || !isDrawer || !lastPointRef.current) return;
    const currentPoint = getCoordinates(e);
    if (!currentPoint) return;

    const prevPoint = lastPointRef.current;
    lastPointRef.current = currentPoint;
    currentPointsRef.current.push(currentPoint);

    // 1. Draw segment directly on canvas instantly (Zero Lag)
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawSegment(ctx, prevPoint, currentPoint, store.currentColor, store.brushSize, store.currentTool);
      }
    }

    // 2. Stream segment to other players immediately so they see it live
    if (socket) {
      socket.emit('sendStrokeSegment', {
        strokeId: currentStrokeIdRef.current,
        playerId: store.playerId || '',
        tool: store.currentTool,
        color: store.currentColor,
        brushSize: store.brushSize,
        from: prevPoint,
        to: currentPoint,
      });
    }
  };

  const handleEnd = () => {
    if (!isDrawing || !isDrawer) return;
    setIsDrawing(false);
    lastPointRef.current = null;

    if (currentPointsRef.current.length > 0) {
      const newStroke: Stroke = {
        id: currentStrokeIdRef.current || Math.random().toString(36).substring(2, 9),
        playerId: store.playerId || '',
        tool: store.currentTool,
        color: store.currentColor,
        brushSize: store.brushSize,
        points: [...currentPointsRef.current],
      };

      store.addStroke(newStroke);
      if (socket) {
        socket.emit('sendStroke', newStroke);
      }
    }
    currentPointsRef.current = [];
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center relative select-none touch-none"
    >
      <canvas
        ref={canvasRef}
        width={VIRTUAL_WIDTH}
        height={VIRTUAL_HEIGHT}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className={`max-w-full max-h-full object-contain aspect-[4/3] bg-white rounded-xl shadow-2xl transition-all ${
          isDrawer ? 'cursor-crosshair' : 'cursor-default pointer-events-none'
        }`}
      />
    </div>
  );
}
