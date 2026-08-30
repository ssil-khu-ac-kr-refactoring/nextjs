type Props = {
  primary: string;
  secondary?: string;
  className?: string;
};

/**
 * 히어로 제목(SSIL).
 *
 * 이전 버전은 framer-motion으로 글자별 blur+y+stagger 진입 애니메이션을 했는데,
 * SSR가 initial="hidden"(opacity:0; translateY(40px))을 인라인으로 심고 나서
 * 클라이언트 애니메이션이 (백그라운드 탭 rAF 정지·재렌더 등으로) 제대로 안 돌면
 * 글자가 hidden에 멈추거나, 표시되는 순간 text-center가 아직 안 먹어 "왼쪽에
 * 나타났다가 중앙으로 튀는" 현상이 났다.
 *
 * 신뢰성 우선으로 진입 애니메이션을 제거하고 정적으로 렌더한다.
 * text-align:center를 인라인으로 박아 CSS 번들 로드 타이밍과 무관하게
 * 첫 페인트부터 항상 가운데·항상 표시되도록 한다.
 */
export function AnimatedHeadline({ primary, secondary, className }: Props) {
  return (
    <h1 className={className} style={{ textAlign: "center" }}>
      <span className="block bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent leading-[1.05]">
        {primary}
      </span>
      {secondary && (
        <span className="block mt-2 text-white leading-[1.1]">{secondary}</span>
      )}
    </h1>
  );
}
