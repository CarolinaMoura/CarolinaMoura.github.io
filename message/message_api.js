import { IMessage } from "./IMessage.js";

/**
 * Returns all the messages to and from userId.
 * 
 * @param graffiti 
 * @param graffitiSession 
 * @param userId 
 */
export async function getMessages(graffiti, graffitiSession, userId) {
    console.log("entrei");
    const messageAsync = await graffiti.discover(
        [userId],
        {
            properties: IMessage
        },
        graffitiSession
    );

    console.log(messageAsync);
}