DIR=$(pwd)
cleanup() {
	cd $DIR
}
trap cleanup EXIT

cd fablo-target/fabric-docker
docker-compose logs -f