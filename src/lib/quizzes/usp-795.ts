import type { Question } from "./types";

/**
 * Student module 1 — USP 〈795〉 Pharmaceutical Compounding (Nonsterile).
 * 15 questions selected from the owner's authoritative Spanish
 * question bank (Banco_Preguntas). Pre-test and post-test draw from
 * this same bank. `id` carries the source bank number for traceability.
 */
export const usp795: readonly Question[] = [
  {
    id: "E795-Q01",
    // bank #2
    prompt: "¿Cuál de las siguientes formas farmacéuticas está cubierta por USP <795>?",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Inyectables intravenosos",
      },
      {
        letter: "B",
        text: "Preparaciones oftálmicas estériles",
      },
      {
        letter: "C",
        text: "Cápsulas orales no estériles",
      },
      {
        letter: "D",
        text: "Productos radiopharmaceuticals estériles",
      },
    ],
    correctAnswer: "C",
    explanation: "<795> cubre preparaciones no estériles.",
  },
  {
    id: "E795-Q02",
    // bank #9
    prompt: "¿Quién debe ser identificado por nombre en los SOPs de la facilidad?",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "El designated person",
      },
      {
        letter: "B",
        text: "El manufacturer del API",
      },
      {
        letter: "C",
        text: "El courier",
      },
      {
        letter: "D",
        text: "El paciente",
      },
    ],
    correctAnswer: "A",
    explanation: "La responsabilidad debe estar nombrada.",
  },
  {
    id: "E795-Q03",
    // bank #11
    prompt: "¿Cuál es una responsabilidad del designated person bajo <795>?",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Eliminar la necesidad de SOPs",
      },
      {
        letter: "B",
        text: "Seleccionar componentes y verificar documentación de calidad",
      },
      {
        letter: "C",
        text: "Reducir el BUD sin documentarlo",
      },
      {
        letter: "D",
        text: "Aprobar recetas médicas sin prescriptor",
      },
    ],
    correctAnswer: "B",
    explanation: "Component selection es responsabilidad clave.",
  },
  {
    id: "E795-Q04",
    // bank #13
    prompt: "La re-evaluación de competencia debe ocurrir como mínimo:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Cada mes",
      },
      {
        letter: "B",
        text: "Cada 12 meses",
      },
      {
        letter: "C",
        text: "Cada 6 meses",
      },
      {
        letter: "D",
        text: "Cada 3 años",
      },
    ],
    correctAnswer: "B",
    explanation: "Cadencia anual mínima.",
  },
  {
    id: "E795-Q05",
    // bank #16
    prompt: "¿Cuál condición debe reportarse al designated person antes de componer?",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Cambio de turno",
      },
      {
        letter: "B",
        text: "Rash o lesión supurante en piel expuesta",
      },
      {
        letter: "C",
        text: "Uso de gafas recetadas",
      },
      {
        letter: "D",
        text: "Dolor muscular leve sin síntomas",
      },
    ],
    correctAnswer: "B",
    explanation: "Condición que puede aumentar contaminación.",
  },
  {
    id: "E795-Q06",
    // bank #19
    prompt: "¿Cuál afirmación sobre alcohol-based hand rub es correcta?",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Solo se usa después de tocar APIs",
      },
      {
        letter: "B",
        text: "Por sí solo no es suficiente",
      },
      {
        letter: "C",
        text: "Sustituye por completo el lavado con agua y jabón",
      },
      {
        letter: "D",
        text: "No se permite nunca en farmacia",
      },
    ],
    correctAnswer: "B",
    explanation: "Debe lavarse con agua y jabón.",
  },
  {
    id: "E795-Q07",
    // bank #20
    prompt: "Los guantes deben reemplazarse inmediatamente cuando:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Se imprime la etiqueta",
      },
      {
        letter: "B",
        text: "Se recibe una llamada",
      },
      {
        letter: "C",
        text: "Termina el mes",
      },
      {
        letter: "D",
        text: "Se rompe o compromete su integridad",
      },
    ],
    correctAnswer: "D",
    explanation: "Control de contaminación.",
  },
  {
    id: "E795-Q08",
    // bank #22
    prompt: "La temperatura del área de almacenamiento en días abiertos debe monitorearse:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Una vez al año",
      },
      {
        letter: "B",
        text: "Cada 5 años",
      },
      {
        letter: "C",
        text: "Solo si hay excursión visible",
      },
      {
        letter: "D",
        text: "Al menos una vez diaria o continuamente con dispositivo de registro",
      },
    ],
    correctAnswer: "D",
    explanation: "Monitoreo documentado.",
  },
  {
    id: "E795-Q09",
    // bank #26
    prompt: "Los estantes de almacenamiento deben limpiarse como mínimo:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Semanalmente",
      },
      {
        letter: "B",
        text: "Cada 5 años",
      },
      {
        letter: "C",
        text: "Diariamente",
      },
      {
        letter: "D",
        text: "Cada 3 meses y después de spills o contaminación sospechada",
      },
    ],
    correctAnswer: "D",
    explanation: "Frecuencia de storage shelving.",
  },
  {
    id: "E795-Q10",
    // bank #28
    prompt: "Las superficies del equipo que contactan componentes no deben ser:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Lisas",
      },
      {
        letter: "B",
        text: "Lavables",
      },
      {
        letter: "C",
        text: "Reactivas, aditivas o sortivas",
      },
      {
        letter: "D",
        text: "Compatibles con la formulación",
      },
    ],
    correctAnswer: "C",
    explanation: "Material compatibility.",
  },
  {
    id: "E795-Q11",
    // bank #30
    prompt: "Actividades que generan partículas en el aire deben evaluarse para usar:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Un libro de quejas",
      },
      {
        letter: "B",
        text: "Un refrigerador dedicado únicamente",
      },
      {
        letter: "C",
        text: "Un equipo cerrado como CVE, BSC o containment glove bag",
      },
      {
        letter: "D",
        text: "Una etiqueta más grande",
      },
    ],
    correctAnswer: "C",
    explanation: "Airborne-particle evaluation.",
  },
  {
    id: "E795-Q12",
    // bank #32
    prompt: "Cuando el agua es ingrediente de la formulación, debe ser:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Agua de cualquier fuente potable",
      },
      {
        letter: "B",
        text: "Agua mineral comercial sin evaluación",
      },
      {
        letter: "C",
        text: "Purified Water o mejor calidad",
      },
      {
        letter: "D",
        text: "Tap water",
      },
    ],
    correctAnswer: "C",
    explanation: "Water in formulations.",
  },
  {
    id: "E795-Q13",
    // bank #39
    prompt: "La etiqueta de una CNSP debe incluir como mínimo:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Identificación interna, ingredientes activos, concentración, BUD, forma, almacenamiento y cantidad/volumen",
      },
      {
        letter: "B",
        text: "Solo logo de farmacia",
      },
      {
        letter: "C",
        text: "Solo nombre del paciente",
      },
      {
        letter: "D",
        text: "Solo fecha de compra del API",
      },
    ],
    correctAnswer: "A",
    explanation: "Elementos mínimos de labeling.",
  },
  {
    id: "E795-Q14",
    // bank #45
    prompt: "El BUD por defecto para una preparación acuosa preservada es:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "24 horas",
      },
      {
        letter: "B",
        text: "14 días",
      },
      {
        letter: "C",
        text: "365 días",
      },
      {
        letter: "D",
        text: "35 días a CRT o refrigerada",
      },
    ],
    correctAnswer: "D",
    explanation: "Categoría acuosa preservada.",
  },
  {
    id: "E795-Q15",
    // bank #48
    prompt: "Un BUD puede exceder la fecha de expiración más corta de sus componentes:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Solo si está refrigerado",
      },
      {
        letter: "B",
        text: "Sí, si el paciente lo solicita",
      },
      {
        letter: "C",
        text: "Sí, si la etiqueta es clara",
      },
      {
        letter: "D",
        text: "No",
      },
    ],
    correctAnswer: "D",
    explanation: "No puede exceder expiración de componentes.",
  },
];
