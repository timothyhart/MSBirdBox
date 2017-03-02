#!/bin/bash
SCRIPTNAME=$(readlink -e "$0")
SCRIPTDIR=$(dirname "$SCRIPTNAME")

cd $SCRIPTDIR
echo $SCRIPTDIR

DEBUG=birdbox-learning-module-statserver nodejs ./server.js
read