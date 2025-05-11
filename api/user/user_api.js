import { USER_CHANNEL, ANIMALS } from "../../consts.js";

export async function getAllUsers(graffiti, graffitiSession, channel = USER_CHANNEL) {
    const asyncGenerator = await graffiti.discover(
        [channel],
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

        const data = entry.object.value;
        users.push({
            name: data.name,
            pronouns: data.pronouns,
            id: data.id,
            actor: data.actor,
            generator: data.generator,
            picture: data.picture ?? randomPicture,
            bio: data.bio ?? "",
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
                pronouns: [],
                describes: graffitiSession.value.actor,
                generator: "https://carolinamoura.github.io/",
                id: crypto.randomUUID(),
                actor: graffitiSession.value.actor,
                picture: randomAnimal(),
                bio: "",
            },
            channels: [USER_CHANNEL]
        },
        graffitiSession.value,
    );
    return await getUser(graffiti, graffitiSession);
}

export async function getUser(graffiti, graffitiSession) {
    const allUsers = await getAllUsers(graffiti, graffitiSession);
    return allUsers.find((user) => user.actor === graffitiSession.value.actor);
}

export async function getUserById(graffiti, graffitiSession, userId) {
    const allUsers = await getAllUsers(graffiti, graffitiSession);
    return allUsers.find((user) => user.id === userId);
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