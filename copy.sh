#!/bin/sh

# copy用シェルスクリプト
# ./copy.sh /path/to/project

if [ $# -ne 1 ]; then
  echo 'args error'
  exit 1
fi

if [ -e $1 ]; then
  echo 'directory exist'
else
  echo 'directory not exist'
  exit 1
fi

dirname=`dirname $0`

rsync -ave --exclude '.DS_Store' --exclude '.git' --exclude 'copy.sh' --exclude 'node_modules' ${dirname}/ ${1}/
