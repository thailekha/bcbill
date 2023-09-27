#!/bin/bash

set -eoux pipefail
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)
DIR=$(pwd)
cleanup() {
    cd $DIR
}
trap cleanup EXIT

SENTRY_CONF_PATH=$(realpath ~)/.apisentry

shlint() {
    docker run --rm -u "$(id -u):$(id -g)" -v "$PWD:/mnt" -w /mnt mvdan/shfmt:latest -w -i 4 main.sh
}

code_push() {
    git add -u && git commit --amend --no-edit && git push origin api-management -f
}

code_pull() {
    git fetch -v && git reset --hard origin/api-management
}

############################
# Demo screenshot (start)
############################

demo_ss_setup() {
    1peer
    clean
    protected_server
    backend_single
}

############################
# Demo screenshot (end)
############################

############################
# Load test (start)
############################

function exec_remote() {
    sshpass -p fabric ssh fabric@172.29.1.230 "export PATH=$PATH:/usr/local/bin && cd /home/fabric/work/bcbill && $1"
}

TARGET_ADDRESS="172.29.1.230"
EXPRESS_ADDRESS="172.29.2.33"
# TARGET_ADDRESS="localhost"
DIRECT_API_URL="http://$EXPRESS_ADDRESS:9998/sample-get"
PROXY_NO_FABRIC_URL="http://$TARGET_ADDRESS:9999/api/origin-server-no-fabric/sample-get"
PROXY_FABRIC_URL="http://$TARGET_ADDRESS:9999/api/origin-server-unlimited/math/sample-get"
FABRIC_FOCUS_URL="http://$TARGET_ADDRESS:9999/api/origin-server-skip-proxy/math/sample-get"

VUS_steady_load="100"
# VUS_steady_load="50"
# VUS_steady_load="20 40 80 160 320 640 1280 2560 5120"
VUS_break_dataset1="50 100 150 200 250 300 350 400 450 500"
VUS_break_dataset2="500 1000 1500 2000 2500 3000 3500 4000 4500 5000 5500 6000 6500 7000 7500 8000 8500 9000 9500 10000 10500 11000 11500 12000 12500 13000 13500 14000 14500 15000 15500 16000 16500 17000 17500 18000 18500 19000 19500 20000 20500 21000"
VUS_break_dataset3="500 1000 1500 2000 2500 3000 3500 4000 4500 5000 5500 6000 6500 7000 7500 8000 8500 9000 9500 10000 10500 11000 11500 12000 12500 13000 13500 14000 14500 15000 15500 16000 16500 17000 17500 18000 18500 19000 19500 20000 20500 21000 21500 22000 22500 23000 23500 24000 24500 25000 25500 26000 26500 27000 27500 28000 28500 29000 29500 30000"

explorer_setup() {
    1peer
    clean
    protected_server_bg
    setup_data_for_load
} 

# this does have pool
load1_setup() {
    1peer
    clean
    protected_server_bg
    setup_data_for_load
    backend_single_bg
    sleep 3
    cat /tmp/backend.log
}

load1_disable_connection_pool_setup() {
    1peer
    clean
    protected_server_bg
    setup_data_for_load
    backend_single_disable_connection_pool_bg
    sleep 3
    cat /tmp/backend.log
}

load9_roundrobin_setup() {
    9peer
    clean
    protected_server_bg
    setup_data_for_load
    backend_roundrobin_bg
    sleep 3
    cat /tmp/backend.log
}

load9_single_setup() {
    9peer
    clean
    protected_server_bg
    setup_data_for_load
    backend_single_bg
    sleep 3
    cat /tmp/backend.log
}

load9_random_setup() {
    9peer
    clean
    protected_server_bg
    setup_data_for_load
    backend_random_bg
    sleep 3
    cat /tmp/backend.log
}

1_direct_api_setup() {
    protected_server_bg
    sleep 3
}

1_direct_api_load() {
    curl "$DIRECT_API_URL"
    cd tests-plot
    ./load.sh run_steady_load 1-direct-api "$VUS_steady_load" "$DIRECT_API_URL" false
    cd -
}

2_proxy_no_fabric_setup() {
    protected_server_bg
    backend_single_bg
    sleep 3
}

2_proxy_no_fabric_load() {
    curl "$DIRECT_API_URL"
    cd tests-plot
    ./load.sh run_steady_load 2-proxy-no-fabric "$VUS_steady_load" "$PROXY_NO_FABRIC_URL" false
    cd -
}

3_proxy_fabric_setup() {
    1peer
    clean
    protected_server_bg
    setup_data_for_load
    backend_single_disable_connection_pool_bg
    sleep 3
}

3_proxy_fabric_load() {
    curl "$DIRECT_API_URL"
    cd tests-plot
    ./load.sh run_steady_load 3-proxy-fabric "$VUS_steady_load" "$PROXY_FABRIC_URL" true
    sleep 5
    ./load.sh run_break_load 3-proxy-fabric "$VUS_break_dataset1" "$PROXY_FABRIC_URL" true
    cd -
}

3a_fabric_focus_1peer_single_no_pool_setup() {
    1peer
    clean
    protected_server_bg
    setup_data_for_load
    backend_single_disable_connection_pool_bg
    sleep 3
}

3a_fabric_focus_1peer_single_no_pool_load() {
    curl "$DIRECT_API_URL"
    cd tests-plot
    ./load.sh run_steady_load 3a_fabric_focus_1peer_single_no_pool "$VUS_steady_load" "$FABRIC_FOCUS_URL" true
    sleep 5
    ./load.sh run_break_load 3a_fabric_focus_1peer_single_no_pool "$VUS_break_dataset1" "$FABRIC_FOCUS_URL" true
    cd -
}

4_fabric_focus_9peer_roundrobin_no_pool_setup() {
    9peer
    clean
    protected_server_bg
    setup_data_for_load
    backend_roundrobin_disable_connection_pool_bg
    sleep 3
}

4_fabric_focus_9peer_roundrobin_no_pool_load() {
    curl "$DIRECT_API_URL"
    cd tests-plot
    ./load.sh run_steady_load 4_fabric_focus_9peer_roundrobin_no_pool "$VUS_steady_load" "$FABRIC_FOCUS_URL" true
    sleep 5
    ./load.sh run_break_load 4_fabric_focus_9peer_roundrobin_no_pool "$VUS_break_dataset1" "$FABRIC_FOCUS_URL" true
    cd -
}

5_fabric_focus_9peer_roundrobin_with_pool_setup() {
    9peer
    clean
    protected_server_bg
    setup_data_for_load
    backend_roundrobin_bg
    sleep 3
}

5_fabric_focus_9peer_roundrobin_with_pool_load() {
    curl "$DIRECT_API_URL"
    cd tests-plot
    ./load.sh run_steady_load 5_fabric_focus_9peer_roundrobin_with_pool "$VUS_steady_load" "$FABRIC_FOCUS_URL" true
    sleep 5
    ./load.sh run_break_load 5_fabric_focus_9peer_roundrobin_with_pool "$VUS_break_dataset1" "$FABRIC_FOCUS_URL" true
    sleep 5
    ./load.sh run_break_load 5_fabric_focus_9peer_roundrobin_with_pool_5k "$VUS_break_dataset2" "$FABRIC_FOCUS_URL" true
    cd -
}

6_fabric_focus_9peer_random_with_pool_setup() {
    9peer
    clean
    protected_server_bg
    setup_data_for_load
    backend_random_bg
    sleep 3
}

6_fabric_focus_9peer_random_with_pool_load() {
    curl "$DIRECT_API_URL"
    cd tests-plot
    ./load.sh run_steady_load 6_fabric_focus_9peer_random_with_pool "$VUS_steady_load" "$FABRIC_FOCUS_URL" true
    sleep 5
    ./load.sh run_break_load 6_fabric_focus_9peer_random_with_pool "$VUS_break_dataset2" "$FABRIC_FOCUS_URL" true
    cd -
}


# ==============================================
# Experiments v2
# ==============================================

expv2_1peer_setup() {
    1peer
    clean || clean
    setup_data_for_load
    backend_single_bg
    sleep 3
    cat /tmp/backend.log
}

expv2_9peer_rr_setup() {
    9peer
    clean || clean
    setup_data_for_load
    backend_roundrobin_bg
    sleep 3
    cat /tmp/backend.log
}

expv2_no_fabric_setup() {
    clear_conf
    rm deployed-contract-version.json || true
    ./fablo prune
    docker volume prune -f
    backend_single_bg
}

expv2_case1_errorrate_1peer() {
    local RUN_NO=$1

    curl "$DIRECT_API_URL"
    cd tests-plot
    ./load.sh run_break_load expv2_case1_errorrate_1peer_run$RUN_NO "$VUS_break_dataset3" "$PROXY_FABRIC_URL" true
    cd -
}

expv2_case1_errorrate_9peer() {
    local RUN_NO=$1

    curl "$DIRECT_API_URL"
    cd tests-plot
    ./load.sh run_break_load expv2_case1_errorrate_9peer_roundrobin_run$RUN_NO "$VUS_break_dataset3" "$PROXY_FABRIC_URL" true
    cd -
}

expv2_case2_latency_1peer() {
    local RUN_NO=$1

    curl "$DIRECT_API_URL"
    cd tests-plot
    ./load.sh run_steady_load expv2_case2_latency_constantvu_1peer_run$RUN_NO "$VUS_steady_load" "$PROXY_FABRIC_URL" true
    cd -
}

expv2_case2_latency_9peer() {
    local RUN_NO=$1

    curl "$DIRECT_API_URL"
    cd tests-plot
    ./load.sh run_steady_load expv2_case2_latency_ramping_9peer_16cpu_run$RUN_NO "$VUS_steady_load" "$PROXY_FABRIC_URL" true
    cd -
}

expv2_case2_latency_nofabric() {
    curl "$DIRECT_API_URL"
    cd tests-plot
    ./load.sh run_steady_load expv2_case2_latency_nofabric "$VUS_steady_load" "$PROXY_NO_FABRIC_URL" false
    cd -
}

load() {
    # exec_remote "./main.sh load1_disable_connection_pool_setup"
    # do_load "1peer-no-pool"
    # exec_remote "./main.sh 1_direct_api_setup"
    # 1_direct_api_load
    # exec_remote "./main.sh 2_proxy_no_fabric_setup"
    # 2_proxy_no_fabric_load
    # exec_remote "./main.sh 3_proxy_fabric_setup"
    # 3_proxy_fabric_load

    # exec_remote "./main.sh 3a_fabric_focus_1peer_single_no_pool_setup"
    # 3a_fabric_focus_1peer_single_no_pool_load

    # exec_remote "./main.sh 4_fabric_focus_9peer_roundrobin_no_pool_setup"
    # 4_fabric_focus_9peer_roundrobin_no_pool_load
    # exec_remote "./main.sh 5_fabric_focus_9peer_roundrobin_with_pool_setup"
    # 5_fabric_focus_9peer_roundrobin_with_pool_load
    # exec_remote "./main.sh 6_fabric_focus_9peer_random_with_pool_setup"
    # 6_fabric_focus_9peer_random_with_pool_load

    # exp v2

    # exec_remote "./main.sh expv2_no_fabric_setup"
    # 1_direct_api_load
    # exec_remote "./main.sh expv2_1peer_setup"
    expv2_case2_latency_1peer "1"
    # expv2_case2_latency_nofabric

    # exec_remote "./main.sh expv2_1peer_setup"
    # expv2_case1_errorrate_1peer "1"

    # exec_remote "./main.sh expv2_9peer_rr_setup"
    # expv2_case1_errorrate_9peer "1"
    # exec_remote "./main.sh expv2_9peer_rr_setup"
    # expv2_case1_errorrate_9peer "2"
    # exec_remote "./main.sh expv2_9peer_rr_setup"
    # expv2_case1_errorrate_9peer "3"
}

setup_data_for_load() {
    cd tests
    kill_port 9999
    PEER_SELECT='SINGLE' npm run setup-for-load
    cd -
}

############################
# Load test (end)
############################

############################
# Demo tasks (start)
############################

dev() {
    clean
    cd tests
    PEER_SELECT='SINGLE' npm run setup-for-dev
    cd -
}

start_components() {
    protected_server
    backend_single
    frontend_main "customer"
    frontend_second "staff"
    # expose
}

############################
# Demo tasks (end)
############################

############################
# Automated test (start)
############################

pretest_setup() {
    clean
    protected_server
    #    terminal_window "cd /home/vagrant/work/bcbill/fablo-target/fabric-docker && docker-compose logs -f peer0.org1.example.com"
}

test() {
    clean
    protected_server
    log
    cd tests
    PEER_SELECT='SINGLE' npm run test
    cd -
}

rerun_test() {
    newcontr
    cd tests
    PEER_SELECT='SINGLE' npm run test
    cd -
}

############################
# Automated test (end)
############################

############################
# Servers (start)
############################

# the react instance created from the "web" folder can be used for breakpoint debugging
frontend_main() {
    ROLE=$1
    terminal_tab "cd web && PORT=3000 npm run $ROLE"
}

frontend_second() {
    ROLE=$1
    rm -rf web-second-instance || true
    cp -rf web web-second-instance
    terminal_tab "cd web-second-instance && PORT=3001 npm run $ROLE"
}

kill_port() {
    PORT=$1
    if lsof -i :$PORT >/dev/null; then
        kill $(lsof -t -i :$PORT)
    fi
}

backend_single() {
    kill_port 9999
    terminal_tab "cd backend && PEER_SELECT='SINGLE' npm run dev"
}

backend_single_disable_connection_pool() {
    kill_port 9999
    terminal_tab "cd backend && PEER_SELECT='SINGLE' DISABLE_GATEWAY_CONNECTION_POOL=true npm run dev"
}

backend_roundrobin() {
    kill_port 9999
    terminal_tab "cd backend && PEER_SELECT='ROUND_ROBIN' npm run dev"
}

backend_random() {
    kill_port 9999
    terminal_tab "cd backend && PEER_SELECT='RANDOM' npm run dev"
}

backend_single_bg() {
    kill_port 9999
    cd /home/fabric/work/bcbill/backend
    export PEER_SELECT='SINGLE'
    nohup npm run dev > /tmp/backend.log 2>&1 &
    cd -
}

backend_single_disable_connection_pool_bg() {
    kill_port 9999
    cd /home/fabric/work/bcbill/backend
    export PEER_SELECT='SINGLE'
    export DISABLE_GATEWAY_CONNECTION_POOL=true
    nohup npm run dev > /tmp/backend.log 2>&1 &
    cd -
}

backend_roundrobin_bg() {
    kill_port 9999
    cd /home/fabric/work/bcbill/backend
    export PEER_SELECT='ROUND_ROBIN'
    nohup npm run dev > /tmp/backend.log 2>&1 &
    cd -
}

backend_roundrobin_disable_connection_pool_bg() {
    kill_port 9999
    cd /home/fabric/work/bcbill/backend
    export PEER_SELECT='ROUND_ROBIN'
    export DISABLE_GATEWAY_CONNECTION_POOL=true
    nohup npm run dev > /tmp/backend.log 2>&1 &
    cd -
}

backend_random_bg() {
    kill_port 9999
    cd /home/fabric/work/bcbill/backend
    export PEER_SELECT='RANDOM'
    nohup npm run dev > /tmp/backend.log 2>&1 &
    cd -
}

protected_server() {
    kill_port 9998
    terminal_tab "cd /home/fabric/work/bcbill/protected-server && node bin/www"
}

protected_server_bg() {
    kill_port 9998
    cd /home/fabric/work/bcbill/protected-server
    nohup node bin/www > /dev/null 2>&1 &
    cd -
}

############################
# Servers (end)
############################

############################
# Hyperledger stuff (start)
############################

1peer() {
    cp fabloconfigs/1peer.json fablo-config.json
}

9peer() {
    cp fabloconfigs/9peers.json fablo-config.json
}

clean() {
    clear_conf
    rm deployed-contract-version.json || true
    ./fablo prune
    docker volume prune -f
    ./fablo recreate
    sleep 10
    setup_conf
    echo '{"version":1}' >deployed-contract-version.json
}

setup_conf() {
    mkdir $SENTRY_CONF_PATH || true
    mkdir $SENTRY_CONF_PATH/wallet || true
    cp fablo-target/fabric-config/connection-profiles/connection-profile-org1.json $SENTRY_CONF_PATH/.
    ls $SENTRY_CONF_PATH

    rm -rf .env || true
    echo "FABRIC_CONNECTION_PROFILE=$SENTRY_CONF_PATH/connection-profile-org1.json" >>.env
    echo "WALLET_PATH=$SENTRY_CONF_PATH/wallet" >>.env
    echo "FABRIC_ROOT_ID=admin" >>.env
    echo "FABRIC_ROOT_PW=adminpw" >>.env
    echo "FABRIC_MSP=Org1MSP" >>.env
    echo "FABRIC_CA_HOST=ca.org1.example.com" >>.env

    node utils/rootCredentials.js
}

clear_conf() {
    rm -rf $SENTRY_CONF_PATH || true
    rm -rf $SCRIPT_DIR/tests/runNo.json || true
}

newcontr() {
    increment_version
    ./fablo chaincode upgrade chaincode1 0.0.$(cat deployed-contract-version.json | jq -r '.version')
}

increment_version() {
    jq '.version += 1' deployed-contract-version.json | sponge deployed-contract-version.json
}

log() {
    terminal_window "cd /home/vagrant/work/bcbill/fablo-target/fabric-docker && docker-compose logs -f peer0.org1.example.com"
    #    terminal_window "cd /home/vagrant/work/bcbill/fablo-target/fabric-docker && docker-compose logs -f peer1.org1.example.com"
}

############################
# Hyperledger stuff (end)
############################

############################
# NPM stuff (start)
############################

npm_install() {
    cd utils && npm i
    cd -
    cd chaincodes/chaincode-kv-node && npm i
    cd -
    cd web && npm i
    cd -
    cd backend && npm i
    cd -
}

lint() {
    which eslint || npm i -g eslint
    eslint protected-server backend chaincodes utils tests tests-plot --fix --ext .js --config eslintrc.json
}

############################
# NPM stuff (end)
############################

############################
# Cloud (start)
############################

expose() {
    gnome-terminal \
        --tab -e "lt --subdomain customer --port 3000" \
        --tab -e "lt --subdomain staff --port 3001" \
        --tab -e "lt --subdomain thebackend --port 9999"
}

############################
# Cloud (end)
############################

############################
# Playground (start)
############################

# start protected server

playground() {
    protected_server
    terminal_tab "cd /home/vagrant/work/bcbill/playground-scripts/js-scripts && node proxy.js"
}

############################
# Playground (end)
############################

############################
# Utils (start)
############################

terminal_tab() {
    command=$1
    gnome-terminal --tab -e "bash -c ' ${command} ; bash'"
}

terminal_window() {
    command=$1
    gnome-terminal -e "bash -c ' ${command} ; bash'"
}

browser() {
    #    sleep 8
    firefox "localhost:3000/#/login" &
    firefox "localhost:3001/#/login" --private-window &
}

############################
# Utils (end)
############################

"$@"
