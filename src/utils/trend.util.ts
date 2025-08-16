import { Model, FilterQuery } from "mongoose";

interface TrendResult {
  currentTotal: number;
  previousTotal: number;
  percentageChange: number;
  trend: "increase" | "decrease" | "no-change";
}

type Period = "week" | "month" | { start: Date; end: Date };

export async function getTrend(
  model: Model<any>,
  options: {
    period: Period;
    dateField?: string;       // defaults to created_at
    sumField?: string;        // if provided, sums this field instead of counting
    filter?: FilterQuery<any>; // extra Mongo filter
    timezoneOffset?: number;  // in hours
  }
): Promise<TrendResult> {
  const {
    period,
    dateField = "created_at",
    sumField,
    filter = {},
    timezoneOffset = 0
  } = options;

  const now = new Date();
  now.setHours(now.getHours() + timezoneOffset);

  let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

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
  } else if (period === "month") {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    previousEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    currentStart = period.start;
    currentEnd = period.end;
    const diff = currentEnd.getTime() - currentStart.getTime();
    previousEnd = new Date(currentStart);
    previousStart = new Date(previousEnd.getTime() - diff);
  }

  // 🔹 Helper to detect array paths
  const extractArrayFields = (obj: Record<string, any>): string[] => {
    return Object.keys(obj).filter(key => key.includes("."));
  };

  const pipeline = (start: Date, end: Date) => {
    const stages: any[] = [];

    // 1. Handle array unwinding if sumField or filter uses dot notation
    const unwindFields = new Set<string>();

    if (sumField?.includes(".")) {
      unwindFields.add(sumField.split(".")[0]);
    }

    extractArrayFields(filter).forEach(f => {
      unwindFields.add(f.split(".")[0]);
    });

    for (const field of unwindFields) {
      stages.push({ $unwind: `$${field}` });
    }

    // 2. Match stage
    stages.push({
      $match: {
        ...filter,
        [dateField]: { $gte: start, $lt: end }
      }
    });

    // 3. Group stage
    stages.push(
      sumField
        ? { $group: { _id: null, total: { $sum: `$${sumField}` } } }
        : { $group: { _id: null, total: { $sum: 1 } } }
    );

    return stages;
  };

  const [currentData] = await model.aggregate(pipeline(currentStart, currentEnd));
  const [previousData] = await model.aggregate(pipeline(previousStart, previousEnd));

  const currentTotal = currentData?.total || 0;
  const previousTotal = previousData?.total || 0;

  let percentageChange = 0;
  let trend: "increase" | "decrease" | "no-change" = "no-change";

  if (previousTotal > 0) {
    percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
    trend =
      currentTotal > previousTotal
        ? "increase"
        : currentTotal < previousTotal
        ? "decrease"
        : "no-change";
  } else if (currentTotal > 0) {
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
