import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for making elements resizable
 * @param {Object} initialSize - Initial size {width, height}
 * @param {Object} minSize - Minimum size {width, height}
 * @returns {Object} - { size, isResizing, handleMouseDown, style }
 */
export const useResizable = (
  initialSize = { width: 800, height: 600 },
  minSize = { width: 400, height: 300 }
) => {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [resizeDirection, setResizeDirection] = useState('');

  const handleMouseDown = useCallback((direction) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  }, [size]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;

      // Handle different resize directions
      if (resizeDirection.includes('e')) {
        newWidth = resizeStart.width + deltaX;
      }
      if (resizeDirection.includes('w')) {
        newWidth = resizeStart.width - deltaX;
      }
      if (resizeDirection.includes('s')) {
        newHeight = resizeStart.height + deltaY;
      }
      if (resizeDirection.includes('n')) {
        newHeight = resizeStart.height - deltaY;
      }

      // Apply min/max constraints
      const maxWidth = window.innerWidth - 100;
      const maxHeight = window.innerHeight - 100;

      setSize({
        width: Math.max(minSize.width, Math.min(newWidth, maxWidth)),
        height: Math.max(minSize.height, Math.min(newHeight, maxHeight)),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, resizeDirection, minSize]);

  const style = {
    width: `${size.width}px`,
    height: `${size.height}px`,
  };

  // Resize handles for all 8 directions
  const ResizeHandles = () => (
    <>
      {/* Corners */}
      <div
        onMouseDown={handleMouseDown('nw')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '10px',
          height: '10px',
          cursor: 'nw-resize',
          zIndex: 10,
        }}
      />
      <div
        onMouseDown={handleMouseDown('ne')}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '10px',
          height: '10px',
          cursor: 'ne-resize',
          zIndex: 10,
        }}
      />
      <div
        onMouseDown={handleMouseDown('sw')}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '10px',
          height: '10px',
          cursor: 'sw-resize',
          zIndex: 10,
        }}
      />
      <div
        onMouseDown={handleMouseDown('se')}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '10px',
          height: '10px',
          cursor: 'se-resize',
          zIndex: 10,
        }}
      />
      {/* Edges */}
      <div
        onMouseDown={handleMouseDown('n')}
        style={{
          position: 'absolute',
          top: 0,
          left: '10px',
          right: '10px',
          height: '5px',
          cursor: 'n-resize',
          zIndex: 10,
        }}
      />
      <div
        onMouseDown={handleMouseDown('s')}
        style={{
          position: 'absolute',
          bottom: 0,
          left: '10px',
          right: '10px',
          height: '5px',
          cursor: 's-resize',
          zIndex: 10,
        }}
      />
      <div
        onMouseDown={handleMouseDown('e')}
        style={{
          position: 'absolute',
          top: '10px',
          bottom: '10px',
          right: 0,
          width: '5px',
          cursor: 'e-resize',
          zIndex: 10,
        }}
      />
      <div
        onMouseDown={handleMouseDown('w')}
        style={{
          position: 'absolute',
          top: '10px',
          bottom: '10px',
          left: 0,
          width: '5px',
          cursor: 'w-resize',
          zIndex: 10,
        }}
      />
    </>
  );

  return {
    size,
    setSize,
    isResizing,
    style,
    ResizeHandles,
  };
};
