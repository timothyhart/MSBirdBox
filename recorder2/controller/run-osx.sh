#!/bin/sh

SCRIPTNAME=$(readlink "$0")
SCRIPTDIR=$(dirname "$SCRIPTNAME")

cd $SCRIPTDIR

DEBUG=birdbox-recorder-controller node ./server.js

