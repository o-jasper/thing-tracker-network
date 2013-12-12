#!/bin/bash
if [ -e node_modules/ -o "$NODE_PATH" != "" ]; then
    node validate.js $1 $2
else
    echo 'Dont have the node.js libraries needed, either:'
    echo '* set $NODE_PATH to somewhere the modules are already present.'
    echo '* make node_modules/'
    echo '* run `npm install schema schema-validator`(previous does that.)'
fi

