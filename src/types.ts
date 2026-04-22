export interface Prize {
  id: string;
  label: string;
  weight: number;
  color: string;
  isWin: boolean;
}

export interface SpinResult {
  prize: Prize;
  coupon: string;
  angle: number;
}
