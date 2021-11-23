import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid'

const wss = new WebSocketServer({ port: 8080 })

let rooms = {}

wss.on('connection', ws => {
  ws.uuid = uuidv4()

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
    if (!room.participants.caller) {
      room.participants.caller = { websocket, id: websocket.uuid }
    }
    else {
      room.participants.callee = { websocket,  id: websocket.uuid  }
    }

    const {caller, callee} = room.participants
    if (!callee) return ;
    send(caller.websocket, {
      type: 'join',
      data
    })
    return
  }

  // create new room
  rooms[data.roomId] = { 'name': data.name, 'id': data.roomId, 'participants': { caller: { websocket,  id: websocket.uuid  }} }
  console.log('created new room')

}

const sendCandidate = (data, websocket) => {

  let room = rooms?.[data.roomId]
  const { participants } = room
  const to = [participants.caller, participants.callee].filter( participant => participant && participant?.id !== websocket.uuid)[0]

  if (!to) return;
  const request = {
    type: 'candidate',
    candidate: data.candidate
  }

  send(to.websocket, request)
}


const offer = (data) => {
  let room = rooms?.[data.roomId]
  const request = {
    type: 'offer',
    offer: data.offer
  }
  send(room.participants.callee.websocket, request)
}

const answer = (data) => {

  let room = rooms?.[data.roomId]

  const request = {
    type: 'answer',
    answer: data.answer
  }
  // send to 
  send(room.participants.caller.websocket, request)
}

const close = (data, websocket) => {

  let room = rooms?.[data.roomId]
  if (!room) return;
  const { caller } = room.participants

  if (websocket.uuid === caller.id) {
    delete rooms[data.roomId].participants.caller
  } else {
    delete rooms[data.roomId].participants.callee
  }
  console.log('close', rooms.participants)

}

const send = (websocket, request) => {
  console.log('send', rooms)
  websocket.send(JSON.stringify(request));
}
console.log('Websocket Server started 8080')
