// SVG/CSS asset imports yield URL strings at build time.
// The consumer's bundler (Vite, webpack, etc.) handles the actual resolution;
// these ambient types just keep TS happy when the package is built standalone.

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.css' {
  const css: string;
  export default css;
}

declare module '*.png' {
  const src: string;
  export default src;
}
