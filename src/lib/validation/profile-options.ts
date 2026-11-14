import type { ProfileInput } from "@/lib/validation/profile";

type Option<T extends string> = { value: T; label: string };

export const POSITION_OPTIONS: Option<ProfileInput["position"]>[] = [
  { value: "PG", label: "Base" },
  { value: "SG", label: "Escolta" },
  { value: "SF", label: "Alero" },
  { value: "PF", label: "Ala-Pívot" },
  { value: "C", label: "Pívot" },
];

export const FORMAT_OPTIONS: Option<ProfileInput["format"]>[] = [
  { value: "FIVE_V_FIVE", label: "5v5" },
  { value: "THREE_X_THREE", label: "3x3" },
];

export const HANDEDNESS_OPTIONS: Option<ProfileInput["handedness"]>[] = [
  { value: "RIGHT", label: "Diestro" },
  { value: "LEFT", label: "Zurdo" },
];

export const LEVEL_OPTIONS: Option<ProfileInput["level"]>[] = [
  { value: "BEGINNER", label: "Principiante" },
  { value: "INTERMEDIATE", label: "Intermedio" },
  { value: "ADVANCED", label: "Avanzado" },
];

export const GOAL_OPTIONS: Option<ProfileInput["goals"][number]>[] = [
  { value: "SHOOTING", label: "Tiro exterior" },
  { value: "BALL_HANDLING", label: "Ball handling" },
  { value: "VERTICAL", label: "Explosividad vertical" },
  { value: "DEFENSE", label: "Defensa" },
];
