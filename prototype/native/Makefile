CC=cc
CFLAGS=-O2

all: prepare waveform

prepare:
	mkdir -p bin

waveform:
	$(CC) -o bin/waveform waveform.c -lavformat -lavcodec -lpng -lavutil -lm

clean:
	rm -f bin/waveform


