// eslint-disable-next-line no-undef
const socket = io()
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button') 
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const sidebarTemplete = document.querySelector('#sidebar-template').innerHTML


// Responses
socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, { // eslint-disable-line no-undef
        username: message.username.toUpperCase(),
        message: message.text, 
        createdAt: moment(message.createdAt).format('h:mm:ss a')  // eslint-disable-line no-undef
    }) 
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    // eslint-disable-next-line no-undef
    const html = Mustache.render(sidebarTemplete, {
        room, 
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

// Options
const {username, room} = Qs.parse(location.search, { // eslint-disable-line no-undef
    ignoreQueryPrefix: true
}) 

const autoscroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild

    // height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    const containerHeight = $messages.scrollHeight

    // how far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }


}

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    if(message.length == 0) {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.focus()
        return 
    }
    socket.emit('sendMessage', message, (error) => {

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error) {
            return console.log(error)
        }
        console.log('Message delivered!')
    })
})

$locationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const currentLocation = {
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude
        }
        const locationMessage = `This is my location ${currentLocation.latitude},${currentLocation.longitude}`
        socket.emit('sendLocation', locationMessage, (eventAcknowledge) => {
            $locationButton.removeAttribute('disabled')
            console.log(eventAcknowledge)
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'   
    }
})