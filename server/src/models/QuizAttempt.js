import mongoose from 'mongoose';

const answerRecordSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    options: {
      type: [String],
      default: []
    },
    selectedOption: {
      type: Number,
      required: true,
      min: -1,
      max: 3,
      default: -1
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    explanation: {
      type: String,
      default: ''
    },
    topicTag: {
      type: String,
      default: 'General',
      trim: true
    }
  },
  { _id: false }
);

const topicPerformanceSchema = new mongoose.Schema(
  {
    topicTag: {
      type: String,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    correct: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true
    },
    quizTitle: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      default: 'medium'
    },
    answers: {
      type: [answerRecordSchema],
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    topicPerformance: {
      type: [topicPerformanceSchema],
      default: []
    },
    timeSpentSeconds: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

quizAttemptSchema.index({ userId: 1, createdAt: -1 });
quizAttemptSchema.index({ userId: 1, quizId: 1 });

export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
