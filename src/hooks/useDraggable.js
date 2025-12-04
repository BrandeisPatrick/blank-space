import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for making elements draggable
 * Supports both mouse and touch events for desktop and mobile
 * @param {Object} initialPosition - Initial position {x, y}
 * @param {string} handleSelector - CSS selector for drag handle (optional)
 * @returns {Object} - { position, isDragging, handleMouseDown, handleTouchStart, style }
 */
export const useDraggable = (initialPosition = { x: 0, y: 0 }, handleSelector = null) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Shared logic to check if drag should start
  const shouldStartDrag = useCallback((target, currentTarget) => {
    // Don't start drag if clicking on interactive elements
    const isInteractive = target.closest('button, input, select, a');
    if (isInteractive) {
      return false;
    }

    // If handleSelector is specified, verify we're on the correct element
    if (handleSelector) {
      const matchesSelector = currentTarget.matches && currentTarget.matches(handleSelector);
      const hasMatchingClass = handleSelector.startsWith('.') && currentTarget.classList.contains(handleSelector.substring(1));
      if (!matchesSelector && !hasMatchingClass) {
        return false;
      }
    }

    return true;
  }, [handleSelector]);

  // Mouse handler
  const handleMouseDown = useCallback((e) => {
    if (!shouldStartDrag(e.target, e.currentTarget)) return;

    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position, shouldStartDrag]);

  // Touch handler
  const handleTouchStart = useCallback((e) => {
    if (!shouldStartDrag(e.target, e.currentTarget)) return;

    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  }, [position, shouldStartDrag]);

  useEffect(() => {
    if (!isDragging) return;

    // Mouse move handler
    const handleMouseMove = (e) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      const maxX = window.innerWidth - 100;
      const maxY = window.innerHeight - 100;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    // Touch move handler
    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;

      const maxX = window.innerWidth - 100;
      const maxY = window.innerHeight - 100;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    // Add both mouse and touch listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, dragStart]);

  const style = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none', // Prevent default touch behaviors like scrolling
  };

  return {
    position,
    setPosition,
    isDragging,
    handleMouseDown,
    handleTouchStart,
    style,
  };
};
