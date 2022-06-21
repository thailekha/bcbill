# Node version
- 14 LTS

# Blockchain explorer
- the explorer uses systemchaincode plugin under the hood, specifically QSCC to query the blocks and traverse them
- For now, query its rest api at http://localhost:7010/api-docs/


# Discovery access denied
## Recreate
- more than 1 peer
- create network
- docker-compose logs to see peers failing to connect to gossip addresses
- notice the "
## Fix
- fablo-target/fabric-docker/docker-compose.yaml
- CORE_PEER_GOSSIP_BOOTSTRAP

# React-nodegui setup
# Install
- GCC
- cmake
- qt5

# New machine
- jq, docker, docker-compose v1

# Prog
- public / private key | password | email and profile

- provider is the admin
- customers sign contract with admin to register with their emails
- admin generate bunch of enrolment secrets
- cusomers register page:
	- email, secret, password
	- save identity

if there's email in localstoragfe--> logged in
- use the wallet as the login token?