import type { Question } from "./types";

/**
 * Student module 1 — USP 〈795〉 Pharmaceutical Compounding (Nonsterile).
 * Bank drafted from public/modulos/est-795.pdf; pending owner review.
 */
export const usp795: readonly Question[] = [
  {
    id: "E795-Q1",
    prompt:
      "A compounded nonsterile preparation (CNSP) under <795> is best defined as:",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        text: "Any drug product manufactured by an FDA-registered facility",
      },
      {
        letter: "B",
        text: "Combining, admixing, diluting, pooling, reconstituting other than as provided in the manufacturer's labeling, or otherwise altering a drug product or bulk drug substance to create a nonsterile preparation",
      },
      {
        letter: "C",
        text: "Reconstituting a drug strictly according to the manufacturer's approved labeling",
      },
      {
        letter: "D",
        text: "Dispensing a commercially available product in its original container",
      },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "The deck quotes the <795> definition verbatim: compounding is combining, admixing, diluting, pooling, reconstituting other than per the manufacturer's labeling, or otherwise altering a drug product or bulk drug substance to create a nonsterile preparation.",
  },
  {
    id: "E795-Q2",
    prompt:
      "Which of the following dosage forms is covered under the scope of <795>?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Solid oral preparations (tablets, capsules, powders, lozenges)" },
      { letter: "B", text: "Liquid oral solutions, suspensions, syrups, and elixirs" },
      { letter: "C", text: "Rectal and vaginal suppositories, creams, gels, and enemas" },
      { letter: "D", text: "Topical creams, gels, ointments, and pastes" },
      { letter: "E", text: "all of above is correct" },
    ],
    correctAnswer: "E",
    explanation:
      "The scope slide lists solid oral, liquid oral, rectal/vaginal, topical, nasal/sinus, and otic dosage forms as all falling within <795>.",
  },
  {
    id: "E795-Q3",
    prompt:
      "An otic preparation intended for an ear with a PERFORATED tympanic membrane is governed by:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "<795>, because it is still a nonsterile preparation" },
      { letter: "B", text: "<797>, because a perforated membrane requires a sterile preparation" },
      { letter: "C", text: "<800>, because the ear is an internal route" },
      { letter: "D", text: "<825>, because it is administered locally" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "The deck notes otic preparations fall under <795> only for an intact eardrum; a perforated tympanic membrane routes the preparation to sterile compounding under <797>.",
  },
  {
    id: "E795-Q4",
    prompt:
      "Reconstituting a drug strictly according to the manufacturer's approved labeling is considered compounding under <795>.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "FALSE",
    explanation:
      "Reconstitution strictly per the manufacturer's approved labeling is explicitly listed as a practice OUTSIDE the scope of <795>; it is not compounding.",
  },
  {
    id: "E795-Q5",
    prompt:
      "Repackaging of conventionally manufactured drug products is addressed by which USP chapter, not <795>?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "<797>" },
      { letter: "B", text: "<800>" },
      { letter: "C", text: "<825>" },
      { letter: "D", text: "<1178>" },
      { letter: "E", text: "<1231>" },
    ],
    correctAnswer: "D",
    explanation:
      "The 'Practices Outside the Scope' slide directs repackaging of conventionally manufactured products to USP General Chapter <1178>, Good Repackaging Practices.",
  },
  {
    id: "E795-Q6",
    prompt:
      "Under the administration-preparation exception, preparing a single dose for a single patient is excluded from <795> when administration begins within:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "1 hour" },
      { letter: "B", text: "4 hours" },
      { letter: "C", text: "12 hours" },
      { letter: "D", text: "24 hours" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "Preparing a single dose for a single patient (e.g., crushing a tablet to mix with food) is excluded from <795> when administration begins within 4 hours; the exception is patient-specific and time-limited.",
  },
  {
    id: "E795-Q7",
    prompt:
      "Nonsterile radiopharmaceuticals are governed by which USP chapter rather than <795>?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "<797>" },
      { letter: "B", text: "<800>" },
      { letter: "C", text: "<825>" },
      { letter: "D", text: "<1112>" },
      { letter: "E", text: "<1163>" },
    ],
    correctAnswer: "C",
    explanation:
      "The deck lists nonsterile radiopharmaceuticals among practices outside <795>; they fall under USP General Chapter <825>.",
  },
  {
    id: "E795-Q8",
    prompt:
      "Which of the following is NOT one of the five compounding risks that <795> was written to prevent?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Excessive microbial contamination of the finished preparation" },
      { letter: "B", text: "Variability from the intended strength of correct ingredients" },
      { letter: "C", text: "Physical and chemical incompatibilities between ingredients" },
      { letter: "D", text: "Failure to bill the preparation to the correct insurance plan" },
      { letter: "E", text: "Use of bulk drug substances or excipients of inappropriate quality" },
    ],
    correctAnswer: "D",
    explanation:
      "The five risks are microbial contamination, strength variability, incompatibilities, chemical/physical contaminants, and substandard ingredients. Billing is not one of them.",
  },
  {
    id: "E795-Q9",
    prompt:
      "Which statement about the designated person under <795> is correct?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Only large facilities are required to name a designated person" },
      { letter: "B", text: "A solo compounder is, by definition, the designated person" },
      { letter: "C", text: "The designated person's accountability may be assumed informally rather than written" },
      { letter: "D", text: "The designated person is responsible only for cleaning schedules" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "The deck states every facility must name one or more designated persons, a solo compounder is by definition the designated person, and accountability must be named in writing in the SOPs.",
  },
  {
    id: "E795-Q10",
    prompt:
      "Under <795>, personnel must complete initial training and competency before independent compounding, and re-evaluation must occur at least every:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "3 months" },
      { letter: "B", text: "6 months" },
      { letter: "C", text: "12 months" },
      { letter: "D", text: "24 months" },
      { letter: "E", text: "36 months" },
    ],
    correctAnswer: "C",
    explanation:
      "Required training cadence: initial training and competency before independent compounding, then re-training and re-evaluation at least every 12 months, all documented.",
  },
  {
    id: "E795-Q11",
    prompt:
      "For hand hygiene under <795>, which of the following is required before donning gloves to compound?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Alcohol-based hand rub alone is sufficient" },
      { letter: "B", text: "Wash hands with soap and water for at least 30 seconds, dry with disposable towels, then don gloves" },
      { letter: "C", text: "Rinse hands with tap water only" },
      { letter: "D", text: "No hand hygiene is required if gloves are worn" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "The garbing slide specifies washing with soap and water for at least 30 seconds, drying completely with disposable towels, then donning gloves; an alcohol-based hand rub alone is NOT sufficient.",
  },
  {
    id: "E795-Q12",
    prompt:
      "Under Table 4 of <795>, what default BUD applies to a NONPRESERVED aqueous CNSP (water activity ≥ 0.60) when no monograph and no stability data exist?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "14 days, refrigerated" },
      { letter: "B", text: "35 days, CRT or refrigerated" },
      { letter: "C", text: "90 days, CRT or refrigerated" },
      { letter: "D", text: "180 days, CRT or refrigerated" },
      { letter: "E", text: "no BUD limit applies" },
    ],
    correctAnswer: "A",
    explanation:
      "Table 4 assigns 14 days (refrigerator) to nonpreserved aqueous CNSPs with aw ≥ 0.60. The four default numbers are 14, 35, 90, and 180 days at the 0.60 aw threshold.",
  },
  {
    id: "E795-Q13",
    prompt:
      "The water activity (aw) threshold in <795> that separates 'low microbial risk' (nonaqueous) from preparations that need preservation (aqueous) is:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.30" },
      { letter: "B", text: "0.45" },
      { letter: "C", text: "0.60" },
      { letter: "D", text: "0.85" },
      { letter: "E", text: "0.99" },
    ],
    correctAnswer: "C",
    explanation:
      "The deck repeatedly marks 0.60 as the water-activity line: aw ≥ 0.60 is aqueous (14-35 day BUD range) and aw < 0.60 is nonaqueous (90-180 day BUD range).",
  },
  {
    id: "E795-Q14",
    prompt:
      "Regarding APIs and water used in <795> compounding, which statement is correct?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "APIs may be used without a Certificate of Analysis (COA) if the supplier is well known" },
      { letter: "B", text: "Tap water may be used when a formulation includes water as an ingredient" },
      { letter: "C", text: "APIs must comply with the USP-NF monograph (if one exists), be accompanied by a COA, and water as an ingredient must be Purified Water or better" },
      { letter: "D", text: "Component selection is the responsibility of any technician on duty" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "Component-selection slide: APIs must comply with the USP-NF monograph if one exists, carry a COA, and be FDA-registered-facility sourced; Purified Water or better is required when water is a formulation ingredient. 'No COA, no compounding.'",
  },
  {
    id: "E795-Q15",
    prompt:
      "How do hazardous drugs (HDs) relate to <795> compounding standards?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "HDs are exempt from <795> entirely" },
      { letter: "B", text: "<795> replaces <800> for nonsterile HD compounding" },
      { letter: "C", text: "<795> sets the floor and <800> adds mandatory HD containment controls on top" },
      { letter: "D", text: "HDs may be compounded without any additional controls beyond <795>" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "The deck states hazardous drugs always layer in <800> — <795> sets the floor for nonsterile compounding, and <800> adds mandatory HD controls on top.",
  },
  {
    id: "E795-Q16",
    prompt: "Under <795>, simply breaking or cutting a tablet into smaller portions is:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Compounding, and always within the scope of <795>" },
      { letter: "B", text: "Tablet splitting, which does not constitute compounding under this chapter" },
      { letter: "C", text: "Permitted only inside a C-PEC" },
      { letter: "D", text: "Repackaging governed by <797>" },
    ],
    correctAnswer: "B",
    explanation:
      "The deck lists tablet splitting among practices outside the scope of <795>: simply breaking or cutting a tablet into smaller portions does not constitute compounding under this chapter.",
  },
] as const;
