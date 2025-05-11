import { TAG_CHANNEL } from "../../consts.js";

export const ITag = {
    work: { type: 'boolean' },
    personal: { type: 'boolean' },
}

export async function updateTag(graffiti, graffitiSession, personal, work, tagUrl) {
    const patchOps = [
        { op: "replace", path: "/work", value: work },
        { op: "replace", path: "/personal", value: personal },
    ];

    await graffiti.patch(
        {
            value: patchOps,
        },
        tagUrl,
        graffitiSession.value,
    );
}

export async function createTag(graffiti, graffitiSession, userId, friendId) {
    await graffiti.put(
        {
            value: {
                work: false,
                personal: true,
            },
            channels: [`${TAG_CHANNEL}/${userId}/${friendId}`]
        },
        graffitiSession.value,
    );
}

export async function getTags(graffiti, graffitiSession, userId, friendId) {
    const tagsAsync = await graffiti.discover(
        [`${TAG_CHANNEL}/${userId}/${friendId}`],
        {
            properties: ITag
        },
        graffitiSession.value
    );

    const tags = [];
    for await (const tagWrapper of tagsAsync) {
        const tag = tagWrapper.object.value;
        tags.push({
            work: tag.work,
            personal: tag.personal,
            url: tagWrapper.object.url
        });
    }

    if (tags.length === 0) {
        await createTag(graffiti, graffitiSession, userId, friendId);
        return getTags(graffiti, graffitiSession, userId, friendId);
    }

    return tags[0];

}