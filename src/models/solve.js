/**
 * 풀이 정보 스키마
 */
// mongoose
import mongoose, { Schema } from 'mongoose';

// Schema
const SolveSchema = new Schema({
  username: String,
  problemId: Number,
  source: String,
});

const Solve = mongoose.model('Solve', SolveSchema);

export default Solve;
