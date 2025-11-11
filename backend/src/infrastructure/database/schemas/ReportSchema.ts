import mongoose, { Schema, Document } from 'mongoose';

export enum ReportType {
  CONTENT_SUMMARY = 'content_summary',
  TREND_ANALYSIS = 'trend_analysis',
  PERFORMANCE_METRICS = 'performance_metrics',
  CUSTOM = 'custom',
}

export interface IReportDocument extends Document {
  _id: string;
  title: string;
  type: ReportType;
  contentIds?: string[];
  analysisIds?: string[];
  data: Record<string, any>;
  metadata?: Record<string, any>;
  generatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReportDocument>({
  _id: { type: String, required: true },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Title cannot be empty'],
    maxlength: [300, 'Title cannot exceed 300 characters']
  },
  type: {
    type: String,
    enum: Object.values(ReportType),
    required: true
  },
  contentIds: [{
    type: String,
    ref: 'Content',
    validate: {
      validator: function(v: string) {
        return mongoose.Types.ObjectId.isValid(v) || /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: 'Each contentId must be a valid ObjectId or 24-character hex string'
    }
  }],
  analysisIds: [{
    type: String,
    ref: 'Analysis',
    validate: {
      validator: function(v: string) {
        return mongoose.Types.ObjectId.isValid(v) || /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: 'Each analysisId must be a valid ObjectId or 24-character hex string'
    }
  }],
  data: {
    type: Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function(v: any) {
        return v && typeof v === 'object';
      },
      message: 'Data must be a non-empty object'
    }
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  generatedBy: {
    type: String,
    trim: true,
    maxlength: [200, 'GeneratedBy cannot exceed 200 characters']
  }
}, {
  timestamps: true,
  _id: false // Use custom _id
});

// Indexes for performance
ReportSchema.index({ type: 1 });
ReportSchema.index({ generatedBy: 1 });
ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ updatedAt: -1 });

// Compound indexes for common queries
ReportSchema.index({ type: 1, createdAt: -1 });
ReportSchema.index({ generatedBy: 1, createdAt: -1 });

// Ensure at least one content or analysis reference
ReportSchema.pre('validate', function(next) {
  if ((!this.contentIds || this.contentIds.length === 0) &&
      (!this.analysisIds || this.analysisIds.length === 0)) {
    this.invalidate('contentIds', 'Report must have at least one content or analysis reference');
    this.invalidate('analysisIds', 'Report must have at least one content or analysis reference');
  }
  next();
});

export default mongoose.model<IReportDocument>('Report', ReportSchema);