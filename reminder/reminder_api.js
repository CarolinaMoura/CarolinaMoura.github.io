import { REMINDER_CHANNEL } from "../consts.js";

export const IReminder = {
    content: { type: 'string' },
    userId: { type: 'string' },
    msgUrl: { type: 'string' },
    time: { type: 'number' }
}


export async function createReminder(graffiti, graffitiSession, reminderObj) {
    await graffiti.put(
        {
            value: reminderObj,
            channels: [`${REMINDER_CHANNEL}/${reminderObj.userId}`]
        },
        graffitiSession.value,
    );
}