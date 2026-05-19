import type { Question } from "./types";

/**
 * Día 3 — Hormonales tópicos, veterinaria y regulación.
 *
 * Banco de 15 preguntas transcrito verbatim del PDF del Lcdo. Reyes
 * ("PRE POST TEST -SCCA Día # 3.pages.pdf", 2026).
 *
 * Estructura del banco:
 *   - Q1-Q5  : Rx Bi-est 80/20 2.5 mg/G + Testosterone 3.0 mg/G,
 *              Disp 35 G, Sig 0.5 G behind knees q.d., Refill 5.
 *   - Q6-Q10 : Rx Testosterone 1 mg/0.1 G, Disp in microclick,
 *              Sig 1 mg q.d.
 *   - Q11-Q15: True/False sobre clasificación 503A/503B, shortages,
 *              alergias y reconstitución vs compounding.
 *
 * Cada `prompt` re-inline-a la prescripción correspondiente para que la
 * UI siga sin necesitar un modelo de contexto compartido entre preguntas
 * (mismo patrón que en `dia-2.ts` Q11-15).
 */
export const dia3: readonly Question[] = [
  {
    id: "M3-Q1",
    prompt:
      "Rx — Bi-est 80/20, 2.5 mg/G, Testosterone 3.0 mg/G, Disp. 35 G, Sig Apply 0.5 G behind the knees q.d., Refill 5. The amount of estriol, required formulation is:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "2.8 G" },
      { letter: "B", text: "700 mg" },
      { letter: "C", text: "70 mg" },
      { letter: "D", text: "17.5 mg" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "C",
    explanation: "",
  },
  {
    id: "M3-Q2",
    prompt:
      "Rx — Bi-est 80/20, 2.5 mg/G, Testosterone 3.0 mg/G, Disp. 35 G, Sig Apply 0.5 G behind the knees q.d., Refill 5. The amount of estradiol required to prepare this prescription is:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "2.8 G" },
      { letter: "B", text: "700 mg" },
      { letter: "C", text: "70 mg" },
      { letter: "D", text: "35 mg" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "E",
    explanation: "",
  },
  {
    id: "M3-Q3",
    prompt:
      "Rx — Bi-est 80/20, 2.5 mg/G, Testosterone 3.0 mg/G, Disp. 35 G, Sig Apply 0.5 G behind the knees q.d., Refill 5. The amount of Testosterone required to prepare this formulation:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "35 mg" },
      { letter: "B", text: "70 mg" },
      { letter: "C", text: "17.5 mg" },
      { letter: "D", text: "90 mg" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "E",
    explanation: "",
  },
  {
    id: "M3-Q4",
    prompt:
      "Rx — Bi-est 80/20, 2.5 mg/G, Testosterone 3.0 mg/G, Disp. 35 G, Sig Apply 0.5 G behind the knees q.d., Refill 5. If this product is dispensed in a Topi-Click, how many clicks daily the patient has to apply:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.5 click" },
      { letter: "B", text: "1 click" },
      { letter: "C", text: "2 click" },
      { letter: "D", text: "5 click" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "C",
    explanation: "",
  },
  {
    id: "M3-Q5",
    prompt:
      "Rx — Bi-est 80/20, 2.5 mg/G, Testosterone 3.0 mg/G, Disp. 35 G, Sig Apply 0.5 G behind the knees q.d., Refill 5. This preparation:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "is a controlled substance" },
      { letter: "B", text: "most have attached a label indications that is a compounded formulation" },
      { letter: "C", text: "is not allowed to be refilled" },
      { letter: "D", text: "A and B are correct" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "D",
    explanation: "",
  },
  {
    id: "M3-Q6",
    prompt:
      "Rx — Testosterone 1 mg/0.1 G, Disp. in microclick, Sig 1 mg q.d. What its the capacity in G of the microclick:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "9 G" },
      { letter: "B", text: "9.5 G" },
      { letter: "C", text: "30 G" },
      { letter: "D", text: "35 G" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "B",
    explanation: "",
  },
  {
    id: "M3-Q7",
    prompt:
      "Rx — Testosterone 1 mg/0.1 G, Disp. in microclick, Sig 1 mg q.d. When you do one microclick, how much of the preparation is:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.025 cc" },
      { letter: "B", text: "0.5 cc" },
      { letter: "C", text: "0.05 cc" },
      { letter: "D", text: "0.1 cc" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation: "",
  },
  {
    id: "M3-Q8",
    prompt:
      "Rx — Testosterone 1 mg/0.1 G, Disp. in microclick, Sig 1 mg q.d. How much testosterone is necessary to prepare this formulation if you decide to make an excess of 12 G:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "1.2 mg" },
      { letter: "B", text: "12 mg" },
      { letter: "C", text: "120 mg" },
      { letter: "D", text: "10 mg" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "C",
    explanation: "",
  },
  {
    id: "M3-Q9",
    prompt:
      "Rx — Testosterone 1 mg/0.1 G, Disp. in microclick, Sig 1 mg q.d. What will be the most appropriate penetration enhancer for this formulation:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "ethoxy diglycol" },
      { letter: "B", text: "propylene glycol" },
      { letter: "C", text: "versabase" },
      { letter: "D", text: "glycerin" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation: "",
  },
  {
    id: "M3-Q10",
    prompt:
      "Rx — Testosterone 1 mg/0.1 G, Disp. in microclick, Sig 1 mg q.d. The formule to make 100 ml requiere 5 ml of the penetration enhancer. If you decide to make only 12 G of the formula, how much of the penetration enhancer you will use:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.5 mL" },
      { letter: "B", text: "0.6 mL" },
      { letter: "C", text: "5 mL" },
      { letter: "D", text: "6 mL" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation: "",
  },
  {
    id: "M3-Q11",
    prompt:
      "If a pharmacist make an antibiotic reconstitution following the manufacturer instructions, that is considered “compounding”:",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "FALSE",
    explanation: "",
  },
  {
    id: "M3-Q12",
    prompt:
      "Compounding pharmacies are not allowed to make commercially available products. If a commercially available product is in shortage then compounding pharmacy can duplicate the product until the shortage ends:",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "TRUE",
    explanation: "",
  },
  {
    id: "M3-Q13",
    prompt:
      "If a patient is allergic to any of the excipients of a commercially available product, then the pharmacist can make the product without the excipient to which the patient is allergic:",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "TRUE",
    explanation: "",
  },
  {
    id: "M3-Q14",
    prompt:
      "If a pharmacist compound a product following USP standards then he may claim efficacy and security of the compounded product:",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "FALSE",
    explanation: "",
  },
  {
    id: "M3-Q15",
    prompt:
      "Compounding Pharmacies are classified 503 A and 503 B: 503 A Compound Sterile products; 503 B Compound Non-Sterile products.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "FALSE",
    explanation: "",
  },
] as const;
