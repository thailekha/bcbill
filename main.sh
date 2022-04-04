set -eoux pipefail

DIR=$(pwd)
cleanup() {
    cd $DIR
}
trap cleanup EXIT

e2e() {
    lint
    ./fablo recreate
    sleep 5
    clear_wallets
    admin
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

backend() {
    cd backend
    node index.js
    cd -
}

lint() {
    eslint admin backend chaincodes utils --fix --ext .js --config eslintrc.json
}

"$@"
