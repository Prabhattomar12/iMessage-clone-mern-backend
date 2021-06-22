import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotEnv from 'dotenv';
import db from './dbModel.js';
import Pusher from 'pusher';

// app configs
dotEnv.config();
const app = express();
const PORT = process.env.PORT || 9000;

// middlewares
app.use(express.json());
app.use(cors());


const pusher = new Pusher({
  appId: "1223294",
  key: "d9d80d0a4ca6a831af92",
  secret: "bf070406ef27bf4ab4bb",
  cluster: "ap2",
  useTLS: true
});


// db configs
const mongoDB_URI = process.env.mongoDB_URI;
mongoose.connect(mongoDB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

mongoose.connection.once('open', () => {
  console.log('DB Connected');
  // trigger pusher

  const changeStream = mongoose.connection.collection('groups').watch();

  changeStream.on('change', change => {
      if(change.operationType === 'insert'){
        pusher.trigger("groups", "newGroup", {
          change: change
        });
      }else if(change.operationType === 'update'){
        pusher.trigger("conversation", "newMessage", {
          change: change
        });
      }else if(change.operationType === 'update'){
        pusher.trigger("lastMessage", "updateLastMessage", {
          change: change
        });
      }else{
        console.log('Error in triggering pusher')
      }
  })












});

// routes
app.get('/', (req, res) => {
  res.status(200).send('Api is live');
});

app.post('/add/newGroup', (req, res) => {
  const newGroup = req.body;

  db.create(newGroup, (err, data) => {
    if (err) {
      res.send(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get('/groups', (req, res) => {
  db.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post('/add/newMessage', (req, res) => {
  const newMessage = req.body;
  
  db.updateOne(
    { _id: req.query.id },
    { $push: { conversation: newMessage } },
    (err, data) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(201).send(data);
      }
    }
  );
});

app.get('/group/messages/:groupId', (req, res) => {
  db.findOne({ _id: req.params.groupId }, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.delete('/delete/group/:groupId', (req, res) => {
  db.deleteOne({ _id: req.params.groupId }, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(204).send(data);
    }
  });
});

app.post('/delete/message', (req, res) => {
  let message = {} ;
  console.log('group id ', req.query.groupId);
  db.findOne({ _id: req.query.groupId }, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      console.log('data find ', data)
       data.conversation.forEach(msg => {
         console.log('curr msg ', msg, msg._id === req.query.messageId ) 
        if(msg._id === (req.query.messageId)){
             console.log('msg found ', msg)
            message = msg;
           }
       })
    }
  });
  console.log(' message ', message);

  db.updateOne(
    { _id: req.query.groupId },
    { $pull: { conversation: message } },
    (err, data) => {
       if(err){
            res.status(500).send(err)
       }else{
            res.status(201).send(data)
       }
    }
  );
  console.log(' message id ', req.query.messageId);

});

// listen
app.listen(PORT, () => console.log(`Server is running at port: ${PORT}`));
