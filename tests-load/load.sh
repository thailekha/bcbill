#!/usr/bin/env bash
set -Eeuo pipefail
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

cleanup() {
  trap - SIGINT SIGTERM ERR EXIT
  cd $script_dir
  rm load.js
}

function csv_row() {
  local CASE_NO=$1
  local CLIENT_NO=$2
  local CSV_FILE=$3
  cp $script_dir/templates/load.template.js $script_dir/load.js
  sed -i "s/<CASE_NO>/${CASE_NO}/g; s/<CLIENT_NO>/${CLIENT_NO}/g" $script_dir/load.js
  std_out=$(k6 run $script_dir/load.js 2>&1)
  value=$(echo "$std_out" | grep -oE 'msg="[^"]+"')
  value=${value#msg=\"}
  value=${value%\"}
  echo "$value" >> graph/plot/$CSV_FILE
}

function load() {
  rm -rf graph/plot/* || true
  mkdir -p graph/plot || true
  echo "Scenario,Clients,Avg" > graph/plot/data.csv
  cases=(1 2 3)
  for case_no in "${cases[@]}"; do
    # client_numbers=(1 20 40 80 100 120 140 180 200 220 240 280 300)
    # client_numbers=(1 20 40 80 100 120 140 180 200 220)
    client_numbers=(1 2)
    for client_no in "${client_numbers[@]}"; do
      csv_row "$case_no" "$client_no" "data.csv"
    done
  done
  cat graph/plot/data.csv
  cd graph
  docker-compose up
  nautilus .
}

build_img() {
  docker build -t eng-docker-registry.eng.at.caliangroup.com/library/fabric:latest -f graph/Dockerfile graph
}

"$@"
