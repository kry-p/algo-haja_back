/*
 * 문제 정보 스키마
 */
// Mongoose
import mongoose, { Schema } from 'mongoose';
import arrayUniquePlugin from 'mongoose-unique-array';

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

ProblemSchema.plugin(arrayUniquePlugin);

const Problem = mongoose.model('Problem', ProblemSchema);

export default Problem;
