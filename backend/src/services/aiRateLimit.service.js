import pool from "../utils/db.js";

const DEFAULT_USER_HOURLY_LIMIT = 200;
const DEFAULT_STORE_DAILY_LIMIT = 1000;

const USER_LIMIT_MESSAGE = "AI chat limit reached. Please try again later.";
const STORE_LIMIT_MESSAGE = "Daily AI chat limit for this store has been reached. Please try again tomorrow.";

function parsePositiveInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getAiRateLimitConfig() {
    return {
        userHourlyLimit: parsePositiveInt(
            process.env.AI_CHAT_USER_HOURLY_LIMIT,
            DEFAULT_USER_HOURLY_LIMIT
        ),
        storeDailyLimit: parsePositiveInt(
            process.env.AI_CHAT_STORE_DAILY_LIMIT,
            DEFAULT_STORE_DAILY_LIMIT
        ),
    };
}

function getHourBucketStart(now = new Date()) {
    const bucketStart = new Date(now);
    bucketStart.setMinutes(0, 0, 0);
    return bucketStart;
}

function getDayBucketStart(now = new Date()) {
    const bucketStart = new Date(now);
    bucketStart.setHours(0, 0, 0, 0);
    return bucketStart;
}

async function incrementUsageCounter({
    scopeType,
    scopeId,
    storeId,
    bucketType,
    bucketStart,
}) {
    const result = await pool.query(
        `
            INSERT INTO ai_chat_usage (
                scope_type,
                scope_id,
                store_id,
                bucket_type,
                bucket_start,
                message_count,
                created_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
            ON CONFLICT (scope_type, scope_id, bucket_type, bucket_start)
            DO UPDATE SET
                message_count = ai_chat_usage.message_count + 1,
                store_id = EXCLUDED.store_id,
                updated_at = NOW()
            RETURNING message_count
        `,
        [scopeType, scopeId, storeId, bucketType, bucketStart]
    );

    return Number(result.rows[0]?.message_count || 0);
}

export async function checkAndIncrementAiRateLimit({ storeId, userId }) {
    const { userHourlyLimit, storeDailyLimit } = getAiRateLimitConfig();
    const now = new Date();

    const userCount = await incrementUsageCounter({
        scopeType: "user",
        scopeId: userId,
        storeId,
        bucketType: "hour",
        bucketStart: getHourBucketStart(now),
    });

    const storeCount = await incrementUsageCounter({
        scopeType: "store",
        scopeId: storeId,
        storeId,
        bucketType: "day",
        bucketStart: getDayBucketStart(now),
    });

    if (userCount > userHourlyLimit) {
        return {
            allowed: false,
            reason: "user_hourly_limit",
            status: 429,
            message: USER_LIMIT_MESSAGE,
            limit: userHourlyLimit,
            count: userCount,
        };
    }

    if (storeCount > storeDailyLimit) {
        return {
            allowed: false,
            reason: "store_daily_limit",
            status: 429,
            message: STORE_LIMIT_MESSAGE,
            limit: storeDailyLimit,
            count: storeCount,
        };
    }

    return {
        allowed: true,
        counts: {
            user_hour: userCount,
            store_day: storeCount,
        },
        limits: {
            user_hour: userHourlyLimit,
            store_day: storeDailyLimit,
        },
    };
}
