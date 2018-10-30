var express = require('express')
var app = express()
var bodyParser = require('body-parser')
const axios = require('axios')
var kenteken = require('./kenteken.js');

app.use(bodyParser.json()) // for parsing application/json
app.use(
  bodyParser.urlencoded({
    extended: true
  })
) // for parsing application/x-www-form-urlencoded

//This is the route the API will call
app.post('/new-message', function(req, res) {
  const { message } = req.body

  //Each message contains "text" and a "chat" object, which has an "id" which is the chat id

  // check of bericht niet leeg is
  if (!message) {
    return res.end()
  }

  // check of kenteken in de regex valt van bekende kentekens
  if (!kenteken.check(message.text)) {
    return res.end();
  }

  // get data

  var data;

  axios
    .get(
      'https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=' + message.text.replace(/-/g, '').toUpperCase()
    )
    .then(response => {
      data = response.body
      console.log('Received response from RDW: ')
      console.log(JSON.stringify(response))
      
      axios
      .post(
        'https://api.telegram.org/bot664166564:AAGyQI9Q7BBNDYr1oFJ-w4UTTh92GY3Q1mw/sendMessage',
        {
          chat_id: message.chat.id,
          //text:  JSON.stringify(data)
          text: data.merk + ' ' + data.handelsbenaming + ', ' + data.aantal_cilinders + ' cilinders, inhoud van ' + data.cilinderinhoud + 'cc'
        }
      )
      .then(response => {
        console.log('POST successfull')
        res.end('ok')
      })
      .catch(err => {
        console.log('POST failed, Error :', err)
        res.end('Error :' + err)
      })

    })
    .catch(err => {
      console.log('GET failed, Error :', err)
      res.end('Error :' + err)
    })
})

let port = process.env.PORT;

if (port == null || port == "") {
  port = 3000;
}

// Finally, start our server
app.listen(port, function() {
  console.log('Telegram bot listening on port 3000!')
})