set -eou pipefail

DIR=$(pwd)
cleanup() {
    cd $DIR
}
trap cleanup EXIT

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
    admin
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
    admin
    protected_server
    terminal_window
    gnome-terminal -e "bash -c 'cd /home/vagrant/work/bcbill/fablo-target/fabric-docker && docker-compose logs -f peer0.org1.example.com'"
}

test() {
    clean
    admin
    protected_server
    org1_container_log
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
    clear_wallets
    rm deployed-contract-version.json || true
    compile_contract
    ./fablo recreate
    sleep 5
    echo '{"version":1}' > deployed-contract-version.json
}

clear_wallets() {
    rm -rf admin/secret*.json || true
    rm -rf admin/wallet || true
    rm -rf admin/wallet1 || true
    rm -rf admin/wallet2 || true
    rm -rf backend/wallet || true
    rm -rf backend/wallet1 || true
    rm -rf backend/wallet2 || true
    rm -rf tests/wallets.json || true

    rm -rf tests/runNo.json || true
}

admin() {
    cd admin
    node admin1.js customer1@org1.com customer2@org1.com
    node admin2.js staff1@org2.com staff2@org2.com
    jq -s '.[0] * .[1]' secret1.json secret2.json > secrets.json
    cd -
}

compile_contract() {
    cd chaincodes/chaincode-kv-ts
    npm run compile
    cd -
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
}

org2_container_log() {
    terminal_window "cd /home/vagrant/work/bcbill/fablo-target/fabric-docker && docker-compose logs -f peer0.org2.example.com"
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
    cd admin && npm i
    cd -
    cd web && npm i
    cd -
    cd backend && npm i
    cd -
}

lint() {
    which eslint || npm i -g eslint
    eslint protected-server admin backend chaincodes utils tests --fix --ext .js --config eslintrc.json
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
