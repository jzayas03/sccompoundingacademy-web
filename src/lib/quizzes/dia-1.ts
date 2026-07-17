import type { Question } from "./types";

/**
 * Día 1 — Fundamentos regulatorios, USP <795>/<800>, Ley de Farmacia PR,
 * DQSA y cápsulas.
 *
 * Banco de 15 preguntas transcrito del docx oficial en español del Lcdo.
 * Reyes ("Post-Tests_Compounding_Dias_1-3.docx", 2026). El mismo banco
 * sirve pre-test y post-test. Las explicaciones vienen de la columna
 * "Observación" del documento fuente.
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
    explanation: "USP <795> Nov 2023.",
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
    explanation: "USP <800>.",
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
    explanation: "NIOSH 2024 (CDC/NIOSH Pub 2025-103).",
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
    explanation: "USP <800> · NIOSH 2024.",
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
    explanation: "Ley Núm. 247-2004 · Reglamento 156.",
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
    explanation: "DQSA H.R. 3204, 2013 · FDA.",
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
    explanation: "USP <795> 2023 · Allen's.",
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
    explanation: "USP <795> Nov 2023.",
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
    explanation: "USP <795> 2023 · PCCA · Allen's.",
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
    explanation: "USP <795> 2023 · Allen's. 100 ÷ 270 × 100 = 37%.",
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
    explanation: "USP <795> 2023. 270 × 1.95 = 526.5 mg.",
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
    explanation: "Dow Methocel Handbook · USP-NF · HPMC = Hypromellose.",
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
    explanation: "USP <795> 2023 · mecanismo de matriz HPMC.",
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
      "Excepción de drug shortage — permite compounding temporal mientras dura la escasez.",
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
      "La distinción 503A/503B no se basa en estéril vs. no estéril, sino en el modelo de práctica.",
  },
] as const;
