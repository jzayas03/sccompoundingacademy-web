import type { Question } from "./types";

/**
 * Día 2 — Supositorios y formulaciones dermatológicas.
 *
 * Banco de 15 preguntas transcrito del docx oficial en español del Lcdo.
 * Reyes ("Post-Tests_Compounding_Dias_1-3.docx", 2026). Q11-Q15 comparten
 * la receta de hidroquinona enunciada en Q11 (el QuizForm permite volver
 * atrás para releerla). Las explicaciones vienen de la columna
 * "Observación" del documento fuente.
 */
export const dia2: readonly Question[] = [
  {
    id: "M2-Q1",
    prompt: "La mayoría de los supositorios tienen un BUD asignado de:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 días" },
      { letter: "B", text: "60 días" },
      { letter: "C", text: "90 días" },
      { letter: "D", text: "180 días" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation: "USP <795> 2023.",
  },
  {
    id: "M2-Q2",
    prompt:
      "El uso del dióxido de silicio en el compounding de supositorios es que, como agente de suspensión:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "ayuda a la distribución del API a través de toda la masa del supositorio",
      },
      { letter: "B", text: "aumenta la solubilidad del API" },
      { letter: "C", text: "ajusta el pH de la preparación" },
      { letter: "D", text: "mejora el metabolismo del API" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "A",
    explanation: "Allen's · PCCA Suppository Guide.",
  },
  {
    id: "M2-Q3",
    prompt: "Si tiene una receta para 30 supositorios, se recomienda calcular para:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 supositorios" },
      { letter: "B", text: "31 supositorios" },
      { letter: "C", text: "33 supositorios" },
      { letter: "D", text: "40 supositorios" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation: "PCCA · Allen's — regla de +10% de excedente (overage).",
  },
  {
    id: "M2-Q4",
    prompt: "Los supositorios se conservan mejor:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "a temperatura ambiente" },
      { letter: "B", text: "en el refrigerador" },
      { letter: "C", text: "en el congelador" },
      { letter: "D", text: "entre 45° y 50°C" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "B",
    explanation: "USP <795> 2023 · Allen's.",
  },
  {
    id: "M2-Q5",
    prompt: "Los supositorios de progesterona se usan durante el embarazo para:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "prevenir el aborto espontáneo en embarazadas de alto riesgo",
      },
      { letter: "B", text: "reducir el riesgo de parto prematuro" },
      { letter: "C", text: "soporte tras tratamientos de fertilidad" },
      { letter: "D", text: "soporte de fase lútea" },
      { letter: "E", text: "todas las anteriores son correctas" },
    ],
    correctAnswer: "E",
    explanation: "ACOG · NIH/NICHD · PCCA Women's Health.",
  },
  {
    id: "M2-Q6",
    prompt:
      "Condición(es) dermatológica(s) común(es) tratada(s) con preparación de compounding:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "acné" },
      { letter: "B", text: "psoriasis" },
      { letter: "C", text: "melasma" },
      { letter: "D", text: "pérdida de cabello" },
      { letter: "E", text: "todas las anteriores son correctas" },
    ],
    correctAnswer: "E",
    explanation: "AAD · PCCA Dermatology.",
  },
  {
    id: "M2-Q7",
    prompt: "El mill es un equipo utilizado para:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "reducir el tamaño de partícula de los ingredientes" },
      { letter: "B", text: "mezclar de forma muy homogénea todos los ingredientes" },
      { letter: "C", text: "distribuir el API en el diluente" },
      { letter: "D", text: "todas las anteriores son correctas" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "D",
    explanation: "USP <795> 2023 · PCCA Equipment Guide.",
  },
  {
    id: "M2-Q8",
    prompt:
      "¿Cuál base para supositorios tiene un punto de fusión de aproximadamente 34-36°C y se funde rápidamente a temperatura corporal?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Manteca de Cacao (Theobroma Oil)" },
      { letter: "B", text: "Witepsol" },
      { letter: "C", text: "Glicerina Gelatinada" },
      { letter: "D", text: "PEG (Polietilenglicol)" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "A",
    explanation:
      "Allen's · PCCA Suppository Bases — la manteca de cacao funde a 34-36°C, temperatura corporal.",
  },
  {
    id: "M2-Q9",
    prompt: "La naltrexona de dosis baja puede ayudar a pacientes con:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "enfermedad de Hailey-Hailey" },
      { letter: "B", text: "psoriasis" },
      { letter: "C", text: "esclerodermia" },
      { letter: "D", text: "todas las anteriores son correctas" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "D",
    explanation: "LDN Research Trust · IJPC · BMC Dermatology 2018.",
  },
  {
    id: "M2-Q10",
    prompt: "La pérdida de cabello puede tratarse con:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "minoxidil" },
      { letter: "B", text: "finasterida" },
      { letter: "C", text: "dutasterida" },
      { letter: "D", text: "todas las anteriores son correctas" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "D",
    explanation: "AAD Hair Loss Guidelines · PCCA.",
  },
  {
    id: "M2-Q11",
    prompt:
      "Rx: Hidroquinona 8% · Ácido Salicílico 2% · Vit. C 550 mg × 2 · Betametasona Valerato 15 G · Crema Emoliente 45 G · Mezclar y preparar esta crema · Sig: aplicar según indicado. Usa esta receta para contestar las preguntas 11 a la 15. ¿Para el tratamiento de qué condición se recomienda esta preparación?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "psoriasis" },
      { letter: "B", text: "acné" },
      { letter: "C", text: "melasma" },
      { letter: "D", text: "rosácea" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation:
      "La hidroquinona es el agente despigmentante de referencia; el ácido salicílico mejora la penetración mediante exfoliación.",
  },
  {
    id: "M2-Q12",
    prompt: "La vitamina C se incluye en esta preparación como:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "antioxidante" },
      { letter: "B", text: "agente despigmentante" },
      { letter: "C", text: "potenciador de penetración" },
      { letter: "D", text: "todas las anteriores son correctas" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "A",
    explanation:
      "La vitamina C protege la hidroquinona de la oxidación y mejora la estabilidad de la fórmula.",
  },
  {
    id: "M2-Q13",
    prompt: "Se recomienda aplicar esta preparación:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "todo el día y la noche" },
      { letter: "B", text: "a la hora de dormir" },
      { letter: "C", text: "solo durante el día" },
      { letter: "D", text: "cada 6 horas, día y noche" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "B",
    explanation:
      "La hidroquinona es susceptible a oxidación y fotodegradación al exponerse a la luz solar.",
  },
  {
    id: "M2-Q14",
    prompt:
      "La cantidad de hidroquinona requerida para preparar esta formulación es:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "3.61 G" },
      { letter: "B", text: "4.80 G" },
      { letter: "C", text: "5.42 G" },
      { letter: "D", text: "6.00 G" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation:
      "61 G de ingredientes fijos = 90% de la fórmula; el 8% de hidroquinona equivale a 5.42 G.",
  },
  {
    id: "M2-Q15",
    prompt: "Se recomienda preparar esta fórmula utilizando:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "mezclador de alta velocidad" },
      { letter: "B", text: "balanza analítica" },
      { letter: "C", text: "mill" },
      { letter: "D", text: "un buen potenciador de penetración" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation:
      "La hidroquinona está en forma de cristales; el mill reducirá el tamaño de partícula.",
  },
] as const;
