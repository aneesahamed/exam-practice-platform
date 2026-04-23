import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});
const QUESTIONS_BUCKET = process.env.QUESTIONS_BUCKET || '';

// Serve all non-excluded questions
// Only 'excluded_source_corrupt' and 'draft' are intentionally excluded
const SERVABLE_STATUSES = ['reviewed_ai', 'ai_generated'] as const;

// In-memory cache for questions (Lambda container reuse)
let questionsCache: any[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface Question {
  question_id: string;
  exam: string;
  question_text_raw: string;
  options_raw: Record<string, string>;
  correct_answers: string[];
  explanation?: string;
  why_others_are_wrong?: Record<string, string>;
  memory_hook?: string;
  taxonomy?: {
    primary_topic_id?: string;
    service_ids?: string[];
    concept_tag_ids?: string[];
    difficulty?: string;
  };
  status?: string;
}

/**
 * Load questions from S3
 */
async function loadQuestionsFromS3(): Promise<Question[]> {
  console.log('Loading questions from S3', { bucket: QUESTIONS_BUCKET });

  try {
    const command = new GetObjectCommand({
      Bucket: QUESTIONS_BUCKET,
      Key: 'AWS-SAA-C03-2025.01-all-questions.json',
    });

    const response = await s3Client.send(command);
    const bodyString = await response.Body?.transformToString();

    if (!bodyString) {
      throw new Error('Empty response from S3');
    }

    const data = JSON.parse(bodyString);
    const questions = data.questions || [];

    console.log('Questions loaded successfully', {
      count: questions.length,
      bucket: QUESTIONS_BUCKET,
    });

    return questions;
  } catch (error) {
    console.error('Error loading questions from S3:', error);
    throw error;
  }
}

/**
 * Get questions with caching
 */
async function getQuestionsWithCache(): Promise<Question[]> {
  const now = Date.now();

  // Return cached questions if still valid
  if (questionsCache && cacheTimestamp && now - cacheTimestamp < CACHE_TTL_MS) {
    console.log('Returning cached questions', {
      count: questionsCache.length,
      cacheAge: Math.round((now - cacheTimestamp) / 1000),
    });
    return questionsCache;
  }

  // Load fresh questions from S3
  const questions = await loadQuestionsFromS3();
  questionsCache = questions;
  cacheTimestamp = now;

  return questions;
}

/**
 * GET /questions
 * Fetch questions with filtering and pagination
 * 
 * Query parameters:
 * - exam: Filter by exam (e.g., AWS-SAA-C03)
 * - topic: Filter by primary_topic_id or service_id
 * - difficulty: Filter by difficulty (EASY, MEDIUM, HARD)
 * - limit: Number of results per page (default: 20)
 * - page: Page number (default: 1)
 */
export const getQuestions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Get questions requested', {
    requestId: event.requestContext.requestId,
    queryParams: event.queryStringParameters,
  });

  try {
    // Load questions (with caching)
    const allQuestions = await getQuestionsWithCache();

    // Parse query parameters
    const {
      exam,
      topic,
      difficulty,
      limit = '20',
      page = '1',
      shuffle = 'false', // Add shuffle parameter
    } = event.queryStringParameters || {};

    // Filter questions - only return production-ready questions
    // Questions with status other than 'reviewed_ai' are excluded from API responses
    let filtered = allQuestions.filter(q => 
      SERVABLE_STATUSES.includes(q.status as any)
    );

    if (exam) {
      filtered = filtered.filter(q => q.exam === exam);
    }

    if (topic) {
      filtered = filtered.filter(
        q =>
          q.taxonomy?.primary_topic_id === topic ||
          q.taxonomy?.service_ids?.includes(topic)
      );
    }

    if (difficulty) {
      filtered = filtered.filter(
        q => q.taxonomy?.difficulty?.toUpperCase() === difficulty.toUpperCase()
      );
    }

    // Sort by sequential question number (last part of question_id)
    // Example: SAA-C03-Q21-1019 -> extract 1019
    // This maintains the original PDF order regardless of batch processing
    filtered.sort((a, b) => {
      const getSequentialNumber = (questionId: string): number => {
        const parts = questionId.split('-');
        const lastPart = parts[parts.length - 1];
        return parseInt(lastPart, 10) || 0;
      };
      
      const seqA = getSequentialNumber(a.question_id);
      const seqB = getSequentialNumber(b.question_id);
      return seqA - seqB;
    });

    // Shuffle questions if requested (after sorting)
    if (shuffle === 'true') {
      // Fisher-Yates shuffle algorithm
      for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
      }
    }

    // Pagination
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 1000); // Increased to support full question set
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const startIdx = (pageNum - 1) * limitNum;
    const endIdx = startIdx + limitNum;
    const paginated = filtered.slice(startIdx, endIdx);

    console.log('Questions filtered and paginated', {
      total: allQuestions.length,
      filtered: filtered.length,
      returned: paginated.length,
      page: pageNum,
      limit: limitNum,
      shuffled: shuffle === 'true',
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        questions: paginated,
        pagination: {
          total: filtered.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(filtered.length / limitNum),
          hasMore: endIdx < filtered.length,
        },
        filters: {
          exam,
          topic,
          difficulty,
        },
      }),
    };
  } catch (error) {
    console.error('Error fetching questions:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        error: 'Failed to fetch questions',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
