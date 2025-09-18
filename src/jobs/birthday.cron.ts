import cron from "node-cron";
import User from "../models/User";
import dayjs from "dayjs";
import { sendEmail } from "../services/mail.service";
import { CelebrationModel } from "../models/Celebration";

// Runs every Sunday at 11:59 PM
cron.schedule("*/1 * * * *", () => {
  console.log(" working on birthday update:");

  // call your bonus calculation service here
  const findUsersWithBirthdays = async () => {
    console.log(" working on birthday updatex2:");
    const today = dayjs().format("D").toString();
    const month = dayjs().format("M").toString();
    // Find users with birthdays today
    const users = await User.find({
      "dob.day": today,
      "dob.month": month,
      // is_active: true,
      is_verified: true,
      // user_role: { $ne: "admin" },
      status: "approved",
    }).select("first_name last_name email dob");

    users.forEach(async (user) => {
      const checkIfCelebrationModelExist = await CelebrationModel.findOne({
        user_id: user?.id,
      });
      console.log("working on :", user?.first_name);
      console.log("user_id :", user?.id);

      if (!checkIfCelebrationModelExist) {
        const celebration = await CelebrationModel.create({
          user_id: user._id,
          dob: {
            day: today,
            month,
          },
          type: "birthday",
          date: new Date(),
          message: `Happy Birthday, ${user.first_name}! Wishing you a wonderful year ahead.`,
          title: "Happy Birthday!",
          icon: "",
        });

        user.celebrations =
          !user?.celebrations || user?.celebrations?.length <= 0
            ? ([celebration._id] as string[])
            : [...user?.celebrations, celebration._id as string];
        user.save();

        sendEmail(
          user?.email,
          "Happy Birthday!",

          `Dear ${user?.first_name},\n\nWishing you a fantastic birthday filled with joy and success!\n\nBest wishes,\nYour Company`
        );
        return;
      }

      if (
        checkIfCelebrationModelExist?.status !== "expired" &&
        dayjs(checkIfCelebrationModelExist.created_at).isAfter(
          dayjs().add(1, "day")
        )
      ) {
        console.log("updated :");

        checkIfCelebrationModelExist.status = "expired";
        checkIfCelebrationModelExist.save();
      }
    });
  };

  findUsersWithBirthdays();
});
