const net = require('net');
const eventEmitter = require('events');
const Redis_Commands = require('./commands');

const defaultOpts = {
  port: 6379,
  host: '127.0.0.1',
  family: 4
}

class RedisClient extends eventEmitter{
  constructor(netClient) {
    super();
    this.netClient = netClient;
    this.connected = false;
    this.initEvent(netClient);

    this.offlineQueue = [];
    this.commandQueue = [];
  }

  initEvent() {
    const netClient = this.netClient;
    netClient.on('connect', () => {
      this.connected = true;
      this.emit('connect');

      this.offlineQueue.map(cmd => this._exec(cmd));
    })

    netClient.on('data', (data) => {
      const dataString = data.toString();
      this.emit('data', dataString)
    });

    netClient.on('error', (err) => {
      this.emit('error', err);
    })

    netClient.on('close', () => {
      console.log('connection is closed');
      this.emit('close');
    });

    netClient.on('end', () => {
      this.emit('end');
    })
  }

  // directly send total command to server with string
  exec(cmd) {

  }

  _exec() {
    const netClient = this.netClient;
    const command = arguments[0];
    let commandToSend = '';

    if(!this.connected) return this.offlineQueue.push(arguments[0]);
    // console.log(`execute:  ${command}  `);
    if(command instanceof String) {
      commandToSend = JSON.stringify(command);
    } else if(command instanceof Array) {
      if(command.length === 0) {
        return this.emit('error', 'syntax error, directive cannot be empty');
      }
      commandToSend = command.slice(1).reduce((pre, arg) => {
        return `${pre} ${JSON.stringify(arg)}`
      }, command[0]);
    }

    netClient.write(commandToSend + '\n');
  }
}

// add sugar method to prototype
Redis_Commands.map(cmd => {
  RedisClient.prototype[cmd] = function() {
    this._exec([cmd, ...arguments]);
  }
  RedisClient.prototype[cmd.toLowerCase()] = RedisClient.prototype[cmd];
})

exports.createRedisClient = (opts = defaultOpts) => {
  const netClient = net.createConnection(opts);
  return Object.assign(new RedisClient(netClient), opts);
}