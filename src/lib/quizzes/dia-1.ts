import type { Question } from "./types";

/**
 * Día 1 — Fundamentos regulatorios, USP <795>/<800>, Ley de Farmacia PR,
 * DQSA y cápsulas.
 *
 * Banco de 15 preguntas sincronizado con la POST-PRUEBA de la presentación
 * oficial v2.3 del Lcdo. Reyes ("Day1_Basic_Compounding_Non_Sterile_2_3_2",
 * agosto 2026). El mismo banco sirve pre-test y post-test. Las
 * explicaciones son las justificaciones del instruccional ACPE oficial
 * ("instruccional día #1 - revisado 2026"), traducidas al español.
 */
export const dia1: readonly Question[] = [
  {
    id: "M1-Q1",
    prompt:
      "Este capítulo USP describe los estándares mínimos a seguir para la preparación de formulaciones compounded no estériles (humanos y animales):",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "513" },
      { letter: "B", text: "795" },
      { letter: "C", text: "797" },
      { letter: "D", text: "800" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "B",
    explanation:
      "USP <795> establece los estándares del compounding farmacéutico no estéril para humanos y animales: guía la formulación, preparación, almacenamiento, BUD, etiquetado y aseguramiento de calidad. Aplica específicamente a preparaciones no estériles.",
  },
  {
    id: "M1-Q2",
    prompt:
      "Este capítulo describe estándares de práctica y calidad para el manejo de medicamentos peligrosos, para promover la seguridad del paciente, la del trabajador y la protección ambiental:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "513" },
      { letter: "B", text: "795" },
      { letter: "C", text: "797" },
      { letter: "D", text: "800" },
      { letter: "E", text: "ninguna de las anteriores" },
    ],
    correctAnswer: "D",
    explanation:
      "USP <800> establece los estándares para el manejo seguro de medicamentos peligrosos en entornos de salud: protege al paciente, al personal y al ambiente durante recepción, preparación, administración, almacenamiento y disposición, y define los requisitos de PPE y contención.",
  },
  {
    id: "M1-Q3",
    prompt: "La lista de medicamentos peligrosos es preparada por:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "USP" },
      { letter: "B", text: "FDA" },
      { letter: "C", text: "EPA" },
      { letter: "D", text: "NIOSH" },
      { letter: "E", text: "OSHA" },
    ],
    correctAnswer: "D",
    explanation:
      "NIOSH (National Institute for Occupational Safety and Health) prepara la lista de medicamentos peligrosos usada en entornos de salud, identificando fármacos con riesgos por toxicidad, efectos reproductivos, carcinogenicidad o toxicidad de órganos. USP <800> usa esa lista para determinar las precauciones de manejo.",
  },
  {
    id: "M1-Q4",
    prompt:
      "Para el compounding de medicamentos peligrosos estériles y no estériles se requiere como PPE:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "batas" },
      { letter: "B", text: "cubierta de cabeza y cabello" },
      { letter: "C", text: "cubre-zapatos" },
      { letter: "D", text: "dos pares de guantes de quimioterapia" },
      { letter: "E", text: "todas las anteriores son correctas" },
    ],
    correctAnswer: "E",
    explanation:
      "El manejo de medicamentos peligrosos requiere múltiples formas de PPE: batas, cubierta de cabeza y cabello, cubre-zapatos y guantes de quimioterapia. Estas medidas en capas reducen la exposición ocupacional y el riesgo de contaminación (USP <800>).",
  },
  {
    id: "M1-Q5",
    prompt:
      "Según la Ley de Farmacia de Puerto Rico, con respecto al compounding, la ley le permite:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "preparar solo una cantidad limitada de una preparación de compounding para inventario",
      },
      {
        letter: "B",
        text: "no puede preparar un compounding en anticipación a una receta",
      },
      {
        letter: "C",
        text: "la cantidad de unidades a preparar depende del BUD de la preparación",
      },
      {
        letter: "D",
        text: "la cantidad de unidades depende de la frecuencia de recetas por día",
      },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "B",
    explanation:
      "La Ley de Farmacia de PR restringe el compounding anticipado y enfatiza la receta específica por paciente: el compounding atiende necesidades individualizadas y no funciona como manufactura. Esto protege al paciente y mantiene el cumplimiento regulatorio.",
  },
  {
    id: "M1-Q6",
    prompt: "DQSA:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "se refiere al Drug Quality Security Act" },
      {
        letter: "B",
        text: "fortaleció significativamente la autoridad de la FDA sobre el compounding farmacéutico",
      },
      { letter: "C", text: "crea una nueva categoría de “Outsourcing Facility”" },
      { letter: "D", text: "fue aprobada en 2013" },
      { letter: "E", text: "todas las anteriores son correctas" },
    ],
    correctAnswer: "E",
    explanation:
      "El DQSA fortaleció la supervisión de la FDA sobre el compounding, creó la categoría de Outsourcing Facility (503B) y fue aprobado en 2013; también aclaró los estándares de las farmacias tradicionales 503A. Todas las aseveraciones son correctas.",
  },
  {
    id: "M1-Q7",
    prompt: "Para la formulación de cápsulas debemos conocer:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "la densidad del API" },
      { letter: "B", text: "la densidad de todos los ingredientes de la cápsula" },
      {
        letter: "C",
        text: "el packing statistic de todos los ingredientes de la cápsula",
      },
      { letter: "D", text: "los ingredientes peligrosos de la cápsula" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation:
      "El packing statistic determina cuánto volumen ocupa cada ingrediente dentro de la cápsula, lo que permite calcular con exactitud el volumen de llenado y asegurar consistencia en la formulación, evitando déficit o desborde durante la preparación.",
  },
  {
    id: "M1-Q8",
    prompt: "El BUD asignado a las cápsulas usualmente es:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 días" },
      { letter: "B", text: "90 días" },
      {
        letter: "C",
        text: "180 días o la fecha de expiración de cualquier ingrediente si es menor de 180 días (la menor de ambas)",
      },
      { letter: "D", text: "180 días" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation:
      "Las cápsulas preparadas con ingredientes no acuosos usualmente reciben un BUD de hasta 180 días, salvo que algún ingrediente expire antes: la fecha de expiración más temprana limita el BUD asignado. Esto mantiene la calidad y seguridad del producto.",
  },
  {
    id: "M1-Q9",
    prompt: "El packing statistic de un ingrediente:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "puede ser provisto por el distribuidor" },
      { letter: "B", text: "puede calcularse en el laboratorio" },
      { letter: "C", text: "es parte de la monografía del ingrediente" },
      { letter: "D", text: "es provisto por la USP" },
      { letter: "E", text: "A y B son correctas" },
    ],
    correctAnswer: "E",
    explanation:
      "El packing statistic puede ser provisto por el suplidor/distribuidor o determinarse experimentalmente en el laboratorio. Estos valores alimentan los cálculos de formulación y estimación de volumen; valores exactos mejoran la consistencia de dosis y la uniformidad de las cápsulas.",
  },
  {
    id: "M1-Q10",
    prompt:
      "Si el pack stat de la progesterona es 270 mg para cápsula tamaño 1, ¿qué porcentaje del volumen de la cápsula ocuparán 100 mg de progesterona?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "3.7%" },
      { letter: "B", text: "37%" },
      { letter: "C", text: "370%" },
      { letter: "D", text: "63%" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "B",
    explanation:
      "El porcentaje ocupado se calcula dividiendo la cantidad recetada entre el packing statistic: 100 mg ÷ 270 mg = 0.37 → 37% del volumen de la cápsula. Este cálculo es necesario para estimar cuánto relleno (filler) falta por añadir.",
  },
  {
    id: "M1-Q11",
    prompt:
      "Si el pack stat de la progesterona es 270 mg para cápsula tamaño 1 y el volumen de la cápsula tamaño 0 es 1.95 veces el volumen del tamaño 1, ¿cuál será el pack stat de la cápsula tamaño 0?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "271.95 mg" },
      { letter: "B", text: "268.05 mg" },
      { letter: "C", text: "526.5 mg" },
      { letter: "D", text: "138.46 mg" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation:
      "El nuevo packing statistic se calcula multiplicando el valor original por el cambio de volumen: 270 mg × 1.95 = 526.5 mg. La cápsula tamaño 0 tiene mayor capacidad y admite más material; este cálculo guía la selección del tamaño de cápsula correcto.",
  },
  {
    id: "M1-Q12",
    prompt: "Methocel es equivalente a Hypromellose.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "Verdadero" },
      { letter: "FALSE", text: "Falso" },
    ],
    correctAnswer: "TRUE",
    explanation:
      "Methocel es un nombre comercial de la hipromelosa (hidroxipropil metilcelulosa, HPMC), polímero de uso común en formas de dosificación farmacéuticas, incluyendo formulaciones de liberación modificada. Por eso la aseveración es verdadera.",
  },
  {
    id: "M1-Q13",
    prompt: "Methocel es el ingrediente responsable de las cápsulas de liberación lenta.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "Verdadero" },
      { letter: "FALSE", text: "Falso" },
    ],
    correctAnswer: "TRUE",
    explanation:
      "Methocel (hipromelosa/HPMC) se usa como polímero controlador de liberación en formulaciones de liberación sostenida: al exponerse a fluidos forma una barrera de gel que enlentece la liberación del fármaco. Por esa propiedad se usa ampliamente en cápsulas de liberación lenta.",
  },
  {
    id: "M1-Q14",
    prompt:
      "Las farmacias de compounding no tienen permitido elaborar productos comercialmente disponibles. Si un producto comercialmente disponible está en escasez, la farmacia de compounding puede duplicar el producto hasta que termine la escasez.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "Verdadero" },
      { letter: "FALSE", text: "Falso" },
    ],
    correctAnswer: "TRUE",
    explanation:
      "Las farmacias de compounding generalmente no pueden duplicar medicamentos comercialmente disponibles; sin embargo, si el medicamento está oficialmente en escasez, el compounding se permite para atender la necesidad del paciente hasta que retorne la disponibilidad. Esto protege el acceso a la terapia.",
  },
  {
    id: "M1-Q15",
    prompt:
      "Las farmacias de compounding se clasifican en 503A y 503B: 503A compone productos estériles; 503B compone productos no estériles.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "Verdadero" },
      { letter: "FALSE", text: "Falso" },
    ],
    correctAnswer: "FALSE",
    explanation:
      "La distinción 503A/503B no se basa en estéril vs. no estéril: las farmacias 503A hacen compounding tradicional específico por paciente, mientras que las 503B (outsourcing facilities) pueden componer a granel bajo supervisión de la FDA. Por eso la aseveración es falsa.",
  },
] as const;
