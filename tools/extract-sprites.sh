#!/usr/bin/env bash
#
# Extracts the in-game sprites from Giulio's scanned notebook (jump-boss.pdf).
#
#   npm run sprites            regenerate all sprites into public/assets/sprites/
#   npm run sprites -- --sheet also build a contact-sheet.png for visual QA
#
# Pipeline per sprite:
#   1. render the PDF page at 150 DPI (cached in build/pages/)
#   2. flat-field correction: divide the page by a blurred copy of itself, then
#      re-stretch contrast — evens out the photo lighting so the paper is white
#      (Divide_Dst is the empirically correct direction; Divide_Src inverts)
#   3. crop the sprite region — coordinates are FRACTIONS of the page size so
#      they survive DPI changes; the crop table below is the tunable surface
#   4. make near-white transparent (per-sprite fuzz), auto-trim, cap height
set -euo pipefail
cd "$(dirname "$0")/.."

DPI=150
RAW=build/pages
OUT=public/assets/sprites
mkdir -p "$RAW" "$OUT"

if [ ! -f "$RAW/page-1.png" ]; then
  echo "Rendering PDF pages at ${DPI} DPI..."
  pdftoppm -png -r "$DPI" jump-boss.pdf "$RAW/page"
fi

for p in "$RAW"/page-[0-9].png; do
  norm="${p%.png}-norm.png"
  if [ ! -f "$norm" ]; then
    echo "Normalizing lighting: $(basename "$p")"
    magick "$p" \( +clone -blur 0x40 \) -compose Divide_Dst -composite -normalize "$norm"
  fi
done

# crop NAME PAGE FX FY FW FH MAXH [FUZZ] [ERASE]
#   FX FY FW FH: crop rectangle as fractions of page width/height (origin top-left)
#   MAXH: output max height in px (only shrinks)
#   FUZZ: %-distance from white treated as transparent (default 14; lower keeps
#         faint pencil, higher kills more ruled lines). 'opaque' skips the
#         transparency + trim entirely — used for the body-texture swatches,
#         which must stay solid so the player body has no holes.
#   ERASE: optional 'fx,fy,fw,fh' rectangles (page fractions, ';'-separated)
#          painted white before transparency — removes captions/neighbouring
#          drawings that intrude into the crop.
crop() {
  local name=$1 page=$2 fx=$3 fy=$4 fw=$5 fh=$6 maxh=$7 fuzz=${8:-14} erase=${9:-}
  local src="$RAW/page-$page-norm.png"
  local W H X Y CW CH
  W=$(magick identify -format '%w' "$src")
  H=$(magick identify -format '%h' "$src")
  X=$(awk "BEGIN{printf \"%d\", $fx*$W}")
  Y=$(awk "BEGIN{printf \"%d\", $fy*$H}")
  CW=$(awk "BEGIN{printf \"%d\", $fw*$W}")
  CH=$(awk "BEGIN{printf \"%d\", $fh*$H}")

  local erase_args=()
  if [ -n "$erase" ]; then
    erase_args=(-fill white)
    local rect efx efy efw efh EX1 EY1 EX2 EY2
    IFS=';' read -ra rects <<<"$erase"
    for rect in "${rects[@]}"; do
      IFS=',' read -r efx efy efw efh <<<"$rect"
      # erase rect in cropped-image coordinates
      EX1=$(awk "BEGIN{printf \"%d\", $efx*$W-$X}")
      EY1=$(awk "BEGIN{printf \"%d\", $efy*$H-$Y}")
      EX2=$(awk "BEGIN{printf \"%d\", ($efx+$efw)*$W-$X}")
      EY2=$(awk "BEGIN{printf \"%d\", ($efy+$efh)*$H-$Y}")
      erase_args+=(-draw "rectangle $EX1,$EY1 $EX2,$EY2")
    done
  fi

  if [ "$fuzz" = "opaque" ]; then
    magick "$src" -crop "${CW}x${CH}+${X}+${Y}" +repage \
      "${erase_args[@]}" \
      -resize "x${maxh}>" \
      "PNG32:$OUT/$name.png"
  else
    magick "$src" -crop "${CW}x${CH}+${X}+${Y}" +repage \
      "${erase_args[@]}" \
      -fuzz "${fuzz}%" -transparent white \
      -trim +repage \
      -resize "x${maxh}>" \
      "PNG32:$OUT/$name.png"
  fi
  echo "  $name.png"
}

echo "Extracting sprites..."

# Note: the pencil annotations on the pages (the "pick eyes…" note, the
# power-up labels, the victory caption) are Adrian's notes, not Giulio's art —
# they are intentionally not extracted; the game renders proper text instead.

# ---- page 1: title + character selection ----------------------------------
crop title-logo      1 0.08 0.02 0.68 0.11 220
crop eye             1 0.435 0.290 0.040 0.044 80
crop swatch-purple   1 0.18 0.42 0.33 0.060 256 opaque
crop swatch-orange   1 0.635 0.41 0.045 0.09 256 opaque
crop swatch-red      1 0.18 0.51 0.36 0.050 256 opaque
crop swatch-stripes  1 0.175 0.59 0.20 0.09 256 opaque
crop swatch-spots    1 0.43 0.59 0.19 0.08 256 opaque
crop legs            1 0.26 0.725 0.40 0.19 200

# ---- page 2: power-up doodles + handwriting labels ------------------------
crop icon-bigjump    2 0.13 0.03 0.42 0.27 128
crop icon-speed      2 0.15 0.31 0.36 0.22 128
crop icon-x          2 0.18 0.52 0.30 0.20 128
crop icon-special    2 0.20 0.79 0.16 0.13 128

# ---- pages 3-6: the monsters ----------------------------------------------
crop boss-a          3 0.03 0.02 0.87 0.825 512
crop boss-b          4 0.01 0.02 0.96 0.80 512
crop knife           4 0.00 0.30 0.20 0.17 96
# Huggie's page has a hand-drawn frame around it; the erase strips follow the
# frame's slant (left border) and its top/bottom runs, plus the star drawing.
crop boss-huggie     5 0.13 0.06 0.62 0.83 560 14 '0.585,0.44,0.42,0.30;0.13,0.04,0.13,0.27;0.13,0.31,0.095,0.34;0.10,0.65,0.085,0.27;0.24,0.06,0.36,0.055;0.10,0.885,0.65,0.06'
crop star            5 0.60 0.46 0.29 0.26 112
crop boss-mayhem     6 0.02 0.26 0.88 0.70 560 14 0.70,0.85,0.28,0.13

# ---- pages 7-8: RIP + victory ---------------------------------------------
crop tombstone       7 0.20 0.28 0.55 0.66 480
crop trophy          8 0.06 0.24 0.84 0.56 440
crop victory-lettering 8 0.02 0.02 0.66 0.10 160

if [ "${1:-}" = "--sheet" ]; then
  echo "Building contact sheet..."
  rm -f "$OUT/contact-sheet.png"
  magick montage "$OUT"/*.png -background '#f7f4ea' -tile 6x -geometry '200x200+8+8>' \
    -label '%f' "$OUT/contact-sheet.png"
fi

echo "Done: $(ls "$OUT" | grep -cv contact-sheet) sprites in $OUT"
