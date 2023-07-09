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

function monitor_hardware() {
    monitor_memory_thread &
    monitor_pid=$!
    echo $monitor_pid
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

function clean() {
  rm graph/*.csv || true
  rm graph/*.png || true
}

# ===========================================================

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
  local ITER_BASED=$2
  clean
  if $ITER_BASED; then
    load_iteration_based "$VU_NUM"
  else
    load_steady "$VU_NUM"
  fi
  plot
  commit_vu_case "vu_$VU_NUM"
}

# ===========================================================

function load_iteration_based() {
  local VU_NUM=$1
  cp k6_iteration_based.template.js k6_load.js
  sed -i "s/<VU_NUM_HERE>/$VU_NUM/g" k6_load.js
  get_wallets_local
  std_out=$(k6 run --quiet --no-summary --no-vu-connection-reuse k6_load.js 2>&1)
  echo $std_out
  echo $std_out | grep -oE 'VU[0-9]+_[a-zA-Z]+:[0-9.]+' | awk -F ':' '{ print $1 "," $2 }' > graph/bars.csv
}

function load_steady() {
  local VU_NUM=$1
  cp k6_steady_load.template.js k6_load.js
  sed -i "s/<VU_NUM_HERE>/$VU_NUM/g" k6_load.js
  get_wallets_local
  echo "VU,iteration,latency" > graph/lines.csv
  std_out=$(k6 run --quiet --no-summary --no-vu-connection-reuse k6_load.js 2>&1)
  echo $std_out | grep -Eo 'VU([0-9]+)_([0-9]+):([0-9.]+)' | awk -F '[_:]' '{ printf "%s,%s,%s\n", substr($1, 3), $2, $3 }' >> graph/lines.csv
}

function run_iteration_based() {
  PEER_CASE=$1
  ITER_CASE="$PEER_CASE/iteration-based"
  mkdir -p $ITER_CASE
  for num in 10 50 100 130 150 170 ; do
    run_vu_case "$num" true
    sleep 5
  done
  mv vu_* $ITER_CASE/.
}

function run_steady_load() {
  PEER_CASE=$1
  STEADY_CASE="$PEER_CASE/steady-load"
  mkdir -p $STEADY_CASE
#  for num in 1 2 3 4 5 6 7 8 9 ; do
  for num in 100 ; do
    run_vu_case "$num" false
    sleep 5
  done
  mv vu_* $STEADY_CASE/.
}

function run_break_load() {
  PEER_CASE=$1
  BREAK_CASE="$PEER_CASE/break-load"
  mkdir -p $BREAK_CASE
  # for num in 1 4000 4500 5000 5500 6000 ; do
  for num in 1 800 1600 3200 3800 4000 4500 5000 6000 ; do
    cp k6_break.template.js k6_load.js
    sed -i "s/<VU_NUM_HERE>/$num/g" k6_load.js
    get_wallets_local
    k6 run k6_load.js &> $num.txt || true
    sleep 5
    mv $num.txt $BREAK_CASE/.
  done
}

function run() {
  PEER_CASE=$1
  rm -rf $PEER_CASE || true
#  run_iteration_based $PEER_CASE
  # run_steady_load $PEER_CASE
  run_break_load $PEER_CASE
}

function test() {
  get_wallets_local
  k6 run --no-vu-connection-reuse k6_load.js
}

"$@"
