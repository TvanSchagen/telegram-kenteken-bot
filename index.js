var express = require('express')
var app = express()
var bodyParser = require('body-parser')
const axios = require('axios')
var kenteken = require('./kenteken.js');

app.use(bodyParser.json())

app.use(
  bodyParser.urlencoded({
    extended: true
  })
)

// API route that is called upon by the bot
app.post('/new-message', function(req, res) {
  const { message } = req.body

  var data;
  var answer;

  // Return if message is empty
  if (!message) {
    return res.end()
  }

  // Return if message is not a valid kenteken regex
  if (!kenteken.check(message.text)) {
    axios.post('https://api.telegram.org/bot664166564:AAGyQI9Q7BBNDYr1oFJ-w4UTTh92GY3Q1mw/sendMessage', {
          chat_id: message.chat.id,
          text: 'Dat is geen kenteken. Stuur een bericht in de vorm van een kenteken.'
        })
      .then(response => { res.end('ok') })
      .catch(err => { res.end('Error :' + err) })
  }

  // Request data from RDW open data
  axios
    .get(
      'https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=' + message.text.replace(/-/g, '').toUpperCase()
    )
    .then(response => {
      // when succesful send message back
      data = response.data[0]
      answer = data.merk + ' ' + data.handelsbenaming + ', ' + data.aantal_cilinders + ' cilinders, inhoud van ' + data.cilinderinhoud + 'cc'
      console.log(answer)

      axios
      .post(
        'https://api.telegram.org/bot664166564:AAGyQI9Q7BBNDYr1oFJ-w4UTTh92GY3Q1mw/sendMessage',
        {
          chat_id: message.chat.id,
          text: answer
        }
      )
      .then(response => {
        // end response when OK
        res.end('ok')
      })
      .catch(err => {
        // log and end response when ERROR
        console.log('POST failed, Error :', err)
        res.end('Error :' + err)
      })

    })
    .catch(err => {
      // log and end response when ERROR
      axios.post('https://api.telegram.org/bot664166564:AAGyQI9Q7BBNDYr1oFJ-w4UTTh92GY3Q1mw/sendMessage', {
        chat_id: message.chat.id,
        text: 'Voor dit kenteken is geen informatie gevonden bij de RDW.'
      })
      .then(response => { res.end('ok') })
      .catch(err => { res.end('Error :' + err) })
      console.log('GET failed, Error :', err)
      res.end('Error :' + err)
    })
})

// If available, get port from Heroku process environmental variables
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

// Listen for requests on designated port
app.listen(port, function() {
  console.log('Listening on port: ' + port)
})