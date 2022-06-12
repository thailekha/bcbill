set -eou pipefail

DIR=$(pwd)
cleanup() {
    cd $DIR
}
trap cleanup EXIT

e2e() {
    # npm_install
    # lint
    ./fablo recreate
    sleep 5
    clear_wallets
    admin
    dev
}

dev() {
    cleanup
    gnome-terminal \
        --tab -e "bash -c ' cd backend && node inspect index.js ; bash'" \
        --tab -e "bash -c ' cd web && npm start ; bash'"
}

dev_web() {
    cleanup
    gnome-terminal \
        --tab -e "bash -c ' cd web && npm start ; bash'"
}

clear_wallets() {
    rm -rf admin/wallet || true
    rm -rf backend/wallet || true
}

admin() {
    cd admin
    npm i
    node index.js customer1@gmail.com customer2@gmail.com
    cd -
}

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

backend() {
    cd backend
    node index.js
    cd -
}

lint() {
    which eslint || npm i -g eslint
    eslint admin backend chaincodes utils --fix --ext .js --config eslintrc.json
}

"$@"
