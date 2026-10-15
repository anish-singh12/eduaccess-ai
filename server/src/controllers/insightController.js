import { calculateUserInsights } from '../services/insightsService.js';
import { isDatabaseConnected } from '../config/db.js';

/**
 * Get personalized learning insights and analytics for the authenticated student
 */
export async function getUserInsights(req, res, next) {
  try {
    const userId = req.user._id;

    if (!isDatabaseConnected()) {
      return res.status(200).json({
        success: true,
        data: {
          hasData: false,
          summary: {
            totalAttempts: 0,
            totalQuestionsAnswered: 0,
            totalCorrect: 0,
            overallAccuracy: 0,
            averageScore: 0
          },
          topicBreakdown: [],
          strongTopics: [],
          weakTopics: [],
          developingTopics: [],
          recentHistory: [],
          recommendations: [],
          message: 'Database is not connected.'
        }
      });
    }

    const insights = await calculateUserInsights(userId);

    res.status(200).json({
      success: true,
      insights,
      data: insights
    });
  } catch (err) {
    next(err);
  }
}
