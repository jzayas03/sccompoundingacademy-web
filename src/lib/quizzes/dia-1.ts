import type { Question } from "./types";

/**
 * Día 1 — Fundamentos regulatorios + Cápsulas.
 *
 * Banco de 15 preguntas transcrito verbatim del PDF del Lcdo. Reyes
 * ("PRE POST TEST -SCCA Día #1 .pages.pdf", 2026). Las explicaciones
 * quedan en blanco hasta que el owner las redacte — la UI esconde el
 * toggle "ver explicaciones" cuando todas están vacías en un módulo.
 */
export const dia1: readonly Question[] = [
  {
    id: "M1-Q1",
    prompt:
      "This USP chapter describes the minimum standards to be followed for the preparation of compounded non sterile preparations. For humans and animals:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "513" },
      { letter: "B", text: "795" },
      { letter: "C", text: "797" },
      { letter: "D", text: "800" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation: "",
  },
  {
    id: "M1-Q2",
    prompt:
      "This chapter describe practice and quality standards for handling hazardous drugs to promote patient safety, worker safety and environmental protection:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "513" },
      { letter: "B", text: "795" },
      { letter: "C", text: "797" },
      { letter: "D", text: "800" },
      { letter: "E", text: "none of above" },
    ],
    correctAnswer: "D",
    explanation: "",
  },
  {
    id: "M1-Q3",
    prompt: "The “Hazardous” Drug Chapter of the USP applies to:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "storage of hazardous drugs" },
      { letter: "B", text: "compounding of hazardous drugs" },
      { letter: "C", text: "administration of a hazardous drug (For example I.V.)" },
      { letter: "D", text: "disposal of a sterile or non-sterile hazardous preparation" },
      { letter: "E", text: "all of above is correct" },
    ],
    correctAnswer: "E",
    explanation: "",
  },
  {
    id: "M1-Q4",
    prompt: "The hazardous drug list is prepared by:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "USP" },
      { letter: "B", text: "FDA" },
      { letter: "C", text: "EPA" },
      { letter: "D", text: "NIOSH" },
      { letter: "E", text: "OSHA" },
    ],
    correctAnswer: "D",
    explanation: "",
  },
  {
    id: "M1-Q5",
    prompt: "For compounding sterile and non-sterile hazardous it is required as PPE:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "gowns" },
      { letter: "B", text: "head and hair cover" },
      { letter: "C", text: "shoe covers" },
      { letter: "D", text: "two pairs of chemotherapy gloves" },
      { letter: "E", text: "all of above is correct" },
    ],
    correctAnswer: "E",
    explanation: "",
  },
  {
    id: "M1-Q6",
    prompt:
      "According to the Puerto Rico Pharmacy Law with respect to compounding the law allows you to:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "prepare only a limited amount of a compounding preparation for stock" },
      { letter: "B", text: "you can not prepare a compounding in anticipation to a prescription" },
      { letter: "C", text: "the amount of units to be prepare depends on the BUD of the preparation" },
      { letter: "D", text: "the amount of units to be prepare depends on the frequency of prescriptions per day" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation: "",
  },
  {
    id: "M1-Q7",
    prompt: "DQSA",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "it refers to Drug Quality Security Act" },
      { letter: "B", text: "significantly enhanced the FDA’s authority over pharmaceutical compounding" },
      { letter: "C", text: "creates a new category of “Outsourcing Facility”" },
      { letter: "D", text: "was passed in 2013" },
      { letter: "E", text: "all of above is correct" },
    ],
    correctAnswer: "E",
    explanation: "",
  },
  {
    id: "M1-Q8",
    prompt: "For the formulation of capsules we most know:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "density of the API" },
      { letter: "B", text: "density of all ingredients in the capsule" },
      { letter: "C", text: "the packing statistics of all ingredients of the capsule" },
      { letter: "D", text: "the hazardous ingredientes of the capsule" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "C",
    explanation: "",
  },
  {
    id: "M1-Q9",
    prompt: "The BUD assigned to capsules is usually:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 days" },
      { letter: "B", text: "90 days" },
      { letter: "C", text: "180 days or expiration date of any ingredient if less than 180 days, the lesser one" },
      { letter: "D", text: "180 days" },
      { letter: "E", text: "none of above is corred" },
    ],
    correctAnswer: "C",
    explanation: "",
  },
  {
    id: "M1-Q10",
    prompt: "The packing statistic of an ingredient:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "may be supply by the distributor" },
      { letter: "B", text: "may be calculated in the laboratory" },
      { letter: "C", text: "is part of the monograph of the ingredient" },
      { letter: "D", text: "it is supplied by the USP" },
      { letter: "E", text: "A and B are correct" },
    ],
    correctAnswer: "E",
    explanation: "",
  },
  {
    id: "M1-Q11",
    prompt:
      "If the pack stat for progesterone is 270mg for capsule size 1, How much of the volume of the capsule will occupy 100 mg of progesterone:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "3.7%" },
      { letter: "B", text: "37%" },
      { letter: "C", text: "370%" },
      { letter: "D", text: "63%" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation: "",
  },
  {
    id: "M1-Q12",
    prompt:
      "If the pack stat for progesterone is 270 mg for capsule size 1 and the volume of capsule size 0 is 1.95 tunes the volume of size 1 what will be the pack stat for capsule size 0.",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "271.95 mg" },
      { letter: "B", text: "268.05 mg" },
      { letter: "C", text: "526.5 mg" },
      { letter: "D", text: "138.46 mg" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "C",
    explanation: "",
  },
  {
    id: "M1-Q13",
    prompt: "Capsules are only to be administer orally.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "FALSE",
    explanation: "",
  },
  {
    id: "M1-Q14",
    prompt: "Methocel is equivalent to Hypromellose.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "TRUE",
    explanation: "",
  },
  {
    id: "M1-Q15",
    prompt: "Methocel is the ingredient responsible for slow release capsules.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "TRUE",
    explanation: "",
  },
] as const;
