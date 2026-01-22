
export interface BoardConfig {
  headline: string;
  imagePrompt: string;
  includeLogo: boolean;
}

export interface AppData {
  streetPhoto: string | null;
  clientName: string;
  clientLogo: string | null;
  brandUrl: string;
  primaryColor: string;
  boards: BoardConfig[];
}

export enum AppStep {
  STREET_PHOTO = 0,
  CLIENT_INFO = 1,
  BRAND_ASSETS = 2,
  BOARD_1 = 3,
  BOARD_2 = 4,
  BOARD_3 = 5,
  SUMMARY = 6,
  GENERATING = 7,
  RESULT = 8
}
