import type { Question } from "./types";

/**
 * Día 2 — Supositorios, líquidos orales y dermatología.
 *
 * Banco de 10 preguntas — pre/post-test del tier profesional, versión
 * actualizada 2026 (docx "Post-Test Preguntas y Respuestas" del Lcdo.
 * Reyes). El bloque de Enalapril que antes vivía aquí (Q11-15) se movió a
 * `dia-3.ts` en la versión actualizada; este módulo ahora califica sobre
 * 10 preguntas (el umbral es porcentual, ver `getPassingThreshold`).
 */
export const dia2: readonly Question[] = [
  {
    id: "M2-Q1",
    prompt: "Most of suppositories have a BUD assigned for:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 days" },
      { letter: "B", text: "60 days" },
      { letter: "C", text: "90 days" },
      { letter: "D", text: "180 days" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "D",
    explanation: "",
  },
  {
    id: "M2-Q2",
    prompt:
      "The use of silicon dioxide in compounding suppositories is that, as a suspending agent,:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "help the distribution of the API throughout the suppository mass" },
      { letter: "B", text: "increase the solubility of the API" },
      { letter: "C", text: "adjust the pH of the preparation" },
      { letter: "D", text: "improve the metabolism of the API" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "A",
    explanation: "",
  },
  {
    id: "M2-Q3",
    prompt:
      "If you have a prescription for 30 suppositories it is recommended to calculate for:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 suppositories" },
      { letter: "B", text: "31 suppositories" },
      { letter: "C", text: "33 suppositories" },
      { letter: "D", text: "40 suppositories" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "C",
    explanation: "",
  },
  {
    id: "M2-Q4",
    prompt: "Suppositories are better preserved:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "room temperature" },
      { letter: "B", text: "in refrigerator" },
      { letter: "C", text: "in freezer" },
      { letter: "D", text: "between 45º to 50 ºC" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation: "",
  },
  {
    id: "M2-Q5",
    prompt: "Progesterone suppositories are used during pregnancy for:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "preventing miscarriage in pregnant women of high risk" },
      { letter: "B", text: "to reduce the risk of preterm birth" },
      { letter: "C", text: "support after fertility treatments" },
      { letter: "D", text: "lutheal phase support" },
      { letter: "E", text: "all of above are correct" },
    ],
    correctAnswer: "E",
    explanation: "",
  },
  {
    id: "M2-Q6",
    prompt: "Common dermatological condition (s) treated with compounding preparation:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "acne" },
      { letter: "B", text: "psoriasis" },
      { letter: "C", text: "melasma" },
      { letter: "D", text: "hair loss" },
      { letter: "E", text: "all of above are correct" },
    ],
    correctAnswer: "E",
    explanation: "",
  },
  {
    id: "M2-Q7",
    prompt: "The mill is an equipment used to:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "reduce the particle size of the ingredients" },
      { letter: "B", text: "mix very homogeneously all ingredients" },
      { letter: "C", text: "distribute the API in the diluent" },
      { letter: "D", text: "all of above are correct" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "A",
    explanation: "",
  },
  {
    id: "M2-Q8",
    prompt: "The acronym EMP stands for:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "equalize the mass and pressure" },
      { letter: "B", text: "electronic mortar and pestle" },
      { letter: "C", text: "electronic manufacturing process" },
      { letter: "D", text: "the combination of estradiol, micronized and progesterone" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation: "",
  },
  {
    id: "M2-Q9",
    prompt: "Low dose naltrexone may help patients with:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Hailey-Hailey disease" },
      { letter: "B", text: "psoriasis" },
      { letter: "C", text: "scleroderma" },
      { letter: "D", text: "all of above are correct" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "D",
    explanation: "",
  },
  {
    id: "M2-Q10",
    prompt: "Hair loss may be treated with:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "minoxidil" },
      { letter: "B", text: "finasteride" },
      { letter: "C", text: "dutasteride" },
      { letter: "D", text: "all of above are correct" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "D",
    explanation: "",
  },
] as const;
