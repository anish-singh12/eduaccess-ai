import { Document } from '../models/Document.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { ConceptMap } from '../models/ConceptMap.js';
import { User } from '../models/User.js';
import { isDatabaseConnected } from '../config/db.js';

/**
 * Get comprehensive, real-time dashboard analytics for the authenticated user
 */
export async function getDashboardAnalytics(req, res, next) {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    if (!isDatabaseConnected()) {
      return res.status(200).json({
        success: true,
        data: {
          metrics: {
            notesSaved: 0,
            quizzesCompleted: 0,
            averageScore: 0,
            conceptMapsCreated: 0
          },
          recentActivity: [],
          quizTrends: [],
          weakTopics: [],
          recentAttempts: []
        }
      });
    }

    // 1. Core student metrics
    const [notesCount, attemptsCount, mapsCount, scoreAgg] = await Promise.all([
      Document.countDocuments({ userId }),
      QuizAttempt.countDocuments({ userId }),
      ConceptMap.countDocuments({ userId }),
      QuizAttempt.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            avgPercentage: { $avg: '$percentage' },
            totalScore: { $sum: '$score' },
            totalQuestions: { $sum: '$totalQuestions' }
          }
        }
      ])
    ]);

    const averageScore = scoreAgg[0]?.avgPercentage
      ? Math.round(scoreAgg[0].avgPercentage)
      : 0;

    // 2. Recent Quiz Attempts
    const recentAttempts = await QuizAttempt.find({ userId })
      .select('quizTitle score totalQuestions percentage difficulty createdAt answers')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    // 3. Quiz Score Trends for Charts (oldest to newest)
    const quizTrends = [...recentAttempts].reverse().map(att => ({
      title: att.quizTitle || 'Quiz',
      score: att.score,
      total: att.totalQuestions,
      percentage: att.percentage,
      date: new Date(att.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: att.createdAt
    }));

    // 4. Inferred Weak Topics from actual answer data
    const topicMap = new Map();
    recentAttempts.forEach(att => {
      (att.answers || []).forEach(ans => {
        const tag = (ans.topicTag || 'General').trim();
        if (!topicMap.has(tag)) {
          topicMap.set(tag, { total: 0, correct: 0 });
        }
        const entry = topicMap.get(tag);
        entry.total += 1;
        if (ans.isCorrect) entry.correct += 1;
      });
    });

    const weakTopics = [];
    for (const [topic, stats] of topicMap.entries()) {
      const accuracy = Math.round((stats.correct / stats.total) * 100);
      if (accuracy < 70) {
        weakTopics.push({
          topic,
          total: stats.total,
          correct: stats.correct,
          incorrect: stats.total - stats.correct,
          accuracy
        });
      }
    }
    weakTopics.sort((a, b) => a.accuracy - b.accuracy);

    // 5. Consolidated Real Learning Activity Feed
    const [recentDocs, recentMaps] = await Promise.all([
      Document.find({ userId })
        .select('title createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      ConceptMap.find({ userId })
        .select('title topic createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean()
    ]);

    const activityItems = [
      ...recentDocs.map(d => ({
        id: d._id,
        type: 'note',
        title: d.title,
        description: 'Saved study note',
        timestamp: d.updatedAt || d.createdAt,
        link: `/notes?id=${d._id}`
      })),
      ...recentAttempts.map(a => ({
        id: a._id,
        type: 'quiz',
        title: a.quizTitle,
        description: `Completed quiz (${a.score}/${a.totalQuestions} - ${a.percentage}%)`,
        timestamp: a.createdAt,
        link: `/quizzes/history`
      })),
      ...recentMaps.map(m => ({
        id: m._id,
        type: 'concept-map',
        title: m.title || `${m.topic} Map`,
        description: 'Created concept map',
        timestamp: m.updatedAt || m.createdAt,
        link: `/concept-maps?id=${m._id}`
      }))
    ];

    activityItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivity = activityItems.slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          notesSaved: notesCount,
          quizzesCompleted: attemptsCount,
          averageScore,
          conceptMapsCreated: mapsCount
        },
        recentActivity,
        quizTrends,
        weakTopics: weakTopics.slice(0, 5),
        recentAttempts: recentAttempts.map(a => ({
          _id: a._id,
          title: a.quizTitle,
          score: a.score,
          totalQuestions: a.totalQuestions,
          percentage: a.percentage,
          difficulty: a.difficulty,
          createdAt: a.createdAt
        }))
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get administrator user growth analytics (Admin only)
 */
export async function getAdminUserGrowth(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Administrative privileges required to access user growth analytics.'
        }
      });
    }

    if (!isDatabaseConnected()) {
      return res.status(200).json({
        success: true,
        data: {
          totalUsers: 0,
          newUsersPeriod: 0,
          growthSeries: []
        }
      });
    }

    const days = parseInt(req.query.range || '30', 10);
    const validDays = [7, 30, 90].includes(days) ? days : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validDays);
    startDate.setHours(0, 0, 0, 0);

    const [totalUsers, newUsersPeriod, dailyRegistrations] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Build complete daily timeline including zero-registration days
    const growthSeries = [];
    const regMap = new Map(dailyRegistrations.map(r => [r._id, r.count]));

    for (let i = validDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      growthSeries.push({
        date: dateStr,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        newUsers: regMap.get(dateStr) || 0
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        newUsersPeriod,
        rangeDays: validDays,
        growthSeries
      }
    });
  } catch (err) {
    next(err);
  }
}
