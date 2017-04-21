#!/bin/bash

for f in ../clips/*; do
    title=$(basename $f)
    outname=$title.png
    echo "$f -> $outname"

    sox $f -n remix 1 spectrogram -x 300 -y 257 -o $outname
done
read
