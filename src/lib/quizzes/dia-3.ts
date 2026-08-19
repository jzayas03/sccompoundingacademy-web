import type { Question } from "./types";

/**
 * Day 3 — Pediatric, veterinary and BHRT.
 *
 * 15-question bank synced with the POST-TEST of the official English deck
 * by Lcdo. Reyes ("Day3_Basic_Compounding_Non_Sterile_EN", August 2026).
 * Prompts and options are the deck's literal text (each slide restates
 * its "Patient: Rx: …" header, and so does each prompt here, since the
 * portal shows one question at a time); explanations are the rationales
 * from the deck's ANSWER KEY. The same bank serves the pre-test and the
 * post-test. Answer letters are unchanged from the Spanish v2.3 bank
 * (verified 15/15 against the EN key).
 *
 * Bank structure:
 *   - Q1-Q3  : Rx Bi-est 80/20 2.5 mg/G + Testosterone 3.0 mg/G,
 *              Disp. 35 G, Sig 0.5 G behind the knees QD, Refill 5.
 *   - Q4-Q8  : Rx Testosterone 1 mg/0.1 G, Disp. in a microclick, Sig 1 mg QD.
 *   - Q9-Q13 : Rx Enalapril 1 mg/mL O.S., Sig II mg PO QD, 30 days.
 *   - Q14-Q15: Rx Gabapentin 100 mg/mL (veterinary patient).
 */
export const dia3: readonly Question[] = [
  {
    id: "M3-Q1",
    prompt:
      "Patient: Rx: Bi-est 80/20, 2.5 mg/G · Testosterone 3.0 mg/G · Disp. 35 G · Sig: apply 0.5 G behind the knees QD · Refill 5. Use this prescription to answer questions 1 through 3. The amount of estriol required for this formulation is:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "2.8 G" },
      { letter: "B", text: "700 mg" },
      { letter: "C", text: "70 mg" },
      { letter: "D", text: "17.5 mg" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "Total estrogen = 2.5 mg/G × 35 G = 87.5 mg; at the 80:20 Bi-est ratio, estriol (E3) = 87.5 mg × 0.80 = 70 mg.",
  },
  {
    id: "M3-Q2",
    prompt:
      "Patient: Rx: Bi-est 80/20, 2.5 mg/G · Testosterone 3.0 mg/G · Disp. 35 G · Sig: apply 0.5 G behind the knees QD · Refill 5. The amount of testosterone required to prepare this formulation is:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "35 mg" },
      { letter: "B", text: "70 mg" },
      { letter: "C", text: "17.5 mg" },
      { letter: "D", text: "90 mg" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "E",
    explanation:
      "Testosterone = 3.0 mg/G × 35 G = 105 mg, which is not among the listed options (A–D) — so the correct choice is E.",
  },
  {
    id: "M3-Q3",
    prompt:
      "Patient: Rx: Bi-est 80/20, 2.5 mg/G · Testosterone 3.0 mg/G · Disp. 35 G · Sig: apply 0.5 G behind the knees QD · Refill 5. If this product is dispensed in a Topi-CLICK, how many clicks per day should the patient apply?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.5 click" },
      { letter: "B", text: "1 click" },
      { letter: "C", text: "2 click" },
      { letter: "D", text: "5 click" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "The Sig calls for 0.5 G/day; each Topi-CLICK click delivers 0.25 G, so 0.5 ÷ 0.25 = 2 clicks per day.",
  },
  {
    id: "M3-Q4",
    prompt:
      "Patient: Rx: Testosterone 1 mg/0.1 G · Disp. in a microclick · Sig: 1 mg QD. Use this prescription to answer questions 4 through 8. What is the capacity of the microclick in G?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "9G" },
      { letter: "B", text: "9.5 G" },
      { letter: "C", text: "30 G" },
      { letter: "D", text: "35 G" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "The standard Microclick® device has a 9.5 G capacity — much smaller than the 30/60/90/120 mL Topi-CLICK sizes, for very low-dose formulations.",
  },
  {
    id: "M3-Q5",
    prompt:
      "Patient: Rx: Testosterone 1 mg/0.1 G · Disp. in a microclick · Sig: 1 mg QD. When you make one microclick, how much of the preparation is dispensed?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.025 cc" },
      { letter: "B", text: "0.5 cc" },
      { letter: "C", text: "0.05 cc" },
      { letter: "D", text: "0.1 cc" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "Each Microclick delivers 0.05 mL (≈ 0.05 g) per click — one-fifth the volume of a standard Topi-CLICK click (0.25 mL).",
  },
  {
    id: "M3-Q6",
    prompt:
      "Patient: Rx: Testosterone 1 mg/0.1 G · Disp. in a microclick · Sig: 1 mg QD. How much testosterone is needed to prepare this formulation if you decide to make an excess of 12 G?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "1.2 mg" },
      { letter: "B", text: "12 mg" },
      { letter: "C", text: "120 mg" },
      { letter: "D", text: "10 mg" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "Concentration = 1 mg ÷ 0.1 G = 10 mg/G; for a 12 G batch, 10 mg/G × 12 G = 120 mg of testosterone.",
  },
  {
    id: "M3-Q7",
    prompt:
      "Patient: Rx: Testosterone 1 mg/0.1 G · Disp. in a microclick · Sig: 1 mg QD. For this transdermal testosterone formulation, which will be the most appropriate penetration enhancer?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "ethoxy diglycol" },
      { letter: "B", text: "propylene glycol" },
      { letter: "C", text: "versabase" },
      { letter: "D", text: "glycerin" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "Propylene glycol is the most used and best-tolerated penetration enhancer for transdermal BHRT/steroid formulations; DMSO is too irritating, and Versabase/glycerin are vehicles, not enhancers.",
  },
  {
    id: "M3-Q8",
    prompt:
      "Patient: Rx: Testosterone 1 mg/0.1 G · Disp. in a microclick · Sig: 1 mg QD. The formula to make 100 mL requires 5 mL of the penetration enhancer. If you decide to make only 12 G of the formula, how much penetration enhancer will you use?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.5 mL" },
      { letter: "B", text: "0.6 mL" },
      { letter: "C", text: "5 mL" },
      { letter: "D", text: "6 mL" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "The formula uses 5 mL of enhancer per 100 mL; scaled to a 12 G batch: (5 mL ÷ 100) × 12 = 0.6 mL.",
  },
  {
    id: "M3-Q9",
    prompt:
      "Patient: Rx: Enalapril 1 mg/mL O.S. · Sig: II mg PO QD (2 mg PO once daily) · 30 days. Use this prescription to answer questions 9 through 13. What quantity will you dispense?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 mL" },
      { letter: "B", text: "60 mL" },
      { letter: "C", text: "90 mL" },
      { letter: "D", text: "180 mL" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "2 mg/day ÷ 1 mg/mL = 2 mL/day; 2 mL/day × 30 days = 60 mL to dispense.",
  },
  {
    id: "M3-Q10",
    prompt:
      "Patient: Rx: Enalapril 1 mg/mL O.S. · Sig: II mg PO QD (2 mg PO once daily) · 30 days. How many mL will the patient have to take per day?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.5 mL" },
      { letter: "B", text: "1 mL" },
      { letter: "C", text: "4 mL" },
      { letter: "D", text: "8 mL" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "E",
    explanation:
      "2 mg ÷ 1 mg/mL = 2 mL/day, which is not among the listed options (A–D) — so the correct choice is E.",
  },
  {
    id: "M3-Q11",
    prompt:
      "Patient: Rx: Enalapril 1 mg/mL O.S. · Sig: II mg PO QD (2 mg PO once daily) · 30 days. Regarding storage, which label will you place on the Enalapril suspension?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "keep frozen" },
      { letter: "B", text: "keep at room temperature" },
      { letter: "C", text: "keep in the safety cabinet" },
      { letter: "D", text: "keep in the refrigerator" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "D",
    explanation:
      "This is an aqueous oral suspension with no preservative noted, so it is labeled to keep refrigerated to protect stability and limit microbial growth.",
  },
  {
    id: "M3-Q12",
    prompt:
      "Patient: Rx: Enalapril 1 mg/mL O.S. · Sig: II mg PO QD (2 mg PO once daily) · 30 days. Which other label will you place?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "shake well before use" },
      { letter: "B", text: "take 1 hour before meals" },
      { letter: "C", text: "take 1 hour after meals" },
      { letter: "D", text: "A and B are correct" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "D",
    explanation:
      "Both labels apply: shake well before use (uniform suspension) and take 1 hour before meals (per enalapril administration instructions).",
  },
  {
    id: "M3-Q13",
    prompt:
      "Patient: Rx: Enalapril 1 mg/mL O.S. · Sig: II mg PO QD (2 mg PO once daily) · 30 days. What else will you provide with this prescription?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "press-in adapter" },
      { letter: "B", text: "two-ounce amber bottle" },
      { letter: "C", text: "3 mL oral syringe" },
      { letter: "D", text: "all of the above" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "D",
    explanation:
      "A complete dispensing includes the press-in adapter, the 2 oz amber bottle (light protection), and a 3 mL oral syringe for accurate dosing.",
  },
  {
    id: "M3-Q14",
    prompt:
      "Patient: Rx: Gabapentin 100 mg/mL · Sig: 1.5 mL PO q8h. Use this prescription to answer questions 14 through 15. The quantity to prepare in order to dispense this prescription is:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 mL" },
      { letter: "B", text: "60 mL" },
      { letter: "C", text: "135 mL" },
      { letter: "D", text: "135 mg" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "At 1.5 mL q8h (3 doses/day) for the standard 30-day supply used throughout this course: 1.5 mL × 3 × 30 days = 135 mL.",
  },
  {
    id: "M3-Q15",
    prompt:
      "Patient: Rx: Gabapentin 100 mg/mL · Sig: 1.5 mL PO q8h. The amount of gabapentin per dose this patient will receive is:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "150 mg" },
      { letter: "B", text: "100 mg" },
      { letter: "C", text: "150 mL" },
      { letter: "D", text: "100 mL" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "A",
    explanation:
      "At 100 mg/mL, a 1.5 mL dose contains 1.5 × 100 mg = 150 mg of gabapentin.",
  },
];
