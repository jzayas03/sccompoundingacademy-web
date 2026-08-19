import type { Question } from "./types";

/**
 * Day 2 — Suppositories, dermatology, topical compounding and equipment.
 *
 * 15-question bank synced with the POST-TEST of the official English deck
 * by Lcdo. Reyes ("Day2_Basic_Compounding_Non_Sterile_EN", August 2026).
 * Prompts and options are the deck's literal text; explanations are the
 * rationales from the deck's ANSWER KEY. The same bank serves the
 * pre-test and the post-test. Answer letters are unchanged from the
 * Spanish v2.3 bank (verified 15/15 against the EN key).
 *
 * Q11–Q15 share one hydroquinone Rx; the Rx is stated in Q11 (as in the
 * deck, "Use this prescription to answer questions 11 through 15").
 */
export const dia2: readonly Question[] = [
  {
    id: "M2-Q1",
    prompt: "Most suppositories have an assigned BUD of:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 days" },
      { letter: "B", text: "60 days" },
      { letter: "C", text: "90 days" },
      { letter: "D", text: "180 days" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "USP <795> defaults non-aqueous liquid/semisolid formulations without supporting stability data to a 90-day BUD; the 180-day default is reserved for solid oral dosage forms such as capsules.",
  },
  {
    id: "M2-Q2",
    prompt:
      "The use of silicon dioxide in compounding suppositories is that, as a suspending agent, it:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "helps distribute the API throughout the entire suppository mass",
      },
      { letter: "B", text: "increases the solubility of the API" },
      { letter: "C", text: "adjusts the pH of the preparation" },
      { letter: "D", text: "improves the metabolism of the API" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "A",
    explanation:
      "Silicon dioxide is a suspending agent — it distributes the API evenly through the suppository mass. It does not increase solubility, adjust pH, or affect metabolism.",
  },
  {
    id: "M2-Q3",
    prompt:
      "If you have a prescription for 30 suppositories, it is recommended to calculate for:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 suppositories" },
      { letter: "B", text: "31 suppositories" },
      { letter: "C", text: "33 suppositories" },
      { letter: "D", text: "40 suppositories" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "The overage rule adds a mandatory +10% to compensate for losses during molding, scraping, and QC: 30 suppositories × 1.10 = 33.",
  },
  {
    id: "M2-Q4",
    prompt: "Suppositories are best stored:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "at room temperature" },
      { letter: "B", text: "in the refrigerator" },
      { letter: "C", text: "in the freezer" },
      { letter: "D", text: "between 45° and 50°C" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "Cocoa butter — the most common suppository base — melts at 34–36°C and must be refrigerated (2–8°C); refrigeration is the safe default, even though firm PEG/Witepsol bases can be room-temperature stable.",
  },
  {
    id: "M2-Q5",
    prompt: "Progesterone suppositories are used during pregnancy to:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "prevent spontaneous abortion in high-risk pregnancies",
      },
      { letter: "B", text: "reduce the risk of preterm birth" },
      { letter: "C", text: "provide support after fertility treatments" },
      { letter: "D", text: "provide luteal phase support" },
      { letter: "E", text: "all of the above are correct" },
    ],
    correctAnswer: "E",
    explanation:
      "ACOG and NIH/NICHD recognize compounded vaginal progesterone for all four indications: preventing spontaneous abortion, reducing preterm birth, IVF luteal support, and primary luteal-phase support.",
  },
  {
    id: "M2-Q6",
    prompt:
      "Dermatological condition(s) commonly treated with a compounded preparation:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "acne" },
      { letter: "B", text: "psoriasis" },
      { letter: "C", text: "melasma" },
      { letter: "D", text: "hair loss" },
      { letter: "E", text: "all of the above are correct" },
    ],
    correctAnswer: "E",
    explanation:
      "Acne, psoriasis, melasma, and hair loss are all routinely treated with individualized compounded topical preparations.",
  },
  {
    id: "M2-Q7",
    prompt: "The mill is equipment used to:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "reduce the particle size of the ingredients" },
      { letter: "B", text: "mix all the ingredients very homogeneously" },
      { letter: "C", text: "distribute the API in the diluent" },
      { letter: "D", text: "all of the above are correct" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "D",
    explanation:
      "A 3-roller ointment mill reduces API particle size, and in doing so also produces a smoother, more homogeneous cream with the API evenly distributed through the vehicle.",
  },
  {
    id: "M2-Q8",
    prompt: "The acronym EMP stands for:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "equilibrate the mass and the pressure" },
      { letter: "B", text: "electronic mortar and pestle" },
      { letter: "C", text: "electronic manufacturing process" },
      {
        letter: "D",
        text: "the combination of estradiol and micronized progesterone",
      },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "EMP stands for Electronic Mortar and Pestle — the mechanized device commercially known as the Unguator®.",
  },
  {
    id: "M2-Q9",
    prompt: "Low-dose naltrexone can help patients with:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Hailey-Hailey disease" },
      { letter: "B", text: "psoriasis" },
      { letter: "C", text: "scleroderma" },
      { letter: "D", text: "all of the above are correct" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "D",
    explanation:
      "Low-dose naltrexone (1.5–4.5 mg/day) is reported to help Hailey-Hailey disease, refractory psoriasis, and scleroderma, among other immune-modulated conditions.",
  },
  {
    id: "M2-Q10",
    prompt: "Hair loss can be treated with:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "minoxidil" },
      { letter: "B", text: "finasteride" },
      { letter: "C", text: "dutasteride" },
      { letter: "D", text: "all of the above are correct" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "D",
    explanation:
      "Minoxidil, finasteride, and dutasteride act through different mechanisms (vasodilation and 5α-reductase inhibition) and are often compounded together for androgenetic alopecia.",
  },
  {
    id: "M2-Q11",
    prompt:
      "Rx: Hydroquinone 8% · Salicylic Acid 2% · Vit. C 550 mg × 2 · Betamethasone Valerate 15 G · Emollient Cream 45 G · Mix and prepare this cream · Sig: apply as directed. Use this prescription to answer questions 11 through 15. This preparation is recommended for the treatment of which condition?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "psoriasis" },
      { letter: "B", text: "acne" },
      { letter: "C", text: "melasma" },
      { letter: "D", text: "rosacea" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "Hydroquinone (a tyrosinase-inhibiting depigmenting agent) combined with salicylic acid for penetration is the classic compounded formula for melasma.",
  },
  {
    id: "M2-Q12",
    prompt: "Vitamin C is included in this preparation as:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "an antioxidant" },
      { letter: "B", text: "a depigmenting agent" },
      { letter: "C", text: "a penetration enhancer" },
      { letter: "D", text: "all of the above are correct" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "A",
    explanation:
      "Vitamin C protects hydroquinone from oxidation, preserving the stability and potency of the formula — not a depigmenting or penetration-enhancing role.",
  },
  {
    id: "M2-Q13",
    prompt: "It is recommended to apply this preparation:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "all day and night" },
      { letter: "B", text: "at bedtime" },
      { letter: "C", text: "during the day only" },
      { letter: "D", text: "every 6 hours, day and night" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "Hydroquinone degrades on light exposure (oxidation/photodegradation), so it is applied only at bedtime, paired with strict daytime sun protection.",
  },
  {
    id: "M2-Q14",
    prompt:
      "The amount of hydroquinone required to prepare this formulation is:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "3.61 G" },
      { letter: "B", text: "4.80 G" },
      { letter: "C", text: "5.42 G" },
      { letter: "D", text: "6.00 G" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "The fixed-weight ingredients (Vit. C + Betamethasone + Emollient Cream ≈ 61 G) make up the other 90% of the batch (100% − 8% HQ − 2% SA): 61 G ÷ 0.90 = 67.8 G total, then 8% × 67.8 G = 5.42 G of hydroquinone.",
  },
  {
    id: "M2-Q15",
    prompt: "It is recommended to prepare this formula using:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "a high-speed mixer" },
      { letter: "B", text: "an analytical balance" },
      { letter: "C", text: "mill" },
      { letter: "D", text: "a good penetration enhancer" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "Hydroquinone is supplied as crystals; a mill is needed to reduce the particle size before it can be evenly incorporated into the cream base.",
  },
];
