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