export const IMessage = {
    content: { type: 'string' },
    published: { type: 'number' },
    senderId: { type: 'string' },
    receiverId: { type: 'string' },
    id: { type: 'string' }
}


/**
 * Returns all the messages to and from userId.
 * 
 * @param graffiti 
 * @param graffitiSession 
 * @param userId 
 */
export async function getMessages(graffiti, graffitiSession, userId) {
    const messageAsync = await graffiti.discover(
        [userId],
        {
            properties: IMessage
        },
        graffitiSession.value
    );

    const messages = [];
    for await (const msgWrapper of messageAsync) {
        const msg = msgWrapper.object.value;
        messages.push(msg);
    }

    return messages;
}

export async function sendMessage(graffiti, graffitiSession, msgObject) {
    await graffiti.put(
        {
            value: msgObject,
            channels: [`${msgObject.senderId}:${msgObject.receiverId}`, `${msgObject.receiverId}:${msgObject.senderId}`,
            `${msgObject.senderId}`, `${msgObject.receiverId}`]
        },
        graffitiSession.value,
    );
}
