type StepDotsProps = {
  total: number;
  current: number;
};

export function StepDots({ total, current }: StepDotsProps) {
  return (
    <div
      className="hb-step-dots"
      role="list"
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          role="listitem"
          data-on={i + 1 === current ? "true" : "false"}
          aria-current={i + 1 === current ? "step" : undefined}
        />
      ))}
    </div>
  );
}
