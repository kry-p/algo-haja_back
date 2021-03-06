/*
 * 그룹 정보 스키마
 */
// Mongoose
import mongoose, { Schema } from 'mongoose';
import arrayUniquePlugin from 'mongoose-unique-array';

// Schema
const GroupSchema = new Schema({
  groupName: {
    type: String,
    required: true,
  },
  isPublic: { type: Boolean, required: true },
  manager: { type: [String], required: true },
  member: { type: [String], required: true },
  pool: { type: [Number], required: true },
  practice: [
    {
      practiceName: { type: String, required: true },
      start: { type: Date, required: true },
      end: { type: Date, required: true },
      problem: { type: [Number], required: true },
    },
  ],
  gitRepoInformation: {
    linked: Boolean,
    repoUrl: String,
    linkRule: Number,
    bojDir: String,
    memberName: [{ username: String, nameInRepo: String }],
  },
});
GroupSchema.plugin(arrayUniquePlugin);

const Group = mongoose.model('Group', GroupSchema);

export default Group;
