import type { Question } from "./types";

/**
 * Día 3 — Pediátrico, veterinario y BHRT.
 *
 * Banco de 15 preguntas sincronizado con la POST-PRUEBA de la presentación
 * oficial v2.3 del Lcdo. Reyes ("Day3_Basic_Compounding_Non_Sterile_2_3",
 * agosto 2026 — reemplaza el docx original).
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
 * Las explicaciones son las justificaciones del instruccional ACPE oficial
 * ("Instruccional Día #3 - revisado 07132026"), traducidas al español.
 * En Q10 prevalece la clave de la presentación v2.3 (E), que resuelve la
 * ambigüedad del "Sig: II mg" que el instruccional dejaba abierta.
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
      "La receta indica Bi-est 80/20 a 2.5 mg/G y se dispensan 35 G: 2.5 mg × 35 G = 87.5 mg totales de Bi-est. Como el estriol representa el 80% de la formulación, 80% de 87.5 mg = 70 mg de estriol.",
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
      "La receta contiene testosterona 3 mg/G en una cantidad total de 35 G: 3 mg × 35 G = 105 mg. Como 105 mg no aparece entre las opciones, la respuesta correcta es “ninguna de las anteriores”.",
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
    explanation:
      "La Sig indica aplicar 0.5 G diarios y el Topi-CLICK comúnmente dispensa 0.25 G por click: 0.5 G ÷ 0.25 G/click = 2 clicks diarios. Esto asegura una dosificación exacta y reproducible.",
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
    explanation:
      "El dispensador Microclick tiene una capacidad estándar de aproximadamente 9.5 G. Conocer la capacidad del dispositivo asegura suficiente volumen de medicamento para la dispensación y la entrega exacta de la dosis; es común en cremas hormonales.",
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
    explanation:
      "Cada microclick dispensa una cantidad pequeña y estandarizada de producto, típicamente 0.05 cc (mL). Los dispositivos de dosis estandarizada mejoran la adherencia del paciente y la consistencia de la dosis.",
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
    explanation:
      "La concentración de la formulación es 1 mg por 0.1 G, es decir 10 mg/G. Para 12 G: 10 mg/G × 12 G = 120 mg de testosterona. Así se mantiene la concentración correcta en toda la preparación.",
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
      "El propilenglicol se usa comúnmente como potenciador de penetración en formulaciones tópicas compounded para mejorar la absorción dérmica: facilita el paso del fármaco a través de la barrera cutánea y mejora el desempeño de la fórmula.",
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
    explanation:
      "Se plantea la proporción 5 mL/100 mL = x/12; despejando, x = (5 × 12) ÷ 100 = 0.6 mL. Los cálculos proporcionales correctos mantienen la consistencia de la formulación.",
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
    explanation:
      "Enalapril 1 mg/mL con Sig II mg PO QD significa 2 mg diarios, equivalentes a 2 mL diarios. Para un suplido de 30 días, la cantidad total es 2 mL × 30 días = 60 mL.",
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
    correctAnswer: "E",
    explanation:
      "La concentración es 1 mg/mL y la Sig II mg PO QD equivale a 2 mg diarios → 2 mL al día, cantidad que no aparece entre las opciones (clave oficial de la presentación v2.3).",
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
    explanation:
      "Las suspensiones orales compounded como la de enalapril frecuentemente requieren refrigeración para preservar la estabilidad y mantener la potencia. El almacenamiento correcto reduce la degradación; la etiqueta de refrigeración mejora la seguridad del medicamento.",
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
    explanation:
      "Una suspensión compounded debe llevar “agitar bien antes de usar” para asegurar la distribución uniforme del fármaco antes de administrar, y el enalapril suele recomendarse antes de las comidas para favorecer la absorción y la consistencia. Ambas etiquetas son apropiadas.",
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
    explanation:
      "La receta requiere los accesorios de dispensación apropiados: adaptador press-in, botella ámbar y jeringa oral para una dosificación exacta y una administración segura. Estos suministros mejoran la precisión, la estabilidad del medicamento y la adherencia del paciente.",
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
      "La dosis recetada es 1.5 mL cada 8 horas, es decir 3 dosis al día = 4.5 mL diarios. Para un suplido de 30 días, el volumen total es 4.5 mL × 30 días = 135 mL, que es lo que se debe preparar y dispensar.",
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
    explanation:
      "La suspensión de gabapentina tiene una concentración de 100 mg/mL y la dosis recetada es 1.5 mL: 1.5 mL × 100 mg/mL = 150 mg de gabapentina por dosis.",
  },
] as const;
