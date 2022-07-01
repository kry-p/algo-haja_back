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
    required: true,
  },
  problemName: {
    type: String,
    required: true,
  },
  solvedacTier: { type: Number, default: 0 },
  tags: { en: { type: [String] }, ko: { type: [String] } },
});

ProblemSchema.plugin(arrayUniquePlugin);

// 불필요한 데이터는 지우고 보냄
ProblemSchema.methods.serialize = function () {
  const data = this.toJSON();
  delete data.__v;
  delete data._id;
  delete data.tags.en;
  return data;
};

const Problem = mongoose.model('Problem', ProblemSchema);

export default Problem;
