First-cohort photos for the "El primer cohorte" homepage carousel
(src/components/marketing/ConfianzaCarousel.tsx).

The carousel maps these filenames, in order, to the captions in
src/messages/{en,es}.json → confianzaCarousel.captions (keep both arrays
the same length as this list). Order: group first, then one photo per
distinct student (NO repeats), then the lab/instruction shots last.

  01-grupo.jpg                         — full first-cohort group shot (shown first)
  02-estudiante.jpg … 11-estudiante.jpg — individual graduate portraits (one per student)
  12-laboratorio.jpg                   — wide lab / instruction shot
  13-instruccion.jpg                   — instructor teaching at the whiteboard

Any aspect ratio is fine — the carousel blurs a copy of each image as a
backdrop and shows the original object-contain on top. To add/remove
photos: drop the file here, update the PHOTOS array in ConfianzaCarousel,
and add/remove a matching caption in both message files.
