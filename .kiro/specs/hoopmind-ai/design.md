# Design — HoopMind AI

## Visión general

HoopMind AI es una PWA full-stack construida sobre Next.js 16 (App Router) y React 19 con TypeScript estricto. La app corre mayoritariamente en el cliente para el modo entrenamiento (temporizador, contador, pizarra táctica y análisis de pose), y usa Route Handlers del App Router para la generación de rutinas con IA y la persistencia. La base de datos es PostgreSQL gestionada por Supabase (auth + RLS) con Prisma ORM. La generación de rutinas usa el AI SDK de Vercel (`generateObject`) con un esquema Zod que fuerza y valida Structured Outputs del LLM (Groq o Gemini vía provider del SDK).

### Mapa de la arquitectura

```
                      ┌──────────────────────────────────────────────┐
                      │               Cliente (PWA)                    │
                      │  Next.js App Router · React 19 · Tailwind v4   │
                      │                                                 │
  Onboarding ─────────┤  /onboarding   /dashboard   /train   /analyze  │
                      │     │             │            │         │      │
                      │     │       ShotChart     TacticBoard  Pose     │
                      │     │                     (SVG+Framer) (lazy)   │
                      │     ▼                                            │
                      │  Server Actions / fetch  ──────────────┐        │
                      │  Service Worker (app shell + offline)   │        │
                      └─────────────────────────────────────────┼───────┘
                                                                 │
                      ┌──────────────────────────────────────────▼──────┐
                      │          Route Handlers (Next server)            │
                      │  /api/generate-workout  /api/workouts            │
                      │  /api/sessions  /api/shots  /api/profile         │
                      │        │                      │                  │
                      │        ▼                      ▼                  │
                      │   AI SDK (generateObject)   Prisma Client        │
                      └────────┼──────────────────────┼──────────────────┘
                               │                      │
                     ┌─────────▼─────────┐   ┌────────▼──────────┐
                     │  LLM provider      │   │  Supabase Postgres │
                     │  (Groq / Gemini)   │   │  Auth + RLS        │
                     └────────────────────┘   └────────────────────┘
```

### Decisiones clave
- **Estructura de capas**: `app/` (rutas y handlers), `components/` (UI), `lib/` (ai, db, pose, audio, utils), `prisma/` (schema + migraciones). TypeScript `strict: true` + `noUncheckedIndexedAccess`.
- **IA type-safe**: una sola fuente de verdad para el contrato de rutina — el esquema Zod. De él se derivan el tipo TS (`z.infer`) y la validación de la respuesta del modelo.
- **Separación cliente/servidor**: la clave del proveedor de IA vive solo en el servidor (Route Handler). El análisis de pose vive solo en el cliente (el video no sale del dispositivo).
- **Pizarra táctica basada en datos**: los drills son datos (listas de keyframes), no código imperativo; el componente interpreta esos datos. Esto permite precargar drills y, a futuro, generarlos.

---

## Esquema de base de datos (Prisma / PostgreSQL)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Position      { PG SG SF PF C }
enum PlayFormat    { FIVE_V_FIVE THREE_X_THREE }
enum Handedness    { LEFT RIGHT }
enum SkillLevel    { BEGINNER INTERMEDIATE ADVANCED }
enum Goal          { SHOOTING BALL_HANDLING VERTICAL DEFENSE }
enum Scenario      { FULL_COURT HALF_COURT STREET GYM_NO_HOOP }
enum BlockType     { WARMUP TECHNIQUE FINISHING CONDITIONING COOLDOWN }
enum SessionStatus { IN_PROGRESS COMPLETED ABANDONED }

// Usuario = identidad de Supabase Auth (auth.users.id). No se almacena contraseña aquí.
model User {
  id        String   @id @db.Uuid            // = auth.uid()
  email     String   @unique
  createdAt DateTime @default(now())
  profile   Profile?
  workouts  Workout[]
  sessions  Session[]
}

model Profile {
  id          String      @id @default(uuid()) @db.Uuid
  userId      String      @unique @db.Uuid
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  heightCm    Int                              // 120–240
  weightKg    Int                              // 30–200
  position    Position
  format      PlayFormat
  handedness  Handedness
  level       SkillLevel
  goals       Goal[]                           // 1–4
  isComplete  Boolean     @default(false)
  updatedAt   DateTime    @updatedAt
}

model Workout {
  id           String        @id @default(uuid()) @db.Uuid
  userId       String        @db.Uuid
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title        String
  scenario     Scenario
  durationMin  Int                             // 30 | 45 | 60
  difficulty   Int           @default(3)        // 1–5, ajustado progresivamente
  content      Json                             // WorkoutSchema validado (fuente de verdad)
  createdAt    DateTime      @default(now())
  blocks       WorkoutBlock[]
  sessions     Session[]
}

// Normalización ligera para consulta/listado; el Json de Workout mantiene el detalle completo.
model WorkoutBlock {
  id          String    @id @default(uuid()) @db.Uuid
  workoutId   String    @db.Uuid
  workout     Workout   @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  type        BlockType
  order       Int
  durationMin Int
  exercises   Exercise[]
}

model Exercise {
  id          String       @id @default(uuid()) @db.Uuid
  blockId     String       @db.Uuid
  block       WorkoutBlock @relation(fields: [blockId], references: [id], onDelete: Cascade)
  order       Int
  name        String
  description String
  reps        String?                           // p. ej. "3x10" o "5 min"
  drillId     String?                           // referencia a drill precargado para la pizarra
  shotLogs    ShotLog[]
}

model Session {
  id             String        @id @default(uuid()) @db.Uuid
  userId         String        @db.Uuid
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  workoutId      String        @db.Uuid
  workout        Workout       @relation(fields: [workoutId], references: [id])
  status         SessionStatus @default(IN_PROGRESS)
  startedAt      DateTime      @default(now())
  endedAt        DateTime?
  realDurationS  Int?
  shotLogs       ShotLog[]
  shotAnalyses   ShotAnalysis[]
}

// Agregado de tiros por ejercicio y zona dentro de una sesión.
model ShotLog {
  id         String   @id @default(uuid()) @db.Uuid
  sessionId  String   @db.Uuid
  session    Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  exerciseId String?  @db.Uuid
  exercise   Exercise? @relation(fields: [exerciseId], references: [id])
  zone       String                            // id de zona (ver Shot chart)
  made       Int      @default(0)
  attempted  Int      @default(0)
  createdAt  DateTime @default(now())
}

// Resultado del analizador de tiro por cámara (métricas, nunca el video).
model ShotAnalysis {
  id          String   @id @default(uuid()) @db.Uuid
  sessionId   String?  @db.Uuid
  session     Session? @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  elbowAngle  Float                             // grados
  kneeFlexion Float                             // grados
  releaseMs   Int                               // momento de liberación relativo
  confidence  Float                             // 0–1
  createdAt   DateTime @default(now())
}
```

**Índices y RLS**
- Índices: `Workout(userId, createdAt)`, `Session(userId, startedAt)`, `ShotLog(sessionId, zone)`.
- RLS en Supabase: cada tabla con `userId` filtra `userId = auth.uid()` para `select/insert/update/delete`. `Workout`/`Session` se escriben solo desde el servidor con el `userId` de la sesión verificada.

---

## Contratos de API (Route Handlers, App Router)

Todas las rutas requieren sesión autenticada salvo indicación. Errores en formato `{ error: { code, message } }`. Códigos: `400` validación de entrada, `401` sin sesión, `422` salida de IA inválida tras reintentos, `503` proveedor IA no disponible.

### `POST /api/generate-workout`
Genera y persiste una rutina.
```jsonc
// Request
{
  "durationMin": 45,              // 30 | 45 | 60
  "scenario": "HALF_COURT"        // FULL_COURT | HALF_COURT | STREET | GYM_NO_HOOP
}
// Response 200  → Workout persistido (content = WorkoutSchema)
{ "id": "uuid", "title": "…", "durationMin": 45, "scenario": "HALF_COURT",
  "difficulty": 3, "content": { /* Workout (ver Zod) */ } }
```
El handler lee el `Profile` del usuario, construye el prompt, llama al AI SDK con `generateObject({ schema: WorkoutSchema })`, valida, persiste (`Workout` + `WorkoutBlock` + `Exercise`) y responde. Reintenta hasta 2 veces ante fallo de validación.

### `GET /api/workouts` · `GET /api/workouts/:id`
Lista las rutinas del usuario (paginadas) / devuelve una rutina con sus bloques y ejercicios.

### `POST /api/sessions`
Crea una sesión `IN_PROGRESS` para un `workoutId`.
```jsonc
{ "workoutId": "uuid" } // → { "id": "uuid", "status": "IN_PROGRESS", "startedAt": "…" }
```

### `PATCH /api/sessions/:id`
Finaliza o abandona la sesión y persiste la duración real.
```jsonc
{ "status": "COMPLETED", "realDurationS": 2730 }
```

### `POST /api/sessions/:id/shots`
Registra o actualiza el agregado de tiros por ejercicio/zona (idempotente por `sessionId+exerciseId+zone`).
```jsonc
{ "exerciseId": "uuid", "zone": "right_corner_3", "made": 7, "attempted": 10 }
```

### `POST /api/sessions/:id/analysis`  *(opcional, requiere consentimiento)*
Guarda métricas del analizador de tiro (no el video).
```jsonc
{ "elbowAngle": 88.5, "kneeFlexion": 112.0, "releaseMs": 430, "confidence": 0.82 }
```

### `GET /api/profile` · `PUT /api/profile`
Lee / crea-actualiza el perfil. `PUT` valida rangos y cuenta de objetivos (1–4) con Zod antes de persistir.

### `GET /api/stats?from=&to=&format=`
Devuelve agregados para el dashboard: porcentaje por zona (shot chart), rachas y dificultad sugerida.
```jsonc
{
  "zones": [ { "zone": "right_corner_3", "made": 21, "attempted": 30, "pct": 0.70 } ],
  "streak": { "current": 4, "best": 11 },
  "suggestedDifficulty": 4
}
```

---

## Esquemas Zod para la IA (Structured Output)

Fuente única de verdad del contrato de rutina. Se usa en `generateObject` y para derivar el tipo TS.

```ts
// lib/ai/schema.ts
import { z } from "zod";

export const BlockType = z.enum([
  "WARMUP", "TECHNIQUE", "FINISHING", "CONDITIONING", "COOLDOWN",
]);

export const ExerciseSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().min(10).max(400),
  reps: z.string().max(40).describe("p. ej. '3x10', '5 min', '20 tiros'"),
  intensity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  drillId: z
    .enum(["pick_and_roll", "dribble_drive_stepback", "catch_and_shoot_move"])
    .nullable()
    .describe("id de drill precargado si aplica, si no null"),
});

export const BlockSchema = z.object({
  type: BlockType,
  durationMin: z.number().int().min(1).max(30),
  exercises: z.array(ExerciseSchema).min(1).max(6),
});

export const WorkoutSchema = z.object({
  title: z.string().min(3).max(80),
  summary: z.string().min(10).max(300),
  totalDurationMin: z.number().int().min(28).max(62),
  // Orden fijo garantizado por refine:
  blocks: z.array(BlockSchema).length(5),
}).refine(
  (w) => w.blocks.map((b) => b.type).join() ===
         "WARMUP,TECHNIQUE,FINISHING,CONDITIONING,COOLDOWN",
  { message: "Los bloques deben seguir el orden canónico de 5 fases" },
);

export type Workout = z.infer<typeof WorkoutSchema>;

// Entrada del endpoint
export const GenerateWorkoutInput = z.object({
  durationMin: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  scenario: z.enum(["FULL_COURT", "HALF_COURT", "STREET", "GYM_NO_HOOP"]),
});
```

**Uso en el handler**
```ts
// lib/ai/generate.ts
import { generateObject } from "ai";
import { WorkoutSchema } from "./schema";
import { model } from "./provider"; // Groq o Gemini vía AI SDK

export async function generateWorkout(prompt: string) {
  const { object } = await generateObject({
    model,
    schema: WorkoutSchema,
    system: SYSTEM_PROMPT, // reglas de dominio: escenario sin aro ⇒ sin tiros a canasta, etc.
    prompt,
  });
  return object; // ya validado contra WorkoutSchema
}
```
El `provider` selecciona Groq o Gemini por variable de entorno (`AI_PROVIDER`), manteniendo el resto del código agnóstico. Timeout y 2 reintentos envuelven la llamada.

---

## Arquitectura de componentes — Pizarra táctica animada

### Modelo de datos del drill
Un drill es una lista de **pasos**; cada paso mueve entidades (jugadores, defensores, balón) por rutas y marca eventos (bote, cambio de ritmo, pase, tiro). Coordenadas normalizadas `0–1` sobre la media cancha (origen arriba-izquierda), escaladas por el componente.

```ts
// lib/drills/types.ts
export type EntityKind = "player" | "defender" | "ball" | "cone";
export type MoveKind   = "run" | "dribble" | "pass" | "shot" | "screen";

export interface Point { x: number; y: number } // 0–1

export interface DrillMove {
  entity: string;            // id de entidad
  kind: MoveKind;
  path: Point[];             // bézier/polilínea en coords normalizadas
  changeOfPace?: boolean;    // marca cambio de ritmo
  durationMs: number;
}

export interface DrillStep {
  label: string;             // descripción textual del paso (modo pausa / reduced-motion)
  moves: DrillMove[];
}

export interface Drill {
  id: "pick_and_roll" | "dribble_drive_stepback" | "catch_and_shoot_move";
  name: string;
  entities: { id: string; kind: EntityKind; start: Point }[];
  steps: DrillStep[];
}
```

Los 3 drills precargados (`lib/drills/presets.ts`): **Pick & Roll**, **Dribble Drive con Step-back**, **Catch & Shoot en movimiento**.

### Árbol de componentes
```
<TacticBoard drill controls>
├─ <CourtSVG/>            SVG de media cancha a escala (líneas reglamentarias)
├─ <DrillLayer step/>     capa animada sobre la cancha
│   ├─ <EntityToken/>     jugador/defensor/balón (motion.circle / motion.g)
│   └─ <MovePath/>        trazo del movimiento según MoveKind:
│                           run → línea continua · dribble → ondulada
│                           pass/shot → discontinua · screen → T invertida
├─ <StepCaption/>         texto del paso actual (visible en pausa y reduced-motion)
├─ <Legend/>              leyenda de trazos y entidades
└─ <PlaybackControls/>    play · pausa · reinicio · ‹ paso › 
```

### Animación y comportamiento
- **Framer Motion** anima tokens a lo largo de `path` usando `offsetPath`/keyframes y `motion.path` con `pathLength` para dibujar progresivamente las rutas. Los pasos se encadenan con una máquina de estados simple (`idle → playing(stepIndex) → paused → done`).
- **Trazos por tipo de movimiento**: `run` continuo, `dribble` ondulado (patrón SVG), `pass`/`shot` discontinuo (`strokeDasharray`), `screen` marca de bloqueo. Cada uno con la paleta de alto contraste.
- **Reduced motion** (Req. 4.6): si `useReducedMotion()` es `true`, se omite la animación y se renderiza cada paso como estado final con su `label`, navegable con los controles de paso.
- **Pausa** (Req. 4.5): muestra posiciones del paso actual + `StepCaption`.
- **Rendimiento**: el componente es `"use client"`, memoiza rutas calculadas y usa `transform` en vez de reflow. Escala responsiva vía `viewBox` del SVG (320 px en adelante).

---

## Analizador de tiro por cámara (módulo)

```ts
// lib/pose/types.ts
export interface ShotAnalysisResult {
  elbowAngle: number;   // grados
  kneeFlexion: number;  // grados
  releaseMs: number;    // ms desde inicio del gesto
  confidence: number;   // 0–1
}

export interface PoseEngine {
  analyzeShot(video: Blob | HTMLVideoElement): Promise<ShotAnalysisResult>;
}
```
- Implementación por defecto: `MediaPipePoseEngine` (o TF.js) cargada con `dynamic(() => import(...), { ssr: false })` (Req. 6.5).
- La UI (`/analyze`) depende de la interfaz `PoseEngine`, no de la implementación (Req. 6.6), permitiendo swap del motor.
- Procesamiento 100% en cliente; el video no se sube (Req. 6.2). Solo se persisten métricas, con consentimiento (Req. 6.7).
- Si `confidence < UMBRAL` (p. ej. 0.5): resultado marcado como no confiable + sugerencia de regrabar (Req. 6.4).

---

## Shot chart y zonas

Zonas de la media cancha (ids usados en `ShotLog.zone` y `GET /api/stats`):
`left_corner_3`, `left_wing_3`, `top_key_3`, `right_wing_3`, `right_corner_3`,
`left_mid`, `center_mid`, `right_mid`, `paint`, `free_throw`.

- El `ShotChart` reutiliza `CourtSVG` y pinta cada zona como polígono con color según `pct` (escala de calor sobre el acento naranja), tooltip con `made/attempted/pct` al tocar (Req. 7.6).
- `GET /api/stats` agrega `ShotLog` por zona con filtros de fecha/formato (Req. 7.2).
- **Rachas** (Req. 7.3): días consecutivos con ≥1 `Session COMPLETED`, calculadas sobre `startedAt`.
- **Dificultad progresiva** (Req. 7.4): `suggestedDifficulty` sube si el acierto reciente supera un umbral y hay sesiones completadas; baja si el acierto cae. Se pasa al prompt de la próxima generación.

---

## Diseño visual y PWA

- **Tema (Tailwind v4, config CSS-first `@theme`)**: tokens `--color-bg: #0A0A0C`, `--color-card: #141418`, `--color-accent: #FF5E1A`, texto alto contraste. Dark mode por defecto (sin toggle inicial). Contraste AA verificado (Req. 8.5).
- **Mobile-first**: layout de una columna desde 320 px; controles del modo activo ≥ 48×48 px en la zona del pulgar (Req. 8.6).
- **PWA**: `manifest.webmanifest` + íconos; service worker (vía `next-pwa`/Workbox o implementación propia) que cachea app shell y última rutina para uso offline del modo activo; cola de sincronización para `ShotLog`/`Session` cuando no hay red (Req. 8.2, 8.3).
- **Audio**: `lib/audio/feedback.ts` con Web Audio API para pitidos de acierto/intento/fin de bloque, con mute (Req. 5.3, 5.8).

---

## Estructura de carpetas

```
app/
  (auth)/login/page.tsx
  onboarding/page.tsx
  dashboard/page.tsx
  train/[workoutId]/page.tsx
  analyze/page.tsx
  api/
    generate-workout/route.ts
    workouts/route.ts        workouts/[id]/route.ts
    sessions/route.ts        sessions/[id]/route.ts
    sessions/[id]/shots/route.ts
    sessions/[id]/analysis/route.ts
    profile/route.ts
    stats/route.ts
components/
  tactic-board/  (TacticBoard, CourtSVG, DrillLayer, EntityToken, MovePath, Legend, PlaybackControls)
  training/      (ActiveSession, BlockTimer, ShotCounter)
  dashboard/     (ShotChart, StreakCard, StatsFilters)
  analyze/       (ShotAnalyzer — lazy)
  ui/            (primitivas, tema)
lib/
  ai/      (schema.ts, provider.ts, generate.ts, prompt.ts)
  db/      (prisma.ts, queries)
  drills/  (types.ts, presets.ts)
  pose/    (types.ts, mediapipe-engine.ts)
  audio/   (feedback.ts)
  supabase/ (client.ts, server.ts, auth helpers)
prisma/schema.prisma
public/manifest.webmanifest, icons/
```

---

## Manejo de errores (resumen)
- **IA inválida** tras 2 reintentos → `422` + UI de reintento (Req. 3.6).
- **Proveedor IA caído/timeout** → `503` + reintento (Req. 3.7).
- **Pose no confiable** → aviso + regrabar (Req. 6.4).
- **Sin red en sesión** → continuar offline + cola de sync (Req. 8.3).
- **Entrada inválida** en cualquier endpoint → `400` con detalle del campo, validado con Zod en el borde del servidor.
