"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrend = getTrend;
async function getTrend(model, options) {
    const { period, dateField = "created_at", sumField, filter = {}, timezoneOffset = 0 } = options;
    const now = new Date();
    now.setHours(now.getHours() + timezoneOffset);
    let currentStart, currentEnd, previousStart, previousEnd;
    if (period === "week") {
        currentStart = new Date(now);
        currentStart.setDate(now.getDate() - now.getDay());
        currentStart.setHours(0, 0, 0, 0);
        currentEnd = new Date(currentStart);
        currentEnd.setDate(currentStart.getDate() + 7);
        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 7);
        previousEnd = new Date(previousStart);
        previousEnd.setDate(previousStart.getDate() + 7);
    }
    else if (period === "month") {
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    else {
        currentStart = period.start;
        currentEnd = period.end;
        const diff = currentEnd.getTime() - currentStart.getTime();
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd.getTime() - diff);
    }
    const pipeline = (start, end) => {
        const matchStage = {
            $match: {
                ...filter,
                [dateField]: { $gte: start, $lt: end }
            }
        };
        const sumOrCountStage = sumField
            ? { $group: { _id: null, total: { $sum: `$${sumField}` } } }
            : { $group: { _id: null, total: { $sum: 1 } } };
        return [matchStage, sumOrCountStage];
    };
    const [currentData] = await model.aggregate(pipeline(currentStart, currentEnd));
    const [previousData] = await model.aggregate(pipeline(previousStart, previousEnd));
    const currentTotal = currentData?.total || 0;
    const previousTotal = previousData?.total || 0;
    let percentageChange = 0;
    let trend = "no-change";
    if (previousTotal > 0) {
        percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
        trend = currentTotal > previousTotal ? "increase" :
            currentTotal < previousTotal ? "decrease" : "no-change";
    }
    else if (currentTotal > 0) {
        percentageChange = 100;
        trend = "increase";
    }
    return {
        currentTotal,
        previousTotal,
        percentageChange: Math.round(percentageChange * 100) / 100,
        trend,
    };
}
