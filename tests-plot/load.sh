#!/usr/bin/env bash
set -Eeuo pipefail
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

function build_img() {
  docker build -t eng-docker-registry.eng.at.caliangroup.com/library/fabric:latest -f graph/Dockerfile graph
}

function load() {
  std_out=$(k6 run --quiet --no-summary --no-vu-connection-reuse k6_load.js 2>&1)
  echo $std_out
  echo $std_out | grep -oE 'VU[0-9]+_[a-zA-Z]+:[0-9.]+' | awk -F ':' '{ print $1 "," $2 }' > graph/stackedbars.csv  
}

function plot() {
  cd graph
  docker-compose up
  docker-compose down
  cd -
  nautilus graph
}

function run() {
  load
  plot
}

"$@"
