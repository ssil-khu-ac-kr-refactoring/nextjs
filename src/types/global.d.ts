declare module "@/components/RichEditor";
// Ambient declaration so the ssr:false dynamic import() in app/spis/page.tsx
// resolves under NodeNext ESM mode (same pattern as RichEditor above).
declare module "@/components/spis/SpisApp";