export type StillState = {
  id: string;
  read: boolean;
  rate: number;
};

export type StillInfo = {
  id: string;
  groupIds: number[];
  seq: number;
  label: string;
  image: string;
  read: boolean;
  rate: number;
};
