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
    debug
}

dev() {
    cleanup
    gnome-terminal \
        --tab -e "bash -c ' cd backend && npm run dev ; bash'" \
        --tab -e "bash -c ' cd web && npm start ; bash'"
        # --tab -e "bash -c ' cd fablo-target/fabric-docker && docker-compose logs -f ; bash'"
}

debug() {
    cleanup
    gnome-terminal \
        --tab -e "bash -c ' cd backend && node inspect index.js ; bash'" \
        --tab -e "bash -c ' cd web && npm start ; bash'"
        # --tab -e "bash -c ' cd fablo-target/fabric-docker && docker-compose logs -f ; bash'"
}

dev_web() {
    cleanup
    gnome-terminal \
        --tab -e "bash -c ' cd web && npm start ; bash'"
}

clear_wallets() {
    rm -rf admin/wallet || true
    rm -rf admin/wallet1 || true
    rm -rf admin/wallet2 || true
    rm -rf backend/wallet || true
    rm -rf backend/wallet1 || true
    rm -rf backend/wallet2 || true
}

newcontr() {
    ./fablo chaincode upgrade chaincode1 0.0.2
}

admin() {
    cd admin
    npm i
    # node admin.js customer1@gmail.com customer2@gmail.com
    node admin1.js customer1@org1.com
    node admin2.js customer2@org2.com
    jq -s '.[0] * .[1]' secret1.json secret2.json > secrets.json
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
