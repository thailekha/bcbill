set -eoux pipefail

DIR=$(pwd)
cleanup() {
    cd $DIR
}
trap cleanup EXIT


test_client() {
    cd admin
    npm i
    rm -rf wallet || true
    node index.js customer1@gmail.com customer2@gmail.com
    cd -
}

full_test() {
    ./fablo recreate
    sleep 5
    test_client
}

lint() {
    eslint admin backend chaincodes utils --fix --ext .js --config eslintrc.json
}

"$@"
