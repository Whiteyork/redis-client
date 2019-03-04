const { createRedisClient } = require('./index')

const client = createRedisClient();

client.on('connect', () => {
  console.log('.... connected')
})
client.on('data', (data) => {
  console.log(data)
})

