set -eoux pipefail

DIR=$(pwd)
cleanup() {
    cd $DIR
}
trap cleanup EXIT


admin() {
    cd admin
    npm i
    rm -rf wallet || true
    node index.js customer1@gmail.com customer2@gmail.com
    cd -
}

backend() {
    cd backend
    rm -rf wallet || true
    node index.js
    cd -
}

e2e() {
    ./fablo recreate
    sleep 5
    admin
}

lint() {
    eslint admin backend chaincodes utils --fix --ext .js --config eslintrc.json
}

"$@"
