import mongoose, { Schema } from 'mongoose';

// Schema
const ProblemSchema = new Schema({
  problemId: {
    type: Number,
    unique: true,
  },
  problemName: {
    type: String,
    required: true,
  },
  solvedacTier: { type: Number, default: 0 },
  tags: [String],
  rating: [{ username: String, rate: Number }],
});

const Problem = mongoose.model('Problem', ProblemSchema);

export default Problem;
