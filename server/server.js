const PORT = 2000;
const mongoose = require('mongoose');
const Document = require('./Document');

mongoose
  .connect('mongodb://localhost/google-docs', {
    useCreateIndex: true,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: true,
  })
  .then(() => console.log('Connected to the google-docs database'))
  .catch((err) => console.log(err.message));

const io = require('socket.io')(PORT, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const defaultValue = '';
// evrytime our client connects, this connection function will be called
// its via the socket that we communicate back to the client
io.on('connection', (socket) => {
  // console.log(`Conneted on port, ${PORT}, ${socket}`);

  socket.on('get-document', async (documentID) => {
    const document = await findOrCreateDocument(documentID);
    // join a room based on the documentid
    socket.join(documentID);
    socket.emit('load-document', document.data);

    // this "send change is an event declared in the client, we now subscribe to it and recieve the delta value"
    socket.on('send-changes', (delta) => {
      console.log(delta);
      // broadcast the delta to all other sockets
      socket.broadcast.to(documentID).emit('recieve-changes', delta);
    });
    // update the document
    socket.on('save-document', async (data) => {
      await Document.findByIdAndUpdate(documentID, { data });
    });
  });
});

const findOrCreateDocument = async (id) => {
  if (id == null) return;
  const document = await Document.findById(id);

  if (document) return document;

  return await Document.create({ _id: id, data: defaultValue });
};
