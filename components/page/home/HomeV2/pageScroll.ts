/** The directory scrolls `<body>`, not the document element. */
export function readPageScroll() {
  return document.body.scrollTop;
}

/** Two writes: the close can land before the browser applies the first one. */
export function writePageScroll(top: number) {
  document.body.scrollTop = top;
  requestAnimationFrame(() => {
    document.body.scrollTop = top;
  });
}
