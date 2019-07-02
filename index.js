'use strict'
const velux = require('velux-klf200-api')
const Iot = require("@chrisns/iot-shorthand")
const iot = new Iot()

const { VELUX_ADDRESS, VELUX_PASSWORD } = process.env

process.on('exit', () =>
  velux.end()
)

velux.on('GW_GET_ALL_NODES_INFORMATION_NTF', data =>
  iot.discovered({
    name: `velux_${data.serialNumber}`,
    type: "velux",
    attributes: {
      nodeName: data.nodeName.replace(" ", "_"),
    }
  }, payload => {
    if (payload.set_to)
      velux.sendCommand({
        api: velux.API.GW_COMMAND_SEND_REQ,
        functionalParameterMP: { valueType: 'RELATIVE', value: payload.set_to },
        commandOriginator: 3,
        priorityLevelLock: false,
        indexArrayCount: 1,
        indexArray: [data.nodeID],
      }).then(() =>
        iot.report(`velux_${data.serialNumber}`, {
          set_to: null
        }))
  })
)

velux.connect(VELUX_ADDRESS, {})
  .then(() => velux.login(VELUX_PASSWORD))
  .then(() => velux.sendCommand({ api: velux.API.GW_GET_ALL_NODES_INFORMATION_REQ }))
  .then(() => setInterval(() => velux.sendCommand({ api: velux.API.GW_GET_VERSION_REQ }), 10000))