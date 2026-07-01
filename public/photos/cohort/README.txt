First-cohort photos for the "El primer cohorte" homepage carousel
(src/components/marketing/ConfianzaCarousel.tsx).

The carousel maps these filenames, in order, to the captions in
src/messages/{en,es}.json → confianzaCarousel.captions (edit captions
there; keep the two arrays the same length as this list):

  01-grupo.jpg          — full first-cohort group shot (shown first)
  02-laboratorio.jpg    — wide lab / instruction shot
  03-instruccion.jpg    — instructor teaching at the whiteboard
  04-duo.jpg            — two graduates with certificates
  05-estudiante.jpg … 13-estudiante.jpg — individual graduate portraits

Any aspect ratio is fine — the carousel blurs a copy of each image as a
backdrop and shows the original object-contain on top. To add/remove
photos: drop the file here, update the PHOTOS array in ConfianzaCarousel
and add/remove a matching caption in both message files.
