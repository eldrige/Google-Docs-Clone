const mongoose = require('mongoose');

const connectDb = async () => {
  try {
    await mongoose.connect('mongodb://localhost/google-docs', {
      useCreateIndex: true,
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: true,
    });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = connectDb;
