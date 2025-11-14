import mongoose, { Schema, Document } from 'mongoose';

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface IAnalysisDocument extends Document {
  _id: string;
  contentId: string;
  status: AnalysisStatus;
  results?: Record<string, any>;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSchema = new Schema<IAnalysisDocument>({
  _id: { type: String, required: true },
  contentId: {
    type: String,
    required: true,
    ref: 'Content'
  },
  status: {
    type: String,
    enum: Object.values(AnalysisStatus),
    default: AnalysisStatus.PENDING,
    required: true
  },
  results: {
    type: Schema.Types.Mixed,
    default: undefined
  },
  error: {
    type: String,
    trim: true,
    maxlength: [1000, 'Error message cannot exceed 1000 characters'],
    validate: {
      validator: function (v: string | undefined) {
        return !v || v.length > 0;
      },
      message: 'Error cannot be empty if provided'
    }
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  _id: false // Use custom _id
});

// Indexes for performance
AnalysisSchema.index({ contentId: 1 });
AnalysisSchema.index({ status: 1 });
AnalysisSchema.index({ createdAt: -1 });
AnalysisSchema.index({ updatedAt: -1 });

// Compound indexes for common queries
AnalysisSchema.index({ contentId: 1, status: 1 });
AnalysisSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IAnalysisDocument>('Analysis', AnalysisSchema);