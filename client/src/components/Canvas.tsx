import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../hooks/useSocket';
import { Stroke, Point, Tool, GamePhase } from '../types';

const VIRTUAL_WIDTH = 800;
const VIRTUAL_HEIGHT = 600;

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPointsRef = useRef<Point[]>([]);

  const store = useGameStore();
  const socket = getSocket();

  const isDrawer = store.currentDrawerId === store.playerId && store.phase === GamePhase.DRAWING;

  // Redraw all strokes on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Draw saved strokes
    store.strokes.forEach((stroke) => {
      if (stroke.points.length < 1) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === Tool.ERASER ? '#FFFFFF' : stroke.color;
      ctx.lineWidth = stroke.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.brushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.tool === Tool.ERASER ? '#FFFFFF' : stroke.color;
        ctx.fill();
      } else {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          const prev = stroke.points[i - 1];
          const curr = stroke.points[i];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }
    });

    // Draw active stroke if drawing
    if (currentPointsRef.current.length > 0) {
      const points = currentPointsRef.current;
      ctx.beginPath();
      ctx.strokeStyle = store.currentTool === Tool.ERASER ? '#FFFFFF' : store.currentColor;
      ctx.lineWidth = store.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (points.length === 1) {
        ctx.arc(points[0].x, points[0].y, store.brushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = store.currentTool === Tool.ERASER ? '#FFFFFF' : store.currentColor;
        ctx.fill();
      } else {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }
    }
  }, [store.strokes, store.currentTool, store.currentColor, store.brushSize]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Convert client coordinates to virtual canvas (800x600) coordinates
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
    if (!isDrawer) return;
    const point = getCoordinates(e);
    if (!point) return;

    setIsDrawing(true);
    currentPointsRef.current = [point];
    redrawCanvas();
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer) return;
    const point = getCoordinates(e);
    if (!point) return;

    currentPointsRef.current.push(point);
    redrawCanvas();
  };

  const handleEnd = () => {
    if (!isDrawing || !isDrawer) return;
    setIsDrawing(false);

    if (currentPointsRef.current.length > 0) {
      const newStroke: Stroke = {
        id: Math.random().toString(36).substring(2, 9),
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
    redrawCanvas();
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
        className={`max-w-full max-h-full object-contain aspect-[4/3] bg-white rounded-lg shadow-md ${
          isDrawer ? 'cursor-crosshair' : 'cursor-default pointer-events-none'
        }`}
      />
    </div>
  );
}
