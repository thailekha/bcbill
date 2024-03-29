set -eou pipefail

DIR=$(pwd)
cleanup() {
    cd $DIR
}
trap cleanup EXIT

clean() {
    clear_wallets
    ./fablo recreate
    sleep 5
}

e2e() {
    # npm_install
    # lint
    clean
    admin
    dev
    # debug
}

pretest() {
    clean
    admin
}

test() {
    clean
    admin
    cd tests
    npm run test
    cd -
}

expose() {
    gnome-terminal \
        --tab -e "lt --subdomain customer --port 3000" \
        --tab -e "lt --subdomain staff --port 3001" \
        --tab -e "lt --subdomain thebackend --port 9999"
}

web() {
    rm -rf web-second-instance || true
    cp -rf web web-second-instance
    # gnome-terminal \
    #     --tab -e "bash -c ' cd web && PORT=3000 npm run customer ; bash'" \
    #     --tab -e "bash -c ' cd web-second-instance && PORT=3001 npm run staff ; bash'"

    # the one that run inside web is for dev
    gnome-terminal \
        --tab -e "bash -c ' cd web && PORT=3000 npm run customer ; bash'" \
        --tab -e "bash -c ' cd web-second-instance && PORT=3001 npm run staff ; bash'"

    # sleep 8
    # firefox "localhost:3000" &
    # google-chrome "localhost:3001" &
}

dev() {
    cleanup
    gnome-terminal \
        --tab -e "bash -c ' cd backend && npm run dev ; bash'"
        # --tab -e "bash -c ' cd fablo-target/fabric-docker && docker-compose logs -f ; bash'"
    web
    expose
}

debug() {
    cleanup
    gnome-terminal \
        --tab -e "bash -c ' cd backend && node inspect index.js ; bash'" \
        --tab -e "bash -c ' cd web && npm start ; bash'"
        # --tab -e "bash -c ' cd fablo-target/fabric-docker && docker-compose logs -f ; bash'"
}

dockerlog() {
    gnome-terminal \
        --tab -e "bash -c ' cd fablo-target/fabric-docker && docker-compose logs -f ; bash'"
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

newcontr() {
    ./fablo chaincode upgrade chaincode1 0.0.2
}

admin() {
    cd admin
    node admin1.js customer1@org1.com customer2@org1.com
    node admin2.js staff1@org2.com staff2@org2.com
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
    eslint admin backend chaincodes utils tests --fix --ext .js --config eslintrc.json
}

"$@"
