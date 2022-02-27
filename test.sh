DIR=$(pwd)
cleanup() {
	cd $DIR
}
trap cleanup EXIT


test_client() {
	cd client
	npm i
	rm -rf wallet || true
	node app.js
	cd -
}

test_client