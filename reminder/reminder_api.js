import { REMINDER_CHANNEL } from "../consts.js";

export const IReminder = {
    content: { type: 'string' },
    userId: { type: 'string' },
    friendId: { type: 'string' },
    msgUrl: { type: 'string' },
    id: { type: 'string' },
    time: { type: 'number' }
}


export async function createReminder(graffiti, graffitiSession, reminderObj) {
    await graffiti.put(
        {
            value: {
                ...reminderObj,
                id: crypto.randomUUID()
            },
            channels: [`${REMINDER_CHANNEL}/${reminderObj.userId}`]
        },
        graffitiSession.value,
    );
}

export async function deleteReminder(graffiti, graffitiSession, objUrl) {
    await graffiti.delete(
        objUrl, graffitiSession.value
    );
}

export async function getReminders(graffiti, graffitiSession, userId) {
    const reminderAsync = await graffiti.discover(
        [`${REMINDER_CHANNEL}/${userId}`],
        {
            properties: IReminder
        },
        graffitiSession.value
    );

    const reminders = [];
    for await (const reminderWrapper of reminderAsync) {
        const reminder = reminderWrapper.object.value;
        reminders.push({
            ...reminder,
            url: reminderWrapper.object.url
        });
    }

    return reminders;
}