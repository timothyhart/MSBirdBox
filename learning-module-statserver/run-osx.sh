#!/bin/sh

SCRIPTNAME=$(readlink "$0")
SCRIPTDIR=$(dirname "$SCRIPTNAME")

cd $SCRIPTDIR

DEBUG=birdbox-learning-module-statserver node ./server.js

