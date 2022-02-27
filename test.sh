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

full_test() {
	./fablo recreate
	sleep 5
	test_client
}

full_test
