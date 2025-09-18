import dayjs from "dayjs";
import cron from "node-cron";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import Bonus from "../models/Bonus";
import isBetween from "dayjs/plugin/isBetween";
import { JOL_Paystack_API } from "../utils/paystack";

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(isBetween);
dayjs.tz.setDefault("Africa/Lagos");

// Runs every Sunday at 11:59 PM
cron.schedule("*/1 * * * *", () => {
  console.log(" working on bonus update:");
  const timeZonedDayjs = dayjs.tz();
  // call your bonus calculation service here
  const calculateBonuses = async () => {
    const lastFriday = timeZonedDayjs.day(5).subtract(1, "week").startOf("day");
    const thisThursday = timeZonedDayjs.day(4).startOf("day");
    console.log("lastFriday :", lastFriday.format("YYYY-MM-DD"));
    console.log("thisThursday :", thisThursday.format());

    const pendingBonuses = await Bonus.find({
      status: "pending",
    });

    pendingBonuses.forEach((bonus) => {
      const startingPeriod = dayjs(bonus.period.start_date).isBetween(
        lastFriday,
        thisThursday,
        null,
        "[]"
      );
      const endPeriod = dayjs(bonus.period.end_date).isBetween(
        lastFriday,
        thisThursday,
        null,
        "[]"
      );
      // if (startingPeriod && endPeriod) {
      //   const transfer = await JOL_Paystack_API.get
      //   bonus.status = "due";
      //   bonus.save();
      //   console.log("Bonus marked as due for bonus_id:", bonus.bonus_id);
      // }
    });

    // console.log("pendingBonuses :", pendingBonuses);
  };
  calculateBonuses();
});
