export function getCaretCoordinates(
  element: HTMLTextAreaElement | HTMLInputElement,
  position: number
): { top: number; left: number; height: number } {
  const isInput = element.nodeName === "INPUT";
  const computed = window.getComputedStyle(element);

  // Create mirror div
  const div = document.createElement("div");
  document.body.appendChild(div);

  const style = div.style;
  style.position = "absolute";
  style.visibility = "hidden";
  style.whiteSpace = "pre-wrap";
  if (!isInput) style.wordWrap = "break-word";

  // Copy relevant styles
  const properties = [
    "direction",
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "borderStyle",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
    "MozTabSize",
  ] as const;

  for (const prop of properties) {
    if (isInput && prop === "lineHeight") {
      style.lineHeight = computed.height;
    } else {
      // @ts-expect-error — computed is CSSStyleDeclaration
      style[prop] = computed[prop];
    }
  }

  // Adjust overflow for Firefox quirks
  if ('mozInnerScreenX' in window) {
    if (element.scrollHeight > parseInt(computed.height)) {
      style.overflowY = "scroll";
    }
  } else {
    style.overflow = "hidden";
  }

  // Set text content up to caret
  div.textContent = element.value.substring(0, position);
  if (isInput) {
    div.textContent = div.textContent.replace(/\s/g, "\u00a0");
  }

  // Create span for caret position
  const span = document.createElement("span");
  span.textContent = element.value.substring(position) || ".";
  div.appendChild(span);

  // Measure
  const coords = {
    top: span.offsetTop + parseInt(computed.borderTopWidth),
    left: span.offsetLeft + parseInt(computed.borderLeftWidth),
    height: parseInt(computed.lineHeight),
  };

  document.body.removeChild(div);
  return coords;
}
