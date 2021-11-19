import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid'

export default class Signaling {

}

const wss = new WebSocketServer({ port: 8080 })

let rooms = {}

wss.on('connection', ws => {

  const uuid = uuidv4()

  ws.uuid = uuid

  ws.on('message', data => {

    try {
      data = JSON.parse(data);

      switch (data.type) {

        case 'login':
          saveUser(data, ws)
          break;

        case 'candidate':
          sendCandidate(data, ws)
          break;

        case 'offer':
          offer(data, ws)
          break;

        case 'answer':
          answer(data, ws)
          break;

        case 'close':
          close(data, ws)
          break;

      }
    } catch (e) {
      console.error(e);
    }


  })
  send(ws, 'connected!')
})

const saveUser = (data, websocket) => {
  console.log('saveUser', data.roomId)

  let room = rooms?.[data.roomId]

  if (room) {
    const participants = room.participants
    for (const participant of participants) {
      const to = participant.websocket
      const request = {
        type: 'join',
        data
      }
      send(to, request)
    }
    room.participants.push({ websocket, id: websocket.uuid })
    return
  }

  // create new room
  rooms[data.roomId] = { 'name': data.name, 'id': data.roomId, 'participants': [{ websocket, id: websocket.uuid }] }
  console.log('created new room')

}

const sendCandidate = (data, websocket) => {
  console.log('sendCandidate')

  let room = rooms?.[data.roomId]
  const participants = room.participants.filter(participant => participant.id != websocket.uuid)
  const to = participants[0].websocket
  const request = {
    type: 'candidate',
    candidate: data.candidate
  }

  send(to, request)
}


const offer = (data, websocket) => {

  let room = rooms?.[data.roomId]
  const participants = room.participants.filter(participant => participant.id != websocket.uuid)
  const to = participants[0].websocket

  const request = {
    type: 'offer',
    offer: data.offer
  }
  send(to, request)
}

const answer = (data, websocket) => {

  let room = rooms?.[data.roomId]
  const participants = room.participants.filter(participant => participant.id != websocket.uuid)
  console.log('answer', participants)
  const to = participants[0].websocket

  const request = {
    type: 'answer',
    answer: data.answer
  }
  // send to 
  send(to, request)
}

const close = (data, websocket) => {

  console.log('close')

  let room = rooms?.[data.roomId]
  const participants = room.participants.filter(participant => participant.id != websocket.uuid)
  room.participants = participants
  rooms[data.roomId].participants = participants

}

const send = (websocket, request) => {
  console.log('send', rooms)
  websocket.send(JSON.stringify(request));
}
console.log('Websocket Server started 8080')
