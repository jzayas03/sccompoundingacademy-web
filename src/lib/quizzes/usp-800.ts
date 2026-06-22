import type { Question } from "./types";

/**
 * Student module 2 — USP 〈800〉 Hazardous Drugs in Healthcare Settings.
 * Bank drafted from public/modulos/est-800.pdf; pending owner review.
 */
export const usp800: readonly Question[] = [
  {
    id: "E800-Q1",
    prompt:
      "USP <800> is fundamentally an occupational safety standard. Which three populations does it protect?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Prescribers, payers, and regulators" },
      { letter: "B", text: "Patients, workers, and the environment" },
      { letter: "C", text: "Patients, prescribers, and the public" },
      { letter: "D", text: "Workers, payers, and the environment" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "The scope slide names three protected populations: patient safety, worker safety, and environmental protection. <800>'s first goal is protecting the worker.",
  },
  {
    id: "E800-Q2",
    prompt:
      "Which organization publishes the list of hazardous drugs that an entity must use as the basis for its own HD list?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "FDA" },
      { letter: "B", text: "EPA" },
      { letter: "C", text: "OSHA" },
      { letter: "D", text: "NIOSH" },
      { letter: "E", text: "USP" },
    ],
    correctAnswer: "D",
    explanation:
      "An entity must maintain its own HD list drawn from the current NIOSH List of Antineoplastic and Other Hazardous Drugs in Healthcare Settings.",
  },
  {
    id: "E800-Q3",
    prompt:
      "How often must an entity review its hazardous drug list?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "At least every 3 months" },
      { letter: "B", text: "At least every 6 months" },
      { letter: "C", text: "At least every 12 months" },
      { letter: "D", text: "At least every 24 months" },
      { letter: "E", text: "Only when NIOSH issues a new list" },
    ],
    correctAnswer: "C",
    explanation:
      "The entity's HD list, drawn from the NIOSH List, must be reviewed at least every 12 months (annually).",
  },
  {
    id: "E800-Q4",
    prompt:
      "Which of the following must ALWAYS follow all <800> containment requirements and may NOT use an Assessment of Risk for alternative containment?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Final dosage forms of compounded HD preparations" },
      { letter: "B", text: "Conventionally manufactured HD products requiring only counting or repackaging" },
      { letter: "C", text: "Any HD active pharmaceutical ingredient (API) and any antineoplastic requiring HD manipulation" },
      { letter: "D", text: "Non-antineoplastic final dosage forms on the NIOSH list" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "Any HD API and any antineoplastic requiring manipulation MUST follow all containment requirements; these cannot be down-scoped by an Assessment of Risk. APIs and manipulated antineoplastics always require full containment, no exceptions.",
  },
  {
    id: "E800-Q5",
    prompt:
      "An Assessment of Risk (AoR), at minimum, must consider all of the following EXCEPT:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Type of HD (antineoplastic, non-antineoplastic, reproductive risk only)" },
      { letter: "B", text: "Dosage form and packaging" },
      { letter: "C", text: "Risk of exposure and manipulation required" },
      { letter: "D", text: "The reimbursement rate for the preparation" },
      { letter: "E", text: "All of the above must be considered" },
    ],
    correctAnswer: "D",
    explanation:
      "An AoR must consider type of HD, dosage form, risk of exposure, packaging, and manipulation required. Reimbursement is not a factor in an Assessment of Risk.",
  },
  {
    id: "E800-Q6",
    prompt:
      "If an entity does NOT perform an Assessment of Risk for an eligible HD, what is the consequence?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "The HD may be handled with no special controls" },
      { letter: "B", text: "The entity must apply ALL <800> containment strategies to every HD" },
      { letter: "C", text: "The HD is removed from the NIOSH list" },
      { letter: "D", text: "Only PPE is required, with no engineering controls" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "The deck states the AoR is the only path to right-sized containment; if you don't perform one, you must apply ALL <800> containment strategies to every HD.",
  },
  {
    id: "E800-Q7",
    prompt:
      "Which of the following is one of the mandatory occupational-safety-plan elements every entity handling HDs must build?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "An HD list" },
      { letter: "B", text: "Facility and engineering controls" },
      { letter: "C", text: "Competent (trained) personnel and safe work practices" },
      { letter: "D", text: "Proper PPE use and HD waste segregation/disposal" },
      { letter: "E", text: "all of above is correct" },
    ],
    correctAnswer: "E",
    explanation:
      "The six mandatory elements are: HD list, facility/engineering controls, competent personnel, safe work practices, proper PPE use, and HD waste segregation and disposal. <800> is a system, not a checklist.",
  },
  {
    id: "E800-Q8",
    prompt:
      "In the three levels of engineering controls, what is a C-PEC?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "A ventilated device that minimizes worker and environmental HD exposure during direct handling (e.g., CVE, Class I/II BSC, CACI)" },
      { letter: "B", text: "The room in which the primary device is placed" },
      { letter: "C", text: "A closed-system drug-transfer device used at the bedside" },
      { letter: "D", text: "A respirator cartridge rated for HD vapors" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "A",
    explanation:
      "The C-PEC (Containment Primary Engineering Control) is the Level 1 ventilated device for direct handling — examples include a CVE, Class I/II BSC, or CACI. The C-SEC is the room (Level 2); CSTDs are supplemental (Level 3).",
  },
  {
    id: "E800-Q9",
    prompt:
      "A closed-system drug-transfer device (CSTD) can be used as a substitute for a C-PEC.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "FALSE",
    explanation:
      "A CSTD is a supplemental (Level 3) control and is NEVER a substitute for a C-PEC. It adds a layer of protection on top of the primary and secondary engineering controls.",
  },
  {
    id: "E800-Q10",
    prompt:
      "When MUST a CSTD be used, per <800>?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "When compounding any nonsterile HD" },
      { letter: "B", text: "When administering antineoplastic HDs when the dosage form allows" },
      { letter: "C", text: "When storing HDs in a refrigerator" },
      { letter: "D", text: "When receiving HDs from a supplier" },
      { letter: "E", text: "never; CSTDs are always optional" },
    ],
    correctAnswer: "B",
    explanation:
      "A CSTD MUST be used when administering antineoplastic HDs when the dosage form allows, and SHOULD be used when compounding HDs when the dosage form allows. It must not be used if incompatible with the specific HD.",
  },
  {
    id: "E800-Q11",
    prompt:
      "For the PREFERRED sterile HD configuration (ISO 7 buffer + ISO 7 ante room), the HD buffer room requires which minimum air changes per hour (ACPH) and pressure relationship?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "12 ACPH, positive pressure" },
      { letter: "B", text: "30 ACPH, positive pressure" },
      { letter: "C", text: "6 ACPH, neutral pressure" },
      { letter: "D", text: "30 ACPH, negative pressure (0.01-0.03 in. w.c.) relative to adjacent areas" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "D",
    explanation:
      "Table 3 Row 1 (ISO 7 buffer configuration): externally vented C-SEC at 30 ACPH and negative pressure 0.01-0.03 in. w.c. relative to adjacent areas. This is the only configuration that allows standard <797> BUDs for sterile HD CSPs.",
  },
  {
    id: "E800-Q12",
    prompt:
      "What is the main trade-off of using a Containment Segregated Compounding Area (C-SCA) for sterile HD compounding instead of the full ISO 7 suite?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "It requires no negative pressure" },
      { letter: "B", text: "It permits high-risk CSPs of any BUD" },
      { letter: "C", text: "It allows only low- and medium-risk HD CSPs and yields shorter BUDs than the ISO 7 configuration" },
      { letter: "D", text: "It eliminates the need for a C-PEC" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "Table 3 Row 2 (C-SCA): an unclassified room at ≥12 ACPH and negative pressure where only low- and medium-risk HD CSPs may be prepared, with BUDs shorter than the ISO 7 configuration. Choosing the C-SCA buys simplicity at the cost of BUD.",
  },
  {
    id: "E800-Q13",
    prompt:
      "Chemotherapy gloves used for handling HDs must meet which standard and which other requirement?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "ASTM D6978 (or successor) and must be powder-free" },
      { letter: "B", text: "ISO 5 and must be sterile for all uses" },
      { letter: "C", text: "OSHA 1910.134 and must be reusable" },
      { letter: "D", text: "NIOSH N95 and must be latex" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "A",
    explanation:
      "Chemotherapy gloves must meet ASTM D6978 (or successor), be powder-free, be inspected for defects, and be changed every 30 minutes (unless the manufacturer specifies otherwise) or immediately when torn or contaminated.",
  },
  {
    id: "E800-Q14",
    prompt:
      "What is the baseline PPE for compounding both sterile and nonsterile hazardous drugs?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "A single pair of exam gloves only" },
      { letter: "B", text: "A cloth lab coat and one pair of gloves" },
      { letter: "C", text: "A gown; head, hair, and shoe covers; and TWO pairs of chemotherapy gloves" },
      { letter: "D", text: "A surgical mask and goggles only" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "C",
    explanation:
      "Baseline PPE for compounding sterile and nonsterile HDs is a gown; head, hair, and shoe covers; and two pairs of chemotherapy gloves. A cloth lab coat is not protection.",
  },
  {
    id: "E800-Q15",
    prompt:
      "A surgical mask provides adequate respiratory protection from hazardous drugs.",
    type: "true-false",
    options: [
      { letter: "TRUE", text: "True" },
      { letter: "FALSE", text: "False" },
    ],
    correctAnswer: "FALSE",
    explanation:
      "Surgical masks do NOT provide respiratory protection from HDs. Most HD activities requiring respiratory protection need a fit-tested NIOSH-certified N95 or more protective device, with PAPR or full-facepiece required for spills and gas/vapor exposure.",
  },
  {
    id: "E800-Q16",
    prompt:
      "When an HD shipping container that must be opened is found DAMAGED, the correct procedure is to:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Open it on any counter and wipe up the spill with paper towels" },
      { letter: "B", text: "Seal it in plastic or an impervious container, transport it to a C-PEC, open it on a plastic-backed prep mat, and handle damaged items as hazardous waste" },
      { letter: "C", text: "Return it to the shelf and use it normally" },
      { letter: "D", text: "Place it in the pneumatic tube system for disposal" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "Table 4: a damaged container that must be opened is sealed in plastic/impervious container, transported to a C-PEC, opened on a plastic-backed prep mat; damaged items are enclosed and discarded as hazardous waste, then the C-PEC is deactivated, decontaminated, and cleaned. A damaged HD shipment is a contamination event (a spill).",
  },
  {
    id: "E800-Q17",
    prompt:
      "The four cleaning steps for HD surfaces, in their required sequential order, are:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Cleaning, disinfection, deactivation, decontamination" },
      { letter: "B", text: "Deactivation, decontamination, cleaning, and (for sterile) disinfection" },
      { letter: "C", text: "Disinfection, cleaning, decontamination, deactivation" },
      { letter: "D", text: "Decontamination, deactivation, disinfection, cleaning" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "Table 5 lists the steps in order: 1) deactivation (render inert), 2) decontamination (remove residue), 3) cleaning (remove organic/inorganic material), and 4) disinfection (sterile only). The steps are sequential and non-substitutable.",
  },
  {
    id: "E800-Q18",
    prompt:
      "Cleaning agents for HD surfaces should be applied using:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Spray bottles, to cover the surface quickly" },
      { letter: "B", text: "Wipes, NOT spray bottles, to avoid spreading residue" },
      { letter: "C", text: "Compressed-air dusters" },
      { letter: "D", text: "Dry paper towels only" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "The cleaning rules specify applying agents via wipes — not spray bottles — to avoid aerosolizing and spreading HD residue.",
  },
  {
    id: "E800-Q19",
    prompt:
      "How often should environmental wipe sampling for HD surface contamination be performed after the initial benchmark?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "At least every 6 months (or more often as needed to verify containment)" },
      { letter: "B", text: "At least every 12 months" },
      { letter: "C", text: "At least every 24 months" },
      { letter: "D", text: "Only when a spill occurs" },
      { letter: "E", text: "Never; wipe sampling is optional" },
    ],
    correctAnswer: "A",
    explanation:
      "Wipe sampling is done initially as a benchmark, then at least every 6 months (or more often as needed). It is the only way to prove containment is actually working. The deck notes no universal acceptance limit exists, though some studies show worker uptake at cyclophosphamide > 1.00 ng/cm².",
  },
  {
    id: "E800-Q20",
    prompt:
      "Which statement about medical surveillance under <800> is correct?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "It applies only after a worker is injured by an HD" },
      { letter: "B", text: "It enrolls personnel who handle HDs as a regular part of their job and includes baseline (pre-placement), periodic, and exit examinations" },
      { letter: "C", text: "It is a one-time exam at hire with no follow-up" },
      { letter: "D", text: "It is optional for entities that perform wipe sampling" },
      { letter: "E", text: "none of above is correct" },
    ],
    correctAnswer: "B",
    explanation:
      "Medical surveillance (§18) enrolls personnel who handle HDs as a regular part of their job, with baseline pre-placement assessment, periodic surveillance, exit examination, and a follow-up plan after any health change or acute exposure. It is both primary (baseline) and secondary (early detection) prevention.",
  },
] as const;
