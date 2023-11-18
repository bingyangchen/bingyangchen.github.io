#!/usr/bin/env bash
if [[ -z $1 ]]; then
    echo Please provide the commit message.
else
    git add .
    git commit -m "$1"
    git push origin master
    npm run deploy
fi
