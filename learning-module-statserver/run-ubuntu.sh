#!/bin/sh

SCRIPTNAME=$(readlink -e "$0")
SCRIPTDIR=$(dirname "$SCRIPTNAME")

cd $SCRIPTDIR

DEBUG=birdbox-learning-module-statserver nodejs ./server.js

