# Implementation Plan — HoopMind AI

Tareas atómicas y secuenciales. Cada una se ejecuta y verifica una por una. Las referencias `_Requisitos: X.Y_` apuntan a `requirements.md`.

- [ ] 1. Inicializar el proyecto Next.js 16 + TypeScript estricto + Tailwind v4
  - Scaffold con App Router, `src`/alias `@/*`, TypeScript `strict` y `noUncheckedIndexedAccess` en `tsconfig.json`.
  - Configurar ESLint/Prettier y un script de `typecheck`.
  - Verificar: `npm run build` y `npm run typecheck` pasan sin errores.
  - _Requisitos: 8.7_

- [ ] 2. Definir el tema de alto contraste y el layout mobile-first
  - Declarar tokens en CSS-first `@theme` de Tailwind v4: `--color-bg #0A0A0C`, `--color-card #141418`, `--color-accent #FF5E1A`, escala de texto AA.
  - Aplicar dark mode por defecto en el `RootLayout`; layout de una columna desde 320 px.
  - Crear primitivas `ui/` (Button con objetivo táctil ≥ 48×48 px, Card, Input).
  - Verificar: contraste AA de texto y botones tamaño táctil en 320 px.
  - _Requisitos: 8.4, 8.5, 8.6, 8.7_

- [ ] 3. Configurar Prisma y el esquema de base de datos
  - Añadir Prisma, crear `prisma/schema.prisma` con enums, `User`, `Profile`, `Workout`, `WorkoutBlock`, `Exercise`, `Session`, `ShotLog`, `ShotAnalysis` e índices.
  - Generar cliente y crear la migración inicial contra una base Postgres local.
  - Crear `lib/db/prisma.ts` (singleton).
  - Verificar: `prisma migrate` aplica y `prisma validate` pasa.
  - _Requisitos: 1.4, 2.1, 3.8, 5.5, 6.7, 7.1_

- [ ] 4. Integrar Supabase Auth, sesión y RLS
  - Clientes `lib/supabase/{client,server}.ts`; helper de sesión en server.
  - Políticas RLS por tabla (`userId = auth.uid()`); sincronizar `auth.users` → `User`.
  - Middleware de protección de rutas; redirección a login y a onboarding si el perfil está incompleto.
  - Verificar: usuario A no puede leer datos de usuario B; ruta protegida redirige sin sesión.
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 5. Pantalla de autenticación (login / registro / logout)
  - UI de login/registro (email+contraseña y, opcional, OAuth) y acción de logout.
  - Manejo de credenciales inválidas sin filtrar el campo fallido.
  - Verificar criterios de redirección post-login según estado del perfil.
  - _Requisitos: 1.1, 1.2, 1.3, 1.5_

- [ ] 6. Validación de perfil con Zod y endpoints `/api/profile`
  - Esquema Zod de perfil (rangos altura 120–240, peso 30–200, objetivos 1–4).
  - `GET /api/profile` y `PUT /api/profile` con validación en el borde y persistencia.
  - Verificar: entrada inválida devuelve 400 con el campo señalado; válida persiste.
  - _Requisitos: 2.1, 2.2, 2.5_

- [ ] 7. Flujo de onboarding y edición de perfil
  - Formulario multipaso que captura todos los campos del Req. 2.1; bloquea avance con campos inválidos.
  - Al guardar, marca `isComplete` y navega al dashboard; modo edición precarga valores.
  - Verificar: perfil completo navega a dashboard; edición precarga y actualiza.
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.6_

- [ ] 8. Esquemas Zod de IA (fuente de verdad del contrato de rutina)
  - Crear `lib/ai/schema.ts` con `ExerciseSchema`, `BlockSchema`, `WorkoutSchema` (5 bloques en orden canónico, `refine`), `GenerateWorkoutInput` y tipos `z.infer`.
  - Verificar con tests unitarios: acepta una rutina válida y rechaza orden/duración/conteo inválidos.
  - _Requisitos: 3.2, 3.3, 3.4_

- [ ] 9. Provider de IA y función de generación
  - `lib/ai/provider.ts` (Groq o Gemini vía AI SDK, seleccionable por `AI_PROVIDER`, clave solo en servidor).
  - `lib/ai/prompt.ts` (system prompt con reglas de dominio: escenario sin aro ⇒ sin tiros a canasta; mapeo de objetivos/nivel/dificultad).
  - `lib/ai/generate.ts` con `generateObject({ schema: WorkoutSchema })`, timeout y 2 reintentos.
  - Verificar: con mock del modelo, salida válida pasa; salida inválida dispara reintentos.
  - _Requisitos: 3.2, 3.5, 3.6, 3.7, 7.4_

- [ ] 10. Endpoint `POST /api/generate-workout`
  - Validar entrada con `GenerateWorkoutInput`; leer `Profile`; generar; validar; persistir `Workout`+`WorkoutBlock`+`Exercise`; responder.
  - Mapear fallos: 422 (IA inválida tras reintentos), 503 (proveedor caído), 400 (entrada), 401 (sin sesión).
  - Verificar: duración total dentro de ±2 min; drillId poblado cuando aplica; errores con el código correcto.
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [ ] 11. Endpoints de rutinas `GET /api/workouts` y `GET /api/workouts/:id`
  - Listado paginado por usuario y detalle con bloques/ejercicios.
  - Verificar: solo devuelve rutinas del usuario autenticado.
  - _Requisitos: 1.4, 3.8_

- [ ] 12. Endpoints de sesión y tiros
  - `POST /api/sessions` (crear `IN_PROGRESS`), `PATCH /api/sessions/:id` (completar/abandonar + duración real), `POST /api/sessions/:id/shots` (upsert idempotente por `sessionId+exerciseId+zone`).
  - Verificar: transiciones de estado y agregados de tiros persisten correctamente.
  - _Requisitos: 5.5, 7.1_

- [ ] 13. SVG de media cancha reglamentaria (`CourtSVG`) y zonas
  - Componente `"use client"` con `viewBox` responsivo; líneas de perímetro, triple, zona, tiro libre y aro a escala.
  - Definir las 10 zonas como polígonos reutilizables (compartidas con el shot chart).
  - Verificar: render correcto y escalado desde 320 px.
  - _Requisitos: 4.1, 7.1_

- [ ] 14. Modelo de drills y 3 presets reales
  - `lib/drills/types.ts` (Drill, DrillStep, DrillMove) y `lib/drills/presets.ts` con Pick & Roll, Dribble Drive con Step-back y Catch & Shoot en movimiento.
  - Verificar: cada drill tiene entidades, pasos con labels y rutas en coords normalizadas.
  - _Requisitos: 4.3_

- [ ] 15. Pizarra táctica animada (`TacticBoard`) con Framer Motion
  - `DrillLayer`, `EntityToken`, `MovePath` (trazos por tipo: run/dribble/pass-shot/screen), `Legend`, `StepCaption`, `PlaybackControls` (play/pausa/reinicio/paso).
  - Máquina de estados de reproducción; soporte `prefers-reduced-motion` (secuencia estática navegable); estado y caption en pausa.
  - Verificar: anima paso a paso; pausa muestra posiciones+label; reduced-motion sin animación.
  - _Requisitos: 4.2, 4.4, 4.5, 4.6, 4.7_

- [ ] 16. Feedback sonoro (`lib/audio/feedback.ts`)
  - Web Audio API: pitidos de acierto, intento y fin de bloque; control de mute.
  - Verificar: suena en los eventos y el mute los silencia.
  - _Requisitos: 5.3, 5.8_

- [ ] 17. Modo entrenamiento activo (`/train/[workoutId]`)
  - Vista mobile-first: ejercicio y bloque actual, guía paso a paso, `BlockTimer` con cuenta regresiva y señal al llegar a cero, `ShotCounter` con botones grandes de encestado/intentado + feedback sonoro.
  - Pausar/reanudar/saltar; abrir `TacticBoard` cuando el ejercicio tiene `drillId`.
  - Verificar: controles con pulgar; sonido al cerrar bloque; guarda historial al finalizar.
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 8.6_

- [ ] 18. Persistencia de resultados de sesión al finalizar
  - Al completar/finalizar: `PATCH` de sesión y envío de `ShotLog` por ejercicio/zona.
  - Verificar: duración real, ejercicios completados y tiros por ejercicio quedan guardados.
  - _Requisitos: 5.5_

- [ ] 19. Interfaz y motor de pose (módulo con carga diferida)
  - `lib/pose/types.ts` (`PoseEngine`, `ShotAnalysisResult`) y `mediapipe-engine.ts` (MediaPipe/TF.js) cargado con `dynamic(..., { ssr: false })`.
  - Cálculo de ángulo de codo, flexión de rodillas, momento de liberación y `confidence`; procesamiento 100% en cliente.
  - Verificar: con un video de prueba produce métricas; la UI depende solo de la interfaz.
  - _Requisitos: 6.2, 6.3, 6.5, 6.6_

- [ ] 20. Pantalla del analizador de tiro (`/analyze`)
  - Grabar (≤10 s si hay cámara) o subir video; ejecutar `analyzeShot`; mostrar métricas con indicador de confianza.
  - Baja confianza ⇒ aviso de no confiable + sugerir regrabar; guardar métricas con consentimiento vía `POST /api/sessions/:id/analysis`.
  - Verificar: flujo completo captura→análisis→resultado; sin confianza no guarda métricas engañosas.
  - _Requisitos: 6.1, 6.3, 6.4, 6.7_

- [ ] 21. Endpoint de estadísticas `GET /api/stats`
  - Agregar `ShotLog` por zona (made/attempted/pct) con filtros `from/to/format`; calcular rachas (actual/máxima) y `suggestedDifficulty`.
  - Verificar: agregados y rachas correctos contra datos sembrados; dificultad sugerida reacciona al rendimiento.
  - _Requisitos: 7.1, 7.2, 7.3, 7.4_

- [ ] 22. Dashboard, shot chart y rachas
  - `ShotChart` (reutiliza `CourtSVG`, mapa de calor por zona, tooltip made/attempted/pct al tocar), `StreakCard`, `StatsFilters` (fecha/formato), estado vacío con CTA.
  - Conectar `suggestedDifficulty` a la próxima generación de rutina.
  - Verificar: filtros recalculan; tooltip por zona; estado vacío cuando no hay datos.
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 23. PWA: manifest, service worker y soporte offline
  - `manifest.webmanifest` + íconos (instalable); service worker que cachea app shell y última rutina; cola de sincronización para `Session`/`ShotLog` sin red.
  - Verificar: instalable; modo activo funciona offline; el historial sincroniza al recuperar red.
  - _Requisitos: 8.1, 8.2, 8.3_

- [ ] 24. Endurecimiento final y verificación de criterios
  - Repasar manejo de errores (422/503/400/401), estados de carga/offline y accesibilidad (contraste AA, tamaños táctiles, reduced-motion).
  - Ejecutar `typecheck`, `build` y la suite de tests; corregir lo pendiente.
  - Verificar: cada criterio EARS de `requirements.md` tiene cobertura; build de producción pasa.
  - _Requisitos: 1.3, 3.6, 3.7, 4.6, 6.4, 8.3, 8.5, 8.6_
