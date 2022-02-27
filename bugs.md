# Discovery access denied
## Recreate
- more than 1 peer
- create network
- docker-compose logs to see peers failing to connect to gossip addresses
- notice the "
## Fix
- fablo-target/fabric-docker/docker-compose.yaml
- CORE_PEER_GOSSIP_BOOTSTRAP