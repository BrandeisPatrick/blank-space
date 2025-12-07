import { useCallback, useRef } from "react";

/**
 * Hook for detecting long press on both touch and mouse devices
 * @param {Function} onLongPress - Callback when long press is detected
 * @param {Object} options - Configuration options
 * @param {number} options.delay - Duration in ms to trigger long press (default: 500)
 * @param {Function} options.onClick - Optional callback for regular clicks
 */
export const useLongPress = (onLongPress, options = {}) => {
  const { delay = 500, onClick } = options;
  const timerRef = useRef(null);
  const isLongPress = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const start = useCallback((e) => {
    // Store starting position to detect movement
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };

    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress?.(e);
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback((e, shouldTriggerClick = true) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Only trigger click if it wasn't a long press
    if (shouldTriggerClick && !isLongPress.current && onClick) {
      onClick(e);
    }
  }, [onClick]);

  const move = useCallback((e) => {
    // Cancel if user moves more than 10px (scrolling or dragging)
    if (timerRef.current) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaX = Math.abs(clientX - startPos.current.x);
      const deltaY = Math.abs(clientY - startPos.current.y);

      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: (e) => clear(e, false),
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: move,
  };
};

export default useLongPress;
