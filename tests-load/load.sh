#!/usr/bin/env bash
set -Eeuo pipefail
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

cleanup() {
  trap - SIGINT SIGTERM ERR EXIT
  cd $script_dir
  rm load.js
}

function build_img() {
  docker build -t eng-docker-registry.eng.at.caliangroup.com/library/fabric:latest -f graph/Dockerfile graph
}

function csv_row() {
  local SCENARIO_FILE="$1"
  local CLIENT_NO="$2"
  local CSV_FILE="$3"

  cp load.template.js load.js
  sed -i "s|<SCENARIO_FILE>|${SCENARIO_FILE}|g; s|<CLIENT_NO>|${CLIENT_NO}|g" load.js
  std_out=$(k6 run load.js 2>&1)
  value=$(echo "$std_out" | grep -oE 'msg="[^"]+"')
  value=${value#msg=\"}
  value=${value%\"}
  echo "$value" >> $CSV_FILE
}

function csv_files() {
  client_numbers=(1 20 40 60 80 100)
  for _case_dir in "cases"/*; do
    if [[ ! -d "$_case_dir" ]]; then
      continue
    fi

    local case_dir=$(basename $_case_dir)
    echo $case_dir

    local PLOT_DIR="graph/plot/$case_dir"
    rm -rf $PLOT_DIR || true
    mkdir -p $PLOT_DIR || true
    echo "Scenario,Clients,Avg" > $PLOT_DIR/data.csv

    for _scenario_file in "cases/$case_dir"/*; do
      if [[ ! -f "$_scenario_file" ]]; then
        continue
      fi

      for client_no in "${client_numbers[@]}"; do
        echo $client_no
        csv_row "$(realpath $_scenario_file)" "$client_no" "$PLOT_DIR/data.csv"
      done
    done

    cp graph/plot.py $PLOT_DIR/.
    cp graph/docker-compose.yml $PLOT_DIR/.
    cd $PLOT_DIR
    docker-compose up &> /dev/null
    docker-compose down &> /dev/null
    cd -
  done

  nautilus graph/plot
}

function plot() {
  csv_files
}

"$@"
