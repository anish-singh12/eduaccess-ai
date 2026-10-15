import mongoose from 'mongoose';

const definitionSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    definition: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    }
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      minlength: 1,
      maxlength: 120
    },
    sourceText: {
      type: String,
      required: [true, 'Source text is required'],
      maxlength: 100000 // reasonable upper bound (100k chars)
    },
    simplifiedText: {
      type: String,
      default: '',
      maxlength: 100000
    },
    keyPoints: {
      type: [String],
      default: []
    },
    definitions: {
      type: [definitionSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Compound index for user searches and sorting by update date
documentSchema.index({ userId: 1, updatedAt: -1 });

export const Document = mongoose.model('Document', documentSchema);
