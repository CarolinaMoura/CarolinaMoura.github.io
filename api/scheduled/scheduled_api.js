import { SCHEDULED_CHANNEL } from "../../consts.js";
import { deleteObj } from "../../utils.js";

export const IScheduled = {
    content: { type: 'string' },
    senderId: { type: 'string' },
    receiverId: { type: 'string' },
    time: { type: 'number' }
}

const IDeleted = {
    url: { type: 'string' }
}

function deletedScheduledChannel() {
    return `${SCHEDULED_CHANNEL}+"erased"`;
}

export async function createScheduled(graffiti, graffitiSession, scheduledObj) {
    await graffiti.put(
        {
            value: scheduledObj,
            channels: [SCHEDULED_CHANNEL]
        },
        graffitiSession.value,
    );
}

export async function deleteScheduled(graffiti, graffitiSession, objUrl) {
    await graffiti.put(
        {
            value: {
                url: objUrl
            },
            channels: [deletedScheduledChannel()]
        },
        graffitiSession.value,
    );
}

export async function getScheduled(graffiti, graffitiSession) {
    const scheduledAsync = await graffiti.discover(
        [SCHEDULED_CHANNEL],
        {
            properties: IScheduled
        },
        graffitiSession.value
    );
    const deletedAsync = await graffiti.discover(
        [deletedScheduledChannel()],
        {
            properties: IDeleted

        },
        graffitiSession.value);

    const deletedSet = new Set();

    for await (const deleted of deletedAsync) {
        deletedSet.add(deleted.object.value.url);
    }

    const scheduleds = [];
    for await (const scheduledWrapper of scheduledAsync) {
        const scheduled = scheduledWrapper.object.value;
        const url = scheduledWrapper.object.url;

        if (deletedSet.has(url)) continue;

        scheduleds.push({
            ...scheduled,
            url: url
        });
    }

    return scheduleds;
}