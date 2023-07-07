#!/usr/bin/env bash
set -Eeuox pipefail
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

function scp_from_remote() {
  sshpass -p fabric scp -r fabric@172.29.1.230:"$1" "$2"
}

function exec_remote() {
  sshpass -p fabric ssh fabric@172.29.1.230 "$1"
}

function free_mem_remote() {
  exec_remote 'free' | awk 'NR==2{printf "%.2f%%\n", $4*100/($3+$4)}'
}

function free_mem_local() {
  free | awk 'NR==2{printf "%.2f%%\n", $4*100/($3+$4)}'
}

function monitor_memory_thread() {
  csv_file="graph/memory_stats.csv"
  function write_to_csv() {
    echo "$timestamp,$local_mem,$remote_mem" >> "$csv_file"
  }
  echo "Timestamp,Local Memory (%),Remote Memory (%)" > "$csv_file"
  while true; do
    local_mem=$(free_mem_local)
    remote_mem=$(free_mem_remote)
    timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    write_to_csv
    sleep 0.5
  done
}

# ===========================================================

function get_wallets() {
  scp_from_remote "/home/fabric/work/bcbill/tests/loadtest-data.json" "/tmp/loadtest-data.json"
}

function get_wallets_local() {
  cp -rf "/home/fabric/work/bcbill/tests/loadtest-data.json" "/tmp/loadtest-data.json"
}

function build_img() {
  docker build -t eng-docker-registry.eng.at.caliangroup.com/library/fabric:latest -f graph/Dockerfile graph
}

function load() {
  local VU_NUM=$1
  cp k6_load.template.js k6_load.js
  sed -i "s/<VU_NUM_HERE>/$VU_NUM/g" k6_load.js
  get_wallets_local
#  monitor_memory_thread &
#  monitor_pid=$!
#  echo pid $monitor_pid
#  trap "kill $monitor_pid" RETURN
  std_out=$(k6 run --quiet --no-summary --no-vu-connection-reuse k6_load.js 2>&1)
  echo $std_out
  echo $std_out | grep -oE 'VU[0-9]+_[a-zA-Z]+:[0-9.]+' | awk -F ':' '{ print $1 "," $2 }' > graph/stackedbars.csv
}

function clean() {
  rm graph/*.csv || true
  rm graph/*.png || true
}

function test() {
  k6 run --no-vu-connection-reuse k6_load.js
}

function plot() {
  cd graph
  docker-compose up
  docker-compose down
  cd -
}

function commit_vu_case() {
  local case_name=$1
  rm -rf $case_name || true
  mkdir $case_name
  mv graph/*.csv $case_name/.
  mv graph/*.png $case_name/.
}

function run_vu_case() {
  local VU_NUM=$1
  clean
  load "$VU_NUM"
  plot
  commit_vu_case "vu_$VU_NUM"
}

function run() {
  PEER_CASE=$1
  mkdir $PEER_CASE
  for num in 10 50 100 130 150 170 ; do
    run_vu_case "$num"
    sleep 5
  done
  mv vu_* $PEER_CASE/.
}

"$@"
