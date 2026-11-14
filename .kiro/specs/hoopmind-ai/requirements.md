# Requirements — HoopMind AI

> PWA Full-Stack de entrenamiento de baloncesto impulsada por IA, para jugadores de 5v5 y 3x3.

## Introducción

HoopMind AI es una Progressive Web App mobile-first que genera sesiones de entrenamiento personalizadas con un LLM, las demuestra con una pizarra táctica animada, guía al jugador en cancha con un modo de entrenamiento activo, analiza su mecánica de tiro por cámara y registra su progreso en un dashboard con shot chart por zonas. Este documento define las historias de usuario y los criterios de aceptación en formato EARS (Easy Approach to Requirements Syntax) para cada módulo.

### Glosario
- **EARS**: patrón de redacción de requisitos. Plantillas usadas aquí:
  - Ubicuo: `THE SYSTEM SHALL <respuesta>`.
  - Dirigido por evento: `WHEN <disparador>, THE SYSTEM SHALL <respuesta>`.
  - Dirigido por estado: `WHILE <estado>, THE SYSTEM SHALL <respuesta>`.
  - Opcional: `WHERE <característica presente>, THE SYSTEM SHALL <respuesta>`.
  - No deseado: `IF <condición>, THEN THE SYSTEM SHALL <respuesta>`.
- **Escenario**: entorno físico del entrenamiento (`FULL_COURT`, `HALF_COURT`, `STREET`, `GYM_NO_HOOP`).
- **Formato**: modalidad de juego preferida (`FIVE_V_FIVE`, `THREE_X_THREE`).
- **Bloque**: fase de una sesión (Calentamiento, Técnica, Finalizaciones, Acondicionamiento, Vuelta a la calma).
- **Zona**: región de la media cancha usada para el shot chart (ver `design.md`).

---

## Requisito 1 — Autenticación y cuenta

**Historia de usuario:** Como jugador, quiero crear una cuenta e iniciar sesión de forma segura, para que mi perfil, rutinas e historial persistan entre dispositivos.

### Criterios de aceptación
1. WHEN un visitante sin sesión abre una ruta protegida, THE SYSTEM SHALL redirigirlo a la pantalla de autenticación.
2. WHEN un usuario envía credenciales válidas (email + contraseña u OAuth), THE SYSTEM SHALL establecer una sesión autenticada y redirigir al onboarding si el perfil está incompleto, o al dashboard si está completo.
3. IF las credenciales son inválidas, THEN THE SYSTEM SHALL mostrar un mensaje de error sin revelar qué campo falló y permitir reintentar.
4. THE SYSTEM SHALL asociar todos los registros de perfil, rutinas, sesiones y tiros al `userId` autenticado mediante Row Level Security.
5. WHEN un usuario autenticado cierra sesión, THE SYSTEM SHALL invalidar la sesión local y requerir nueva autenticación para rutas protegidas.
6. THE SYSTEM SHALL impedir que un usuario lea o escriba datos pertenecientes a otro `userId`.

---

## Requisito 2 — Onboarding y perfil del jugador

**Historia de usuario:** Como jugador nuevo, quiero capturar mis datos físicos y objetivos, para que las rutinas se adapten a mí.

### Criterios de aceptación
1. WHEN un usuario completa el onboarding por primera vez, THE SYSTEM SHALL capturar: altura (cm), peso (kg), posición (`PG` Base, `SG` Escolta, `SF` Alero, `PF` Ala-Pívot, `C` Pívot), formato preferido (`FIVE_V_FIVE` / `THREE_X_THREE`), mano dominante (`LEFT` / `RIGHT`), nivel (`BEGINNER` / `INTERMEDIATE` / `ADVANCED`) y uno o más objetivos (tiro exterior, ball handling, explosividad vertical, defensa).
2. IF un campo obligatorio está vacío o fuera de rango (altura 120–240 cm, peso 30–200 kg), THEN THE SYSTEM SHALL bloquear el avance y señalar el campo inválido.
3. WHEN el usuario guarda el onboarding, THE SYSTEM SHALL persistir el perfil, marcarlo como completo y navegar al dashboard.
4. WHERE ya existe un perfil, THE SYSTEM SHALL precargar los valores actuales en la pantalla de edición y permitir actualizarlos.
5. THE SYSTEM SHALL permitir seleccionar al menos un objetivo y como máximo cuatro.
6. WHEN el perfil cambia, THE SYSTEM SHALL usar los valores actualizados en la siguiente generación de rutina.

---

## Requisito 3 — Motor de rutinas con IA

**Historia de usuario:** Como jugador, quiero generar una sesión a medida según mi tiempo y mi escenario, para entrenar con un plan estructurado sin pensarlo yo.

### Criterios de aceptación
1. WHEN el usuario solicita una rutina indicando tiempo disponible (`30` / `45` / `60` min) y escenario (`FULL_COURT` / `HALF_COURT` / `STREET` / `GYM_NO_HOOP`), THE SYSTEM SHALL invocar `POST /api/generate-workout` con el perfil del usuario y esos parámetros.
2. THE SYSTEM SHALL generar la sesión con un LLM configurado en modo Structured Output y validar la respuesta contra el esquema Zod `WorkoutSchema` antes de devolverla.
3. THE SYSTEM SHALL dividir toda sesión en cinco bloques en este orden: Calentamiento dinámico, Técnica individual, Finalizaciones bajo presión, Acondicionamiento físico y Vuelta a la calma.
4. THE SYSTEM SHALL producir una sesión cuya suma de duraciones de bloques esté dentro de ±2 minutos del tiempo solicitado.
5. WHERE el escenario es `GYM_NO_HOOP` o `STREET` sin aro, THE SYSTEM SHALL evitar ejercicios que requieran canasta y sustituirlos por trabajo de mecánica, manejo o acondicionamiento.
6. IF la validación Zod falla, THEN THE SYSTEM SHALL reintentar hasta 2 veces y, si sigue fallando, devolver HTTP 422 con un mensaje de error estructurado sin exponer la respuesta cruda del modelo.
7. IF el proveedor de IA agota el tiempo de espera o falla, THEN THE SYSTEM SHALL devolver HTTP 503 y la UI SHALL ofrecer reintentar.
8. WHEN una rutina se valida correctamente, THE SYSTEM SHALL persistirla asociada al usuario y mostrarla.
9. THE SYSTEM SHALL vincular cada ejercicio con un identificador de drill opcional para habilitar su demostración en la pizarra táctica cuando exista animación precargada.

---

## Requisito 4 — Pizarra táctica animada

**Historia de usuario:** Como jugador, quiero ver una demostración animada del ejercicio sobre media cancha, para entender el movimiento antes de ejecutarlo.

### Criterios de aceptación
1. THE SYSTEM SHALL renderizar una media cancha a escala en SVG/Canvas con líneas reglamentarias (perímetro, línea de triple, zona, tiro libre, aro).
2. WHEN el usuario abre un drill con animación, THE SYSTEM SHALL animar paso a paso, usando Framer Motion: desplazamiento del jugador, botes, cambios de ritmo, trayectoria del balón y punto(s) de tiro.
3. THE SYSTEM SHALL incluir al menos 3 drills reales precargados: Pick & Roll, Dribble Drive con Step-back y Catch & Shoot en movimiento.
4. THE SYSTEM SHALL ofrecer controles de reproducción: play, pausa, reinicio y avance/retroceso por paso.
5. WHILE una animación está en pausa, THE SYSTEM SHALL mostrar el estado (posiciones) del paso actual y una descripción textual de ese paso.
6. WHERE el dispositivo tiene `prefers-reduced-motion` activo, THE SYSTEM SHALL mostrar los pasos como secuencia estática navegable en lugar de animación continua.
7. THE SYSTEM SHALL distinguir visualmente movimiento del jugador (línea continua), bote/drible (línea ondulada) y pase/tiro del balón (línea discontinua), con una leyenda.

---

## Requisito 5 — Modo entrenamiento activo

**Historia de usuario:** Como jugador en cancha, quiero una vista mobile-first con temporizador y contador de tiros, para ejecutar la sesión con una sola mano y sin distraerme.

### Criterios de aceptación
1. WHEN el usuario inicia una rutina, THE SYSTEM SHALL mostrar el ejercicio actual, su bloque, el temporizador del bloque y la guía paso a paso.
2. WHILE un bloque con límite de tiempo está activo, THE SYSTEM SHALL cuenta regresiva visible y, al llegar a cero, emitir una señal sonora y avanzar o proponer el siguiente ejercicio.
3. WHEN el usuario pulsa los botones de "encestado" o "intentado", THE SYSTEM SHALL incrementar el contador correspondiente y emitir feedback sonoro, con áreas táctiles grandes aptas para uso con una mano.
4. THE SYSTEM SHALL permitir pausar, reanudar y saltar el ejercicio actual.
5. WHEN la sesión termina o el usuario la finaliza, THE SYSTEM SHALL guardar una entrada de historial con duración real, ejercicios completados y tiros encestados/intentados por ejercicio.
6. WHERE el ejercicio tiene drill con animación, THE SYSTEM SHALL ofrecer abrir la pizarra táctica desde la vista activa.
7. IF la app pasa a segundo plano o la pantalla se bloquea, THEN THE SYSTEM SHALL preservar el estado del temporizador y permitir reanudar sin pérdida de datos.
8. THE SYSTEM SHALL permitir silenciar el feedback sonoro.

---

## Requisito 6 — Analizador de tiro por cámara (modular)

**Historia de usuario:** Como jugador, quiero grabar o subir un video corto de mi tiro, para recibir una evaluación de mi mecánica.

### Criterios de aceptación
1. WHERE el navegador soporta captura de cámara, THE SYSTEM SHALL permitir grabar un video corto (≤ 10 s); en todos los casos THE SYSTEM SHALL permitir subir un archivo de video.
2. THE SYSTEM SHALL ejecutar la estimación de pose en el cliente (MediaPipe o TensorFlow.js) sin subir el video a un servidor por defecto.
3. WHEN el análisis finaliza, THE SYSTEM SHALL estimar y mostrar ángulo de codo, flexión de rodillas y momento de liberación, con un indicador de confianza.
4. IF no se detecta una pose fiable (confianza por debajo del umbral), THEN THE SYSTEM SHALL indicar que el análisis no es confiable y sugerir regrabar con mejor encuadre/iluminación.
5. THE SYSTEM SHALL implementar el analizador como módulo con carga diferida (dynamic import) para no penalizar el arranque de la app.
6. THE SYSTEM SHALL exponer una interfaz estable (`analyzeShot(video) → ShotAnalysisResult`) que permita sustituir el motor de pose sin cambiar la UI.
7. WHERE el usuario lo autoriza, THE SYSTEM SHALL permitir guardar el resultado de análisis (métricas, no el video) asociado a la sesión.

---

## Requisito 7 — Dashboard y shot chart

**Historia de usuario:** Como jugador, quiero ver mi progreso y mi mapa de tiro por zonas, para saber dónde mejorar y mantener la constancia.

### Criterios de aceptación
1. THE SYSTEM SHALL mostrar un shot chart (mapa de calor) de porcentaje de acierto por zona de la media cancha a partir del historial de tiros.
2. WHEN el usuario filtra por rango de fechas o formato, THE SYSTEM SHALL recalcular el shot chart y las métricas con los datos filtrados.
3. THE SYSTEM SHALL mostrar la racha diaria actual y la racha máxima de días con al menos una sesión completada.
4. THE SYSTEM SHALL ajustar progresivamente la dificultad sugerida de la próxima rutina según el rendimiento reciente (porcentaje de acierto y sesiones completadas).
5. WHERE no hay datos suficientes, THE SYSTEM SHALL mostrar un estado vacío con llamada a la acción para generar o iniciar una rutina.
6. WHEN una zona tiene tiros registrados, THE SYSTEM SHALL mostrar al tocarla el número de encestados/intentados y el porcentaje de esa zona.

---

## Requisito 8 — PWA, rendimiento y accesibilidad en cancha

**Historia de usuario:** Como jugador que entrena al aire libre, quiero una app instalable, legible bajo sol y usable con una mano, para no depender de buena conexión ni de mirar la pantalla de cerca.

### Criterios de aceptación
1. THE SYSTEM SHALL ser instalable como PWA con manifest, íconos e icono de pantalla de inicio.
2. THE SYSTEM SHALL registrar un service worker que cachee el app shell y la última rutina para permitir el modo entrenamiento activo offline.
3. IF la red no está disponible durante una sesión, THEN THE SYSTEM SHALL permitir continuar la sesión en curso y sincronizar el historial cuando vuelva la conexión.
4. THE SYSTEM SHALL aplicar Dark Mode por defecto de alto contraste con fondo `#0A0A0C`, tarjetas `#141418` y acento naranja `#FF5E1A`.
5. THE SYSTEM SHALL cumplir contraste de texto AA (≥ 4.5:1 para texto normal) para legibilidad bajo luz solar directa.
6. THE SYSTEM SHALL dimensionar los controles primarios del modo activo con un objetivo táctil ≥ 48×48 px alcanzable con el pulgar.
7. THE SYSTEM SHALL ser mobile-first y responder correctamente de 320 px de ancho en adelante.
