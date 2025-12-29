/**
 * Interaction Debugging
 * Specialized debugging for click/move/drag issues
 */

/**
 * Check if description indicates an interaction issue
 */
export function isInteractionIssue(userDescription) {
  const lowerDesc = (userDescription || '').toLowerCase();
  return /can('t|not)?\s*(click|move|drag|select|interact|tap|touch|press)/i.test(lowerDesc) ||
    /not\s*(working|responding|clickable|draggable)/i.test(lowerDesc) ||
    /won('t|t)\s*(move|click|work|respond)/i.test(lowerDesc);
}

/**
 * Build interaction-specific debugging instructions
 */
export function buildInteractionDebugging() {
  return `
# INTERACTION BUG DEBUGGING (CRITICAL)

The user reports they cannot click/move/interact with something. Check IN THIS ORDER:

## 1. EVENT HANDLER NOT ATTACHED
Find the element the user is trying to interact with. Does it have onClick, onMouseDown, etc.?

EXAMPLE BUG:
  <div className="chess-piece">{piece}</div>  // No onClick!

FIX:
  <div className="chess-piece" onClick={() => handleClick(row, col)}>{piece}</div>

## 2. EVENT HANDLER ON WRONG ELEMENT
The handler might be on a parent/sibling instead of the clickable element.

## 3. CSS BLOCKING CLICKS
Search for: pointer-events: none, z-index issues, overlays

## 4. HANDLER FUNCTION NOT DOING ANYTHING
- Empty or has early return
- Updates the wrong state
- Condition inside never passes

## 5. STATE NOT CONNECTED TO RENDER
State updates but component doesn't use that state to show the change.

# DEBUGGING PROCESS:
1. READ App.jsx - find all event handlers
2. FIND the element user interacts with
3. CHECK if that element has the right handler attached
4. IF NO HANDLER: Add it
5. IF HANDLER EXISTS: Trace the function logic
6. CHECK CSS for pointer-events issues
`;
}
