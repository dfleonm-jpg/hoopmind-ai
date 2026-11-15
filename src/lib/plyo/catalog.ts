/**
 * Plyometrics catalog (v4 Fase 6). 8 basketball-focused drills with
 * stretch-shortening-cycle phases, target ground-contact time, strict rest,
 * visual mistakes to avoid, and weekly contact-volume guidance.
 * Pure data; drives the animated visualizer and the court timer.
 */

export type PlyoSlug =
  | "pogo_hops"
  | "box_jump_stick"
  | "depth_drop_jump"
  | "lateral_skater_bounds"
  | "bulgarian_split_jump"
  | "broad_jump_sprint"
  | "med_ball_slam_jump"
  | "single_leg_ankle_hops";

export type PlyoCategory = "REACTIVE" | "CONCENTRIC" | "SSC" | "LATERAL" | "UNILATERAL" | "HORIZONTAL";

export interface PlyoDrill {
  slug: PlyoSlug;
  name: string;
  focus: string;
  category: PlyoCategory;
  /** Target ground-contact time in ms (null for pure concentric). */
  contactMs: number | null;
  sets: number;
  reps: number;
  restSeconds: number;
  /** Contacts per rep (both feet = 2 for bilateral hops counts as reps here). */
  contactsPerRep: number;
  mistakes: string[];
}

export const PLYO_CATALOG: PlyoDrill[] = [
  {
    slug: "pogo_hops",
    name: "Pogo Hops",
    focus: "Reactividad de tobillo y tendón de Aquiles",
    category: "REACTIVE",
    contactMs: 120,
    sets: 3,
    reps: 15,
    restSeconds: 90,
    contactsPerRep: 1,
    mistakes: ["Flexionar las rodillas (debe ser rigidez de tobillo)", "Contacto largo y blando"],
  },
  {
    slug: "box_jump_stick",
    name: "Box Jump & Stick",
    focus: "Potencia concéntrica y aterrizaje silencioso",
    category: "CONCENTRIC",
    contactMs: null,
    sets: 4,
    reps: 5,
    restSeconds: 120,
    contactsPerRep: 1,
    mistakes: ["Aterrizaje rígido/ruidoso", "Cajón demasiado alto", "Saltar hacia atrás al bajar"],
  },
  {
    slug: "depth_drop_jump",
    name: "Depth / Drop Jump",
    focus: "Ciclo estiramiento-acortamiento para salto vertical máximo",
    category: "SSC",
    contactMs: 200,
    sets: 4,
    reps: 5,
    restSeconds: 120,
    contactsPerRep: 1,
    mistakes: ["Contacto > 250 ms (pierde reactividad)", "Valgo de rodilla al aterrizar", "Caer con talones"],
  },
  {
    slug: "lateral_skater_bounds",
    name: "Lateral Skater Bounds",
    focus: "Explosividad lateral para defensa 1v1 y cambios de dirección",
    category: "LATERAL",
    contactMs: 180,
    sets: 3,
    reps: 10,
    restSeconds: 90,
    contactsPerRep: 2,
    mistakes: ["Rodilla hacia dentro al aterrizar", "Poco empuje lateral"],
  },
  {
    slug: "bulgarian_split_jump",
    name: "Bulgarian Split Jump",
    focus: "Potencia unilateral en despegue a una pierna",
    category: "UNILATERAL",
    contactMs: null,
    sets: 3,
    reps: 6,
    restSeconds: 120,
    contactsPerRep: 1,
    mistakes: ["Rodilla delantera colapsando hacia dentro", "Torso demasiado inclinado"],
  },
  {
    slug: "broad_jump_sprint",
    name: "Broad Jump → Sprint",
    focus: "Aceleración horizontal y primer paso",
    category: "HORIZONTAL",
    contactMs: null,
    sets: 4,
    reps: 4,
    restSeconds: 120,
    contactsPerRep: 1,
    mistakes: ["Aterrizaje descontrolado antes del sprint", "No extender la cadera por completo"],
  },
  {
    slug: "med_ball_slam_jump",
    name: "Med Ball Slam + Jump",
    focus: "Triple extensión de cadena completa",
    category: "CONCENTRIC",
    contactMs: null,
    sets: 3,
    reps: 8,
    restSeconds: 90,
    contactsPerRep: 1,
    mistakes: ["Usar solo los brazos", "No extender tobillo-rodilla-cadera"],
  },
  {
    slug: "single_leg_ankle_hops",
    name: "Single-Leg Ankle Hops",
    focus: "Prevención de esguinces y rigidez reactiva",
    category: "UNILATERAL",
    contactMs: 150,
    sets: 3,
    reps: 10,
    restSeconds: 90,
    contactsPerRep: 1,
    mistakes: ["Tobillo inestable (trabaja el control)", "Aterrizaje plano"],
  },
];

export function getPlyo(slug: PlyoSlug): PlyoDrill | undefined {
  return PLYO_CATALOG.find((d) => d.slug === slug);
}

/**
 * Safe weekly plyometric contact volume by bodyweight (heavier athletes take
 * fewer impacts to protect knees/joints). Returns max contacts per SESSION.
 */
export function safeContactsPerSession(weightKg: number): number {
  if (weightKg >= 100) return 80;
  if (weightKg >= 85) return 100;
  if (weightKg >= 70) return 120;
  return 140;
}
