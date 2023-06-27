const { Gateway } = require('fabric-network');

class ConnectionPool {
  constructor(maxSize, createConnectionFn, destroyConnectionFn) {
    this.maxSize = maxSize;
    this.createConnectionFn = createConnectionFn;
    this.destroyConnectionFn = destroyConnectionFn;
    this.connections = new Map();
  }

  async acquire(identity, walletContent) {
    if (this.connections.has(identity)) {
      return this.connections.get(identity);
    }

    if (this.connections.size >= this.maxSize) {
      throw new Error('Connection pool is full');
    }

    const connection = await this.createConnectionFn(identity, walletContent);
    this.connections.set(identity, connection);
    return connection;
  }

  async release(identity) {
    if (this.connections.has(identity)) {
      const connection = this.connections.get(identity);
      this.connections.delete(identity);
      if (this.connections.size >= this.maxSize) {
        await this.destroyConnectionFn(connection);
      }
    }
  }

  async drain() {
    for (const [identity, connection] of this.connections.entries()) {
      await this.destroyConnectionFn(connection, identity);
    }
    this.connections.clear();
  }
}

module.exports = ConnectionPool;