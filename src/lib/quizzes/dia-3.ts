import type { Question } from "./types";

/**
 * Día 3 — Hormonales tópicos, veterinaria y regulación.
 *
 * Banco de 15 preguntas — pre/post-test del tier profesional, versión
 * actualizada 2026 (docx "Post-Test Preguntas y Respuestas" del Lcdo.
 * Reyes).
 *
 * Estructura del banco:
 *   - Q1-Q5  : Rx Bi-est 80/20 2.5 mg/G + Testosterone 3.0 mg/G,
 *              Disp 35 G, Sig 0.5 G behind knees q.d., Refill 5.
 *   - Q6-Q7  : Rx Testosterone 1 mg/0.1 G, Disp in microclick, Sig 1 mg q.d.
 *   - Q8-Q10 : Escenarios veterinarios (fenobarbital canino, contra-
 *              indicación felina, vía alterna para methimazole).
 *   - Q11-Q15: Rx Enalapril 1 mg/mL O.S., Sig II mg P.O q.d. (movido desde
 *              Día 2 en la versión actualizada).
 *
 * Cada `prompt` re-inline-a el escenario correspondiente para que la UI
 * siga sin necesitar un modelo de contexto compartido entre preguntas.
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
      "Rx — Testosterone 1 mg/0.1 G, Disp. in microclick, Sig 1 mg q.d. When you do one microclick, how much of the preparation is dispensed:",
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
      "Paciente: canino de 8 kg. Rx veterinaria — Phenobarbital suspensión 10 mg/mL, Sig 2 mg/kg PO c/12 h. VCPR documentada. How many mL per dose should the owner administer?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.8 mL" },
      { letter: "B", text: "1.6 mL" },
      { letter: "C", text: "3.2 mL" },
      { letter: "D", text: "16 mL" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation: "",
  },
  {
    id: "M3-Q9",
    prompt: "When compounding for cats, which statement is correct?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "acetaminophen is safe in cats" },
      { letter: "B", text: "propylene glycol is the preferred vehicle in cats" },
      { letter: "C", text: "never use acetaminophen or propylene glycol in cats" },
      { letter: "D", text: "cats glucuronidate drugs better than dogs" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "C",
    explanation: "",
  },
  {
    id: "M3-Q10",
    prompt:
      "Paciente: gato que rechaza la administración oral; el veterinario necesita una vía alterna para methimazole. VCPR documentada. Which compounded dosage form/route is most appropriate?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "transdermal PLO/Lipoderm en la pinna auricular interna" },
      { letter: "B", text: "supositorio rectal" },
      { letter: "C", text: "tableta oral grande" },
      { letter: "D", text: "inyección IV por el dueño en casa" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "A",
    explanation: "",
  },
  {
    id: "M3-Q11",
    prompt:
      "Rx — Enalapril 1 mg/mL O.S., Sig II mg P.O q.d. How much quantity you will dispense:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 mL" },
      { letter: "B", text: "60 mL" },
      { letter: "C", text: "90 mL" },
      { letter: "D", text: "180 mL" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation: "",
  },
  {
    id: "M3-Q12",
    prompt:
      "Rx — Enalapril 1 mg/mL O.S., Sig II mg P.O q.d. How many mL the patient will have to take daily.",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.5 mL" },
      { letter: "B", text: "1 mL" },
      { letter: "C", text: "4 mL" },
      { letter: "D", text: "8 mL" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "E",
    explanation: "",
  },
  {
    id: "M3-Q13",
    prompt:
      "Rx — Enalapril 1 mg/mL O.S., Sig II mg P.O q.d. With reference to storage, what label will you attach?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "keep frozen" },
      { letter: "B", text: "keep at room temperature" },
      { letter: "C", text: "keep in the safety cabinet" },
      { letter: "D", text: "keep in refrigerator" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "D",
    explanation: "",
  },
  {
    id: "M3-Q14",
    prompt:
      "Rx — Enalapril 1 mg/mL O.S., Sig II mg P.O q.d. What other label will you attach:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "shake well before use" },
      { letter: "B", text: "take 1 hour before meals" },
      { letter: "C", text: "take 1 hour after meals" },
      { letter: "D", text: "A and B are correct" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "A",
    explanation: "",
  },
  {
    id: "M3-Q15",
    prompt:
      "Rx — Enalapril 1 mg/mL O.S., Sig II mg P.O q.d. What else will you provide with this prescription:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "press in adapter" },
      { letter: "B", text: "two ounces amber bottle" },
      { letter: "C", text: "3 mL oral syringe" },
      { letter: "D", text: "all of above" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "D",
    explanation: "",
  },
] as const;
