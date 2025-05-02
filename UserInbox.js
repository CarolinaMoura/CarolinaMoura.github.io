export default class UserInbox {
    ALL_USERS_CHANNEL = "c61fb232-2dd8-41cf-99f2-8f2c287db9ac";
    cached = undefined;

    constructor() { }

    async add(graffiti, session) {
        await graffiti.put(
            {
                value: {
                    user: session.actor,
                    inbox: crypto.randomUUID(),
                },
                channels: [this.ALL_USERS_CHANNEL],
            },
            session
        );
    }

    async getInbox(graffiti, session) {
        if (this.cached) {
            return this.cached;
        }

        const inboxGenerator = await graffiti.discover(
            [this.ALL_USERS_CHANNEL],
            {
                properties: {
                    user: { type: 'string' },
                    inbox: { type: "string" }
                }
            },
            session
        );

        for await (const entry of inboxGenerator) {
            if (entry.object.value.user === session.actor) {
                this.cached = entry.object.value.user;
                return this.cached;
            }
        }

        await this.add(graffiti, session);
        return this.getInbox(user, graffiti, session);
    }
}