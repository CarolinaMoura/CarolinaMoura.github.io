export default class User {
    ALL_USERS_CHANNEL = "c61fb232-2dd8-41cf-99f2-8f2c287db9ac";
    ANIMALS = ["cat", "chicken", "panda", "rabbit", "koala", "sea-lion", "giraffe", "puffer-fish", "penguin", "sloth"];

    constructor() {
    }

    async initialization(graffiti, session) {
        this.graffiti = graffiti;
        this.session = session;
        this.user = session.actor;
        const { inbox, picture } = await this.getInbox(this.graffiti, this.session);
        this.inbox = inbox;
        this.picture = picture;
    }

    async add(graffiti, session) {
        await graffiti.put(
            {
                value: {
                    user: session.actor,
                    inbox: crypto.randomUUID(),
                    picture: this.ANIMALS[Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] % this.ANIMALS.length)]
                },
                channels: [this.ALL_USERS_CHANNEL],
            },
            session
        );
    }


    async getInbox(graffiti, session) {
        const inboxGenerator = await graffiti.discover(
            [this.ALL_USERS_CHANNEL],
            {
                properties: {
                    user: { type: 'string' },
                    inbox: { type: "string" },
                    picture: { type: "string" }
                }
            },
            session
        );

        for await (const entry of inboxGenerator) {
            if (entry.object.value.user === session.actor) {
                return {
                    inbox: entry.object.value.inbox,
                    picture: entry.object.value.picture
                }

            }
        }

        await this.add(graffiti, session);
        return await this.getInbox(graffiti, session);
    }
}