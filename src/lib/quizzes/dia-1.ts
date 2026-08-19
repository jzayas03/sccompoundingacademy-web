import type { Question } from "./types";

/**
 * Day 1 — Regulatory foundations, USP <795>/<800>, PR Pharmacy Act, DQSA
 * and capsules.
 *
 * 15-question bank synced with the POST-TEST of the official English deck
 * by Lcdo. Reyes ("Day1_Basic_Compounding_Non_Sterile_EN", August 2026).
 * Prompts and options are the deck's literal text; explanations are the
 * rationales from the deck's ANSWER KEY. The same bank serves the
 * pre-test and the post-test. Answer letters are unchanged from the
 * Spanish v2.3 bank (verified 15/15 against the EN key).
 */
export const dia1: readonly Question[] = [
  {
    id: "M1-Q1",
    prompt:
      "This USP chapter describes the minimum standards to follow for the preparation of non-sterile compounded formulations (human and animal):",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "513" },
      { letter: "B", text: "795" },
      { letter: "C", text: "797" },
      { letter: "D", text: "800" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "USP General Chapter <795> sets the minimum standards for non-sterile compounded preparations (human and veterinary); <797> covers sterile compounding and <800> covers hazardous drugs.",
  },
  {
    id: "M1-Q2",
    prompt:
      "This chapter describes practice and quality standards for handling hazardous drugs, to promote patient safety, worker safety and environmental protection:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "513" },
      { letter: "B", text: "795" },
      { letter: "C", text: "797" },
      { letter: "D", text: "800" },
      { letter: "E", text: "none of the above" },
    ],
    correctAnswer: "D",
    explanation:
      "USP <800> establishes the practice and quality standards for handling hazardous drugs to protect patients, personnel, and the environment.",
  },
  {
    id: "M1-Q3",
    prompt: "The list of hazardous drugs is prepared by:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "USP" },
      { letter: "B", text: "FDA" },
      { letter: "C", text: "EPA" },
      { letter: "D", text: "NIOSH" },
      { letter: "E", text: "OSHA" },
    ],
    correctAnswer: "D",
    explanation:
      "NIOSH publishes and periodically updates the List of Hazardous Drugs in Healthcare Settings (2024 list, CDC/NIOSH Pub 2025-103), which USP <800> incorporates by reference.",
  },
  {
    id: "M1-Q4",
    prompt:
      "For compounding sterile and non-sterile hazardous drugs, the required PPE is:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "gowns" },
      { letter: "B", text: "head and hair covers" },
      { letter: "C", text: "shoe covers" },
      { letter: "D", text: "two pairs of chemotherapy gloves" },
      { letter: "E", text: "all of the above are correct" },
    ],
    correctAnswer: "E",
    explanation:
      "USP <800> requires full PPE for hazardous-drug compounding — gowns, head/hair covers, shoe covers, and two pairs of ASTM D6978 chemotherapy gloves — for both sterile and non-sterile preparations.",
  },
  {
    id: "M1-Q5",
    prompt:
      "Under the Puerto Rico Pharmacy Act, with respect to compounding, the law allows you to:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "prepare only a limited quantity of a compounded preparation for inventory",
      },
      {
        letter: "B",
        text: "you may not compound in anticipation of a prescription",
      },
      {
        letter: "C",
        text: "the number of units to prepare depends on the BUD of the preparation",
      },
      {
        letter: "D",
        text: "the number of units depends on the frequency of prescriptions per day",
      },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "PR Act 247-2004 prohibits compounding a preparation in anticipation of a prescription; every preparation must be tied to an individual Rx and an identified patient.",
  },
  {
    id: "M1-Q6",
    prompt: "DQSA:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "refers to the Drug Quality Security Act" },
      {
        letter: "B",
        text: "significantly strengthened FDA authority over pharmaceutical compounding",
      },
      { letter: "C", text: "creates a new “Outsourcing Facility” category" },
      { letter: "D", text: "was enacted in 2013" },
      { letter: "E", text: "all of the above are correct" },
    ],
    correctAnswer: "E",
    explanation:
      "DQSA (Drug Quality and Security Act, enacted Nov. 2013) strengthened FDA authority over compounding and created the new 503B outsourcing-facility category — B, C, and D are all correct.",
  },
  {
    id: "M1-Q7",
    prompt: "For capsule formulation we must know:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "the density of the API" },
      { letter: "B", text: "the density of all the ingredients in the capsule" },
      {
        letter: "C",
        text: "the packing statistic of all the ingredients in the capsule",
      },
      { letter: "D", text: "the hazardous ingredients in the capsule" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "Formulating a capsule requires the packing statistic of every ingredient, since that determines how much of each fills the capsule shell — not density or hazard classification.",
  },
  {
    id: "M1-Q8",
    prompt: "The BUD assigned to capsules is usually:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 days" },
      { letter: "B", text: "90 days" },
      {
        letter: "C",
        text: "180 days or the expiration date of any ingredient if it is less than 180 days (whichever is shorter)",
      },
      { letter: "D", text: "180 days" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "USP <795> assigns capsules a default BUD of 180 days, but that default is capped by the expiration date of any component ingredient if it falls sooner than 180 days.",
  },
  {
    id: "M1-Q9",
    prompt: "The packing statistic of an ingredient:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "may be provided by the distributor" },
      { letter: "B", text: "may be calculated in the laboratory" },
      { letter: "C", text: "is part of the ingredient's monograph" },
      { letter: "D", text: "is provided by USP" },
      { letter: "E", text: "A and B are correct" },
    ],
    correctAnswer: "E",
    explanation:
      "The pack stat is either supplied by the API distributor (CoA/technical data sheet, A) or determined experimentally in the lab by hand-packing (B) — it is not published in a USP monograph.",
  },
  {
    id: "M1-Q10",
    prompt:
      "If the pack stat of progesterone is 270 mg for a size 1 capsule, what percentage of the capsule volume will 100 mg of progesterone occupy?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "3.7%" },
      { letter: "B", text: "37%" },
      { letter: "C", text: "370%" },
      { letter: "D", text: "63%" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "% volume = (API weight ÷ pack stat) × 100 = (100 mg ÷ 270 mg) × 100 = 37%.",
  },
  {
    id: "M1-Q11",
    prompt:
      "If the pack stat of progesterone is 270 mg for a size 1 capsule and the volume of a size 0 capsule is 1.95 times the volume of size 1, what will the pack stat of the size 0 capsule be?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "271.95 mg" },
      { letter: "B", text: "268.05 mg" },
      { letter: "C", text: "526.5 mg" },
      { letter: "D", text: "138.46 mg" },
      { letter: "E", text: "none of the above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "Pack stat scales proportionally with capsule volume: 270 mg × 1.95 (the #0-to-#1 volume ratio) = 526.5 mg.",
  },
  {
    id: "M1-Q12",
    prompt: "Methocel is equivalent to Hypromellose.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "TRUE",
    explanation:
      "Methocel® is the trade name for hypromellose (HPMC) — the two terms refer to the same polymer.",
  },
  {
    id: "M1-Q13",
    prompt: "Methocel is the ingredient responsible for slow-release capsules.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "TRUE",
    explanation:
      "Methocel (HPMC) hydrates into a gel matrix that controls and slows drug release, making it the key excipient responsible for the SR effect.",
  },
  {
    id: "M1-Q14",
    prompt:
      "Compounding pharmacies are not allowed to make commercially available products. If a commercially available product is in shortage, the compounding pharmacy may duplicate the product until the shortage ends.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "TRUE",
    explanation:
      "Compounding a copy of an FDA-approved product is normally prohibited, but the FDA Drug Shortage List creates a documented exception that allows it for as long as the shortage lasts.",
  },
  {
    id: "M1-Q15",
    prompt:
      "Compounding pharmacies are classified as 503A and 503B: 503A compounds sterile products; 503B compounds non-sterile products.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "FALSE",
    explanation:
      "This is a common myth — 503A vs. 503B is not a sterile-vs.-non-sterile split. Both can compound either type; the real difference is the regulatory model (individual Rx + state Board of Pharmacy vs. anticipatory batches + FDA cGMP).",
  },
];
