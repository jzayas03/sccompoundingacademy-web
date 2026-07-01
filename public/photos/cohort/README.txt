First-cohort photos for the "El primer cohorte" homepage carousel
(src/components/marketing/ConfianzaCarousel.tsx).

Drop the real photos here with EXACTLY these filenames — the carousel
maps each to its caption in that order (missing files are hidden
automatically, so you can add fewer than 7):

  01-grupo.jpg         → "The full first cohort, alongside instructor Jorge L. Reyes"
  02-laboratorio.jpg   → "Instruction in the Santa Cruz Pharma Care laboratory, Bayamón"
  03-graduacion.jpg    → "Certificates of completion in hand"
  04-graduacion.jpg    → "The academy's first generation of graduates"
  05-graduacion.jpg    → "Recognition after 18 hours of supervised practice"
  06-graduacion.jpg    → "Certificate presentation for the first cohort"
  07-graduacion.jpg    → "Celebrating the first group of graduates"

Any aspect ratio is fine — the carousel blurs a copy of each image as a
backdrop and shows the original object-contain on top. Captions are
editable in src/messages/{en,es}.json → confianzaCarousel.captions.
