const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const Filter = require('bad-words')
const { generateMessage }  = require('./utils/messages')
// eslint-disable-next-line no-unused-vars
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const port = process.env.PORT || 3000
const publicDirectoryPath = require('path').join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New Websocket Connection')
    socket.on('join', ({username, room}, callback) => {

        const {error, user} = addUser({id: socket.id, username, room})

        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()

        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (currentLocation, callback) => {

        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, currentLocation))
        callback('Successfully emitted to others')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })
})

server.listen(port, () => console.log('server started on port ', port))

