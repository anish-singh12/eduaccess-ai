import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    question: {
      type: String,
      required: true,
      maxlength: 1000
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (opts) {
          return Array.isArray(opts) && opts.length === 4 && opts.every(o => typeof o === 'string' && o.trim().length > 0);
        },
        message: 'Each question must have exactly 4 non-empty options'
      }
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },
    explanation: {
      type: String,
      default: '',
      maxlength: 1000
    },
    topicTag: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    }
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      minlength: 1,
      maxlength: 120
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    topic: {
      type: String,
      default: 'General Study Material',
      trim: true,
      maxlength: 100
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: function (qs) {
          return Array.isArray(qs) && qs.length >= 1 && qs.length <= 25;
        },
        message: 'Quiz must contain between 1 and 25 questions'
      }
    }
  },
  {
    timestamps: true
  }
);

quizSchema.index({ userId: 1, updatedAt: -1 });

// Returns quiz structure sanitized for taking (hiding correct answers and explanations from the browser)
quizSchema.methods.toStudentView = function () {
  const quizObj = this.toObject();
  quizObj.questions = quizObj.questions.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options,
    topicTag: q.topicTag
  }));
  return quizObj;
};

export const Quiz = mongoose.model('Quiz', quizSchema);
