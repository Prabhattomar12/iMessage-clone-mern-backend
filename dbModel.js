import mongoose from 'mongoose';

const groupSchema = mongoose.Schema({
  groupName: String,
  conversation: [
    {
      message: String,
      timestamp: String,
      user: {
        uid: String,
        username: String,
        avatar: String,
        email: String,
      },
    },
  ],
});

export default mongoose.model('groups', groupSchema);
