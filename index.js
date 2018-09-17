const AWSMqtt = require("aws-mqtt-client").default
const velux = require('klf-200-api')

const { AWS_IOT_ENDPOINT_HOST, VELUX_TOPIC, VELUX_ADDRESS, VELUX_PASSWORD } = process.env

const awsMqttClient = new AWSMqtt({
  endpointAddress: AWS_IOT_ENDPOINT_HOST,
  logger: console
})

awsMqttClient.on("connect", () => awsMqttClient.subscribe([VELUX_TOPIC],
  { qos: 1 },
  (err, granted) => console.log("aws", err, granted)
))

const conn = new velux.connection(VELUX_ADDRESS)
const scenes = new velux.scenes(conn)

const activate_scene = (sceneIdOrName) =>
  conn.loginAsync(VELUX_PASSWORD)
    .then(() => scenes.runAsync(sceneIdOrName))
    .then(() => conn.logoutAsync())
    .catch((err) => {
      conn.logoutAsync()
      console.error(err)
    })

const message_parser = (raw_message, message = raw_message.toString()) => {
  try {
    return JSON.parse(message).message
  }
  catch (e) {
    return message
  }
}

awsMqttClient.on("message", (topic, message) => {
  let scene = message_parser(message)
  console.log(`Received instruction to activate scene '${scene}'`)
  return activate_scene(scene)
})