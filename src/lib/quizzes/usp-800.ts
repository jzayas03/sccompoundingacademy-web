import type { Question } from "./types";

/**
 * Student module 2 — USP 〈800〉 Hazardous Drugs.
 * 15 questions selected from the owner's authoritative Spanish
 * question bank (Banco_Preguntas). Pre-test and post-test draw from
 * this same bank. `id` carries the source bank number for traceability.
 */
export const usp800: readonly Question[] = [
  {
    id: "E800-Q01",
    // bank #4
    prompt: "¿Qué entidades deben cumplir con <800>?",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Solo fabricantes de APIs",
      },
      {
        letter: "B",
        text: "Todas las entidades y personal que almacenan, preparan, transportan o administran HDs",
      },
      {
        letter: "C",
        text: "Solo laboratorios de investigación",
      },
      {
        letter: "D",
        text: "Solo hospitales grandes",
      },
    ],
    correctAnswer: "B",
    explanation: "Alcance amplio.",
  },
  {
    id: "E800-Q02",
    // bank #5
    prompt: "Un programa de HD debe incluir:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "HD list, controles, personal competente, safe work practices, PPE y waste disposal",
      },
      {
        letter: "B",
        text: "Solo señalización en recepción",
      },
      {
        letter: "C",
        text: "Solo un inventario mensual",
      },
      {
        letter: "D",
        text: "Solo una lista de precios",
      },
    ],
    correctAnswer: "A",
    explanation: "Elementos mínimos del plan.",
  },
  {
    id: "E800-Q03",
    // bank #7
    prompt: "La lista de HDs debe revisarse como mínimo:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Cada 12 meses",
      },
      {
        letter: "B",
        text: "Nunca si no cambia el inventario",
      },
      {
        letter: "C",
        text: "Solo si hay inspección",
      },
      {
        letter: "D",
        text: "Cada 10 años",
      },
    ],
    correctAnswer: "A",
    explanation: "Revisión anual.",
  },
  {
    id: "E800-Q04",
    // bank #10
    prompt: "El Assessment of Risk puede usarse para:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Eliminar todos los controles",
      },
      {
        letter: "B",
        text: "Antineoplásicos manipulados siempre",
      },
      {
        letter: "C",
        text: "Ciertos final dosage forms y otros HDs elegibles",
      },
      {
        letter: "D",
        text: "HD APIs sin datos",
      },
    ],
    correctAnswer: "C",
    explanation: "Permite containment alternativo en casos elegibles.",
  },
  {
    id: "E800-Q05",
    // bank #14
    prompt: "¿Cuál es una ruta de entrada de HDs al cuerpo?",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Refrigeración",
      },
      {
        letter: "B",
        text: "Fotodegradación",
      },
      {
        letter: "C",
        text: "Dermal absorption",
      },
      {
        letter: "D",
        text: "Facturación",
      },
    ],
    correctAnswer: "C",
    explanation: "También mucosal, inhalation, injection, ingestion.",
  },
  {
    id: "E800-Q06",
    // bank #32
    prompt: "Un CSTD es un control:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Supplemental",
      },
      {
        letter: "B",
        text: "Primario único",
      },
      {
        letter: "C",
        text: "Sustituto del C-PEC",
      },
      {
        letter: "D",
        text: "Administrativo solamente",
      },
    ],
    correctAnswer: "A",
    explanation: "Control adicional.",
  },
  {
    id: "E800-Q07",
    // bank #35
    prompt: "No se requiere C-PEC cuando la manipulación se limita a final dosage forms que:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Requieren trituración",
      },
      {
        letter: "B",
        text: "Siempre son líquidos",
      },
      {
        letter: "C",
        text: "No producen partículas, aerosoles o gases",
      },
      {
        letter: "D",
        text: "Siempre son estériles",
      },
    ],
    correctAnswer: "C",
    explanation: "Excepción limitada.",
  },
  {
    id: "E800-Q08",
    // bank #40
    prompt: "Para antineoplastic HD compounding no se debe usar:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Class III BSC",
      },
      {
        letter: "B",
        text: "Class II BSC",
      },
      {
        letter: "C",
        text: "LAFW o CAI",
      },
      {
        letter: "D",
        text: "CACI",
      },
    ],
    correctAnswer: "C",
    explanation: "Prohibidos para antineoplásicos.",
  },
  {
    id: "E800-Q09",
    // bank #41
    prompt: "La configuración preferida para sterile HD compounding es:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Mesa abierta",
      },
      {
        letter: "B",
        text: "ISO 7 buffer room + ISO 7 ante-room",
      },
      {
        letter: "C",
        text: "C-SCA en cualquier cuarto",
      },
      {
        letter: "D",
        text: "Área positiva sin separación",
      },
    ],
    correctAnswer: "B",
    explanation: "Configuración preferida.",
  },
  {
    id: "E800-Q10",
    // bank #54
    prompt: "Un lugar apropiado para wipe sampling es:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Oficina administrativa sin HDs",
      },
      {
        letter: "B",
        text: "Interior del C-PEC y áreas cerca del C-PEC",
      },
      {
        letter: "C",
        text: "Cafetería externa",
      },
      {
        letter: "D",
        text: "Baño público",
      },
    ],
    correctAnswer: "B",
    explanation: "Áreas de posible contaminación.",
  },
  {
    id: "E800-Q11",
    // bank #58
    prompt: "Los chemotherapy gloves deben cambiarse típicamente:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Cada 30 minutos o antes si se comprometen",
      },
      {
        letter: "B",
        text: "Una vez al mes",
      },
      {
        letter: "C",
        text: "Cada 8 horas siempre",
      },
      {
        letter: "D",
        text: "Solo si terminan las cajas",
      },
    ],
    correctAnswer: "A",
    explanation: "Cambio frecuente por permeación/contaminación.",
  },
  {
    id: "E800-Q12",
    // bank #61
    prompt: "El receiving area debe tener disponible:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Spill kit",
      },
      {
        letter: "B",
        text: "Cafetera",
      },
      {
        letter: "C",
        text: "Alfombra",
      },
      {
        letter: "D",
        text: "Mesa de comida",
      },
    ],
    correctAnswer: "A",
    explanation: "Preparación para derrames.",
  },
  {
    id: "E800-Q13",
    // bank #62
    prompt: "Un shipping container dañado y sin abrir debe:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Abrirse para inspección en área positiva",
      },
      {
        letter: "B",
        text: "Ignorarse si no huele",
      },
      {
        letter: "C",
        text: "Colocarse en breakroom",
      },
      {
        letter: "D",
        text: "Sellarse sin abrir y manejarse según procedimiento, contactando al suplidor",
      },
    ],
    correctAnswer: "D",
    explanation: "Dañado = potencial spill/exposición.",
  },
  {
    id: "E800-Q14",
    // bank #64
    prompt: "Los cuatro pasos de limpieza para HDs son:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Deactivation, decontamination, cleaning y disinfection",
      },
      {
        letter: "B",
        text: "Receipt, count, sell, file",
      },
      {
        letter: "C",
        text: "Wash, weigh, mix, dispense",
      },
      {
        letter: "D",
        text: "Rinse, label, store, bill",
      },
    ],
    correctAnswer: "A",
    explanation: "Secuencia de limpieza HD.",
  },
  {
    id: "E800-Q15",
    // bank #66
    prompt: "Si se usa sodium hypochlorite, debe considerarse:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Mezclarlo con cualquier químico sin evaluar",
      },
      {
        letter: "B",
        text: "Dejarlo secar sin más pasos siempre",
      },
      {
        letter: "C",
        text: "Usarlo como único agente para todo",
      },
      {
        letter: "D",
        text: "Neutralizar o seguir con alcohol/agua/detergente para reducir corrosión",
      },
    ],
    correctAnswer: "D",
    explanation: "Prevención de corrosión e incompatibilidades.",
  },
];
