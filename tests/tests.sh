#!/usr/bin/env bash
set -Eeuo pipefail
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

cleanup() {
  trap - SIGINT SIGTERM ERR EXIT
  cd $script_dir
}

function run_load() {
  local CLIENT_NO=$1
  cp $script_dir/load.template.js $script_dir/load.js
  sed -i "s/<CLIENT_NO>/${CLIENT_NO}/g" $script_dir/load.js
  std_out=$(k6 run $script_dir/load.js 2>&1)
  value=$(echo "$std_out" | grep -oE 'msg="[^"]+"')
  value=${value#msg=\"}
  value=${value%\"}
  echo "$value" >> graph/data.csv
}

function load() {
  rm graph/*.csv || true
  echo "Clients,Avg" > graph/data.csv
  client_numbers=(1 30 60 120 240 480)
  for client_no in "${client_numbers[@]}"; do
    run_load "$client_no"
  done
  cd graph
  docker-compose up
  nautilus .
}

"$@"
