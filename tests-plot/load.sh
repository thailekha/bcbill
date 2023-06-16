#!/usr/bin/env bash
set -Eeuo pipefail
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

function build_img() {
  docker build -t eng-docker-registry.eng.at.caliangroup.com/library/fabric:latest -f graph/Dockerfile graph
}

function load() {
  get_wallets
  monitor_memory_thread &
  monitor_pid=$!
  echo pid $monitor_pid
  std_out=$(k6 run --quiet --no-summary --no-vu-connection-reuse k6_load.js 2>&1)
  echo $std_out
  echo $std_out | grep -oE 'VU[0-9]+_[a-zA-Z]+:[0-9.]+' | awk -F ':' '{ print $1 "," $2 }' > graph/stackedbars.csv
  kill $monitor_pid
}

function clean() {
  rm graph/*.csv
  rm graph/*.png
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

function run() {
  load
  plot
}

"$@"
