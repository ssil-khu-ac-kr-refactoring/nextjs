// 다크/라이트 어디서도 어색하지 않은 8x5 회색 그라데이션 SVG.
// next/image의 placeholder="blur" + blurDataURL로 사용.
export const BLUR_DATA_URL =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="5"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2a2a"/><stop offset="1" stop-color="#1a1a1a"/></linearGradient></defs><rect width="8" height="5" fill="url(#g)"/></svg>`
  ).toString("base64");
