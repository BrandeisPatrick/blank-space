import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for making elements draggable
 * @param {Object} initialPosition - Initial position {x, y}
 * @param {string} handleSelector - CSS selector for drag handle (optional)
 * @returns {Object} - { position, isDragging, handleMouseDown, style }
 */
export const useDraggable = (initialPosition = { x: 0, y: 0 }, handleSelector = null) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    // Don't start drag if clicking on interactive elements (or their children like SVG icons)
    const isInteractive = e.target.closest('button, input, select, a');
    if (isInteractive) {
      return;
    }

    // If handleSelector is specified, verify we're clicking on the correct element
    if (handleSelector) {
      // Check if the element with the handler matches the selector
      const targetElement = e.currentTarget;
      const matchesSelector = targetElement.matches && targetElement.matches(handleSelector);
      const hasMatchingClass = handleSelector.startsWith('.') && targetElement.classList.contains(handleSelector.substring(1));

      if (!matchesSelector && !hasMatchingClass) {
        return;
      }
    }

    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position, handleSelector]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Keep window within viewport bounds
      const maxX = window.innerWidth - 100; // Minimum 100px visible
      const maxY = window.innerHeight - 100;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const style = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return {
    position,
    setPosition,
    isDragging,
    handleMouseDown,
    style,
  };
};
