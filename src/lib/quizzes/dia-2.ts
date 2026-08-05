import type { Question } from "./types";

/**
 * Día 2 — Supositorios y formulaciones dermatológicas.
 *
 * Banco de 15 preguntas sincronizado con la POST-PRUEBA de la presentación
 * oficial v2.3 del Lcdo. Reyes ("Day2_Basic_Compounding_Non_Sterile_2_3",
 * agosto 2026 — reemplaza el docx original). Q11-Q15 comparten
 * la receta de hidroquinona enunciada en Q11 (el QuizForm permite volver
 * atrás para releerla). Las explicaciones son las justificaciones del
 * instruccional ACPE oficial ("Instruccional Día #2 - revisado 07132026"),
 * traducidas al español. En Q1 y Q8 la clave del instruccional difiere de
 * la clave de la presentación v2.3; prevalece la presentación (ver PR).
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
    explanation:
      "USP <795> (2023) asigna a las preparaciones no acuosas no sólidas — como los supositorios — un BUD de hasta 90 días, salvo que la fecha de expiración de un ingrediente sea anterior. El BUD asignado mantiene la calidad del medicamento y la seguridad del paciente.",
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
    explanation:
      "El dióxido de silicio funciona como agente de suspensión: mantiene el API distribuido uniformemente en toda la masa del supositorio, promoviendo contenido uniforme y dosis consistentes. No aumenta la solubilidad, ni ajusta el pH, ni afecta el metabolismo.",
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
    explanation:
      "Al preparar supositorios se calcula un excedente (overage) de aproximadamente 10% para compensar las pérdidas al verter, moldear y transferir: una receta de 30 supositorios requiere preparar aproximadamente 33. Así se asegura producto suficiente para dispensar.",
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
    explanation:
      "Los supositorios se conservan mejor refrigerados para preservar su forma, consistencia y estabilidad, especialmente con bases que se ablandan o funden a temperatura ambiente. La refrigeración previene la deformación; el calor excesivo compromete la preparación.",
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
    explanation:
      "Los supositorios de progesterona se usan para prevenir el aborto espontáneo en embarazos de alto riesgo, reducir el riesgo de parto prematuro, dar soporte de fase lútea y soporte tras tratamientos de fertilidad. La progesterona mantiene el ambiente uterino durante el embarazo, así que todas las indicaciones son correctas.",
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
    explanation:
      "Las preparaciones dermatológicas compounded se usan comúnmente para acné, psoriasis, melasma y pérdida de cabello cuando se necesita terapia individualizada: el compounding permite concentraciones, combinaciones y formas de dosificación no disponibles comercialmente.",
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
    explanation:
      "El mill farmacéutico reduce el tamaño de partícula, mejora la mezcla y ayuda a distribuir el API uniformemente en el diluente o base. La reducción del tamaño de partícula mejora la homogeneidad y consistencia de la preparación; todas las funciones listadas son correctas.",
  },
  {
    id: "M2-Q8",
    prompt: "El acrónimo EMP significa:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "equilibrar la masa y la presión" },
      { letter: "B", text: "mortero y pistilo electrónicos" },
      { letter: "C", text: "proceso de manufactura electrónica" },
      { letter: "D", text: "la combinación de estradiol y progesterona micronizada" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "B",
    explanation:
      "EMP = Electronic Mortar and Pestle (mortero y pistilo electrónicos), equipo de mezclado del laboratorio de compounding usado para homogeneizar cremas y geles con velocidad y tiempo controlados.",
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
    explanation:
      "La naltrexona de dosis baja (LDN) se ha explorado en condiciones inflamatorias y autoinmunes como la enfermedad de Hailey-Hailey, la psoriasis y la esclerodermia: puede modular vías inflamatorias y la actividad inmune. Todas las condiciones listadas son aplicaciones terapéuticas potenciales.",
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
    explanation:
      "Minoxidil, finasterida y dutasterida se utilizan todos en el tratamiento de la alopecia (AAD Hair Loss Guidelines · PCCA).",
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
      "Esta crema compounded está indicada principalmente para el melasma y otros trastornos de hiperpigmentación: la hidroquinona es el agente despigmentante de referencia y el ácido salicílico mejora la penetración mediante exfoliación de la piel.",
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
      "La vitamina C actúa principalmente como antioxidante: protege la hidroquinona de la oxidación y mejora la estabilidad de la formulación. También contribuye a aclarar la piel al reducir la producción de melanina y neutralizar radicales libres.",
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
      "La hidroquinona se recomienda a la hora de dormir porque es susceptible a oxidación y fotodegradación al exponerse a la luz solar.",
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
      "Los 61 G de ingredientes fijos representan el 90% de la fórmula (hidroquinona 8% + ácido salicílico 2% = 10% restante); entonces el 8% de hidroquinona equivale a 5.42 G.",
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
      "La hidroquinona está en forma de cristales; el mill reduce el tamaño de partícula para lograr una crema uniforme y sin gránulos.",
  },
] as const;
