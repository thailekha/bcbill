#!/bin/bash

set -eoux pipefail
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)
DIR=$(pwd)
cleanup() {
    cd $DIR
}
trap cleanup EXIT

SENTRY_CONF_PATH=$(realpath ~)/.apisentry

############################
# Empty network (start)
############################

############################
# Empty network (end)
############################

############################
# Demo tasks (start)
############################

dev() {
    clean
    cd tests
    npm run setup-for-dev
    cd -
    start_components
}

start_components() {
    protected_server
    backend
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
#    org1_container_log
    cd tests
    npm run test
    cd -
}

rerun_test() {
    newcontr
    cd tests
    npm run test
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

backend() {
    terminal_tab "cd backend && npm run dev"
}

protected_server() {
    terminal_tab "cd /home/vagrant/work/bcbill/protected-server && node bin/www"
}

############################
# Servers (end)
############################

############################
# Hyperledger stuff (start)
############################

clean() {
    clear_conf
    rm deployed-contract-version.json || true
    ./fablo recreate
    sleep 5
    setup_conf
    echo '{"version":1}' > deployed-contract-version.json
}

setup_conf() {
    mkdir $SENTRY_CONF_PATH || true
    mkdir $SENTRY_CONF_PATH/wallet || true
    cp fablo-target/fabric-config/connection-profiles/connection-profile-org1.json $SENTRY_CONF_PATH/.
    ls $SENTRY_CONF_PATH

    rm -rf .env || true
    echo "FABRIC_CONNECTION_PROFILE=$SENTRY_CONF_PATH/connection-profile-org1.json" >> .env
    echo "WALLET_PATH=$SENTRY_CONF_PATH/wallet" >> .env
    echo "FABRIC_ROOT_ID=admin" >> .env
    echo "FABRIC_ROOT_PW=adminpw" >> .env
    echo "FABRIC_MSP=Org1MSP" >> .env
    echo "FABRIC_CA_HOST=ca.org1.example.com" >> .env

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

org1_container_log() {
    terminal_window "cd /home/vagrant/work/bcbill/fablo-target/fabric-docker && docker-compose logs -f peer0.org1.example.com"
    terminal_window "cd /home/vagrant/work/bcbill/fablo-target/fabric-docker && docker-compose logs -f peer1.org1.example.com"
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
    eslint protected-server backend chaincodes utils tests --fix --ext .js --config eslintrc.json
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
