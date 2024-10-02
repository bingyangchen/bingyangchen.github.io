#!/usr/bin/env bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "master" ]; then
    printf "${RED}You're not on the correct branch. Aborting.${RESET}\n"
    exit 1
fi

if [[ -n $(git status -s) ]]; then
    printf "${YELLOW}Working directory has uncommitted changes. Aborting.${RESET}\n"
    exit 1
fi

git push origin master
npm run deploy

printf "${GREEN}Done!${RESET}\n"

set +e
