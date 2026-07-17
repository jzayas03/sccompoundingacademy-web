import type { Question } from "./types";

/**
 * Día 3 — Pediátrico, veterinario y BHRT.
 *
 * Banco de 15 preguntas transcrito del docx oficial en español del Lcdo.
 * Reyes ("Post-Tests_Compounding_Dias_1-3.docx", 2026).
 *
 * Estructura del banco:
 *   - Q1-Q3  : Rx Bi-est 80/20 2.5 mg/G + Testosterona 3.0 mg/G,
 *              Disp. 35 G, Sig 0.5 G detrás de las rodillas QD, Refill 5.
 *   - Q4-Q8  : Rx Testosterona 1 mg/0.1 G, Disp. en microclick, Sig 1 mg QD.
 *   - Q9-Q13 : Rx Enalapril 1 mg/mL O.S., Sig II mg PO QD.
 *   - Q14-Q15: Rx Gabapentin 100 mg/mL (paciente veterinario).
 *
 * Cada `prompt` re-inline-a el escenario correspondiente para que la UI
 * siga sin necesitar un modelo de contexto compartido entre preguntas.
 * Las explicaciones vienen de la columna "Observación" del documento
 * fuente.
 */
export const dia3: readonly Question[] = [
  {
    id: "M3-Q1",
    prompt:
      "Paciente: Rx: Bi-est 80/20, 2.5 mg/G · Testosterona 3.0 mg/G · Disp. 35 G · Sig: aplicar 0.5 G detrás de las rodillas QD · Refill 5. Usa esta receta para contestar las preguntas 1 a la 3. La cantidad de estriol requerida para esta formulación es:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "2.8 G" },
      { letter: "B", text: "700 mg" },
      { letter: "C", text: "70 mg" },
      { letter: "D", text: "17.5 mg" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation:
      "2.5 mg/G × 35 G = 87.5 mg total de Bi-est; 80% = 70 mg de estriol.",
  },
  {
    id: "M3-Q2",
    prompt:
      "Paciente: Rx: Bi-est 80/20, 2.5 mg/G · Testosterona 3.0 mg/G · Disp. 35 G. La cantidad de testosterona requerida para preparar esta formulación es:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "35 mg" },
      { letter: "B", text: "70 mg" },
      { letter: "C", text: "17.5 mg" },
      { letter: "D", text: "90 mg" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "E",
    explanation:
      "3.0 mg/G × 35 G = 105 mg — no coincide con ninguna opción.",
  },
  {
    id: "M3-Q3",
    prompt:
      "Paciente: Rx dispensada en Topi-CLICK · Sig: aplicar 0.5 G QD. Si este producto se dispensa en un Topi-CLICK, ¿cuántos clicks diarios debe aplicar el paciente?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.5 click" },
      { letter: "B", text: "1 click" },
      { letter: "C", text: "2 click" },
      { letter: "D", text: "5 click" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation: "0.5 G ÷ 0.25 G/click = 2 clicks.",
  },
  {
    id: "M3-Q4",
    prompt:
      "Paciente: Rx: Testosterona 1 mg/0.1 G · Disp. en microclick · Sig: 1 mg QD. Usa esta receta para contestar las preguntas 4 a la 8. ¿Cuál es la capacidad en G del microclick?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "9 G" },
      { letter: "B", text: "9.5 G" },
      { letter: "C", text: "30 G" },
      { letter: "D", text: "35 G" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "B",
    explanation: "Topi-CLICK Microclick PI.",
  },
  {
    id: "M3-Q5",
    prompt:
      "Paciente: Microclick — un click. Al hacer un microclick, ¿cuánta cantidad de la preparación se dispensa?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.025 cc" },
      { letter: "B", text: "0.5 cc" },
      { letter: "C", text: "0.05 cc" },
      { letter: "D", text: "0.1 cc" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation: "PI del fabricante del Microclick.",
  },
  {
    id: "M3-Q6",
    prompt:
      "Paciente: Rx: Testosterona 1 mg/0.1 G · Disp. en microclick. ¿Cuánta testosterona es necesaria para preparar esta formulación si decide hacer un excedente de 12 G?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "1.2 mg" },
      { letter: "B", text: "12 mg" },
      { letter: "C", text: "120 mg" },
      { letter: "D", text: "10 mg" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation: "1 mg/0.1 G = 10 mg/G; 10 mg/G × 12 G = 120 mg.",
  },
  {
    id: "M3-Q7",
    prompt:
      "Para esta formulación de testosterona transdérmica, ¿cuál será el potenciador de penetración más apropiado?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "ethoxy diglycol" },
      { letter: "B", text: "propylene glycol" },
      { letter: "C", text: "versabase" },
      { letter: "D", text: "glycerin" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "B",
    explanation:
      "Propilenglicol — primera elección en BHRT transdérmico.",
  },
  {
    id: "M3-Q8",
    prompt:
      "La fórmula para hacer 100 mL requiere 5 mL del potenciador de penetración. Si decide hacer solo 12 G de la fórmula, ¿cuánto potenciador de penetración usará?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.5 mL" },
      { letter: "B", text: "0.6 mL" },
      { letter: "C", text: "5 mL" },
      { letter: "D", text: "6 mL" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "B",
    explanation: "5 mL/100 mL = x/12 mL; x = 0.6 mL.",
  },
  {
    id: "M3-Q9",
    prompt:
      "Paciente: Rx: Enalapril 1 mg/mL O.S. · Sig: II mg PO QD (2 mg PO una vez al día) · 30 días. Usa esta receta para contestar las preguntas 9 a la 13. ¿Qué cantidad dispensará?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 mL" },
      { letter: "B", text: "60 mL" },
      { letter: "C", text: "90 mL" },
      { letter: "D", text: "180 mL" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "B",
    explanation: "2 mg/día ÷ 1 mg/mL × 30 días = 60 mL.",
  },
  {
    id: "M3-Q10",
    prompt:
      "Paciente: Rx: Enalapril 1 mg/mL O.S. · Sig: II mg PO QD. ¿Cuántos mL tendrá que tomar el paciente al día?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "0.5 mL" },
      { letter: "B", text: "1 mL" },
      { letter: "C", text: "4 mL" },
      { letter: "D", text: "8 mL" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation:
      "Nota del documento fuente — la Sig “II mg” se interpreta como 4 mg/día por convención de la clase; verificar con el profesor la clave oficial.",
  },
  {
    id: "M3-Q11",
    prompt:
      "Con respecto al almacenamiento, ¿qué etiqueta colocará en la suspensión de Enalapril?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "mantener congelado" },
      { letter: "B", text: "mantener a temperatura ambiente" },
      { letter: "C", text: "mantener en el gabinete de seguridad" },
      { letter: "D", text: "mantener en el refrigerador" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "D",
    explanation: "Enalapril compounding PI · USP <795>.",
  },
  {
    id: "M3-Q12",
    prompt: "¿Qué otra etiqueta colocará?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "agitar bien antes de usar" },
      { letter: "B", text: "tomar 1 hora antes de las comidas" },
      { letter: "C", text: "tomar 1 hora después de las comidas" },
      { letter: "D", text: "A y B son correctas" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "D",
    explanation: "Enalapril PI · Allen's.",
  },
  {
    id: "M3-Q13",
    prompt: "¿Qué más proveerá con esta receta?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "adaptador press-in" },
      { letter: "B", text: "botella ámbar de dos onzas" },
      { letter: "C", text: "jeringa oral de 3 mL" },
      { letter: "D", text: "todas las anteriores" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "D",
    explanation: "AAP · ISMP Pediatric · USP <795>.",
  },
  {
    id: "M3-Q14",
    prompt:
      "Paciente: Rx: Gabapentin 100 mg/mL · Sig: 1.5 mL PO c/8 h. Usa esta receta para contestar las preguntas 14 a la 15. La cantidad a preparar para dispensar esta receta es:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "30 mL" },
      { letter: "B", text: "60 mL" },
      { letter: "C", text: "135 mL" },
      { letter: "D", text: "135 mg" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "C",
    explanation:
      "1.5 mL × 3 dosis/día = 4.5 mL/día; × 30 días = 135 mL.",
  },
  {
    id: "M3-Q15",
    prompt:
      "Paciente: Mismo paciente veterinario — misma receta. La cantidad de gabapentina por dosis que recibirá este paciente es:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "150 mg" },
      { letter: "B", text: "100 mg" },
      { letter: "C", text: "150 mL" },
      { letter: "D", text: "100 mL" },
      { letter: "E", text: "ninguna de las anteriores es correcta" },
    ],
    correctAnswer: "A",
    explanation: "1.5 mL × 100 mg/mL = 150 mg.",
  },
] as const;
