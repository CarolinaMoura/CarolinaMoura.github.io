import { USER_CHANNEL, ANIMALS } from "../consts.js";

export async function getAllUsers(graffiti, graffitiSession) {
    const asyncGenerator = await graffiti.discover(
        USER_CHANNEL,
        {
            properties: {
                name: { type: 'string' },
                pronouns: { type: "string" },
                id: { type: "string" },
                actor: { type: "string" },
                picture: { type: "string" },
                bio: { type: "string" },
            }
        },
        graffitiSession.value
    );

    const users = [];
    for await (const entry of asyncGenerator) {
        const randomPicture = randomAnimal();

        users.push({
            name: entry.object.value.name,
            pronouns: entry.object.value.pronouns,
            id: entry.object.value.id,
            actor: entry.object.value.actor,
            picture: entry.object.value.picture ?? randomPicture,
            bio: entry.object.value.bio ?? "",
            url: entry.object.url,
        });
    };

    return users;
}

export async function createUser(graffiti, graffitiSession) {
    await graffiti.put(
        {
            value: {
                name: formatNameFromActor(graffitiSession.value.actor),
                pronouns: ["they", "them"],
                describes: graffitiSession.value.actor,
                generator: "https://carolinamoura.github.io/",
                id: crypto.randomUUID(),
                actor: graffitiSession.value.actor,
                picture: randomAnimal(),
                bio: "",
            },
            channels: USER_CHANNEL
        },
        graffitiSession.value,
    );
    return await getUser(graffiti, graffitiSession);
}

export async function getUser(graffiti, graffitiSession) {
    const allUsers = await getAllUsers(graffiti, graffitiSession);
    return allUsers.find((user) => user.actor === graffitiSession.value.actor);
}

export async function updateUser(graffiti, graffitiSession, patchValue, url) {
    await graffiti.patch(
        {
            value: patchValue,
        },
        url,
        graffitiSession.value,
    );
}

function formatNameFromActor(actor) {
    if (actor.includes("id.inru")) {
        const split = actor.split("/");
        return split[split.length - 1];
    }
    return actor;
}

/**
 * Returns a random integer in [min; max].
 * @param L minimum value (inclusive). Has to be an integer.
 * @param R maximum value (inclusive). Has to be an integer.
 */
function randomInteger(L, R) {
    return Math.floor(Math.random() * (R - L + 1)) + L;
}

function randomAnimal() {
    return ANIMALS[randomInteger(0, ANIMALS.length - 1)];
}