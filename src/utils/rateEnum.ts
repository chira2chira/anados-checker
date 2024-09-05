export const Rate = {
  RED: 0,
  YELLOW: 1,
  GREEN: 2,
  BLUE: 3,
  PURPLE: 4,
  BLACK: 5,
  WHITE: 6,
} as const;

export type RateType = (typeof Rate)[keyof typeof Rate];

export function getRateEmoji(rate: RateType): string {
  switch (rate) {
    case 0:
      return "💖";
    case 1:
      return "💛";
    case 2:
      return "💚";
    case 3:
      return "💙";
    case 4:
      return "💜";
    case 5:
      return "🖤";
    case 6:
      return "🤍";
  }
}
