#!/bin/bash

SCRIPTNAME=$(readlink -e "$0")
SCRIPTDIR=$(dirname "$SCRIPTNAME")

cd $SCRIPTDIR
read

DEBUG=birdbox-recorder-controller nodejs ./server.js

read