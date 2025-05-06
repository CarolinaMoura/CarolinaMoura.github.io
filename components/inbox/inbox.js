import { createUser, getAllUsers, getUser } from "../../user/user_api.js";
import { getMessages, sendMessage } from "../../message/message_api.js";
import { Name } from "../name/name.js";
import { trim } from "../../utils.js";

function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
}

export async function Inbox() {
    return {
        components: {
            Name
        },
        data() {
            return {
                isLoading: true,
                user: undefined,
                newChat: false,
                allUsers: [],
                currentConversation: undefined,
                friends: [],
            }
        },
        methods: {
            /**
             * Returns the result of func(this.$graffiti, this.$graffitiSession, ...args). It's a wrapper
             * to avoid repetitive code.
             * 
             * @param func 
             * @param args 
             * @returns the result of func when passed with the graffiti objects and args.
             */
            async wrapper(func, ...args) {
                return func(this.$graffiti, this.$graffitiSession, ...args);
            },
            logout() {
                this.$graffiti.logout(this.$graffitiSession.value);
            },
            async login() {
                const user = await getUser(this.$graffiti, this.$graffitiSession);
                if (user) return user;
                return await createUser(this.$graffiti, this.$graffitiSession);
            },
            allUsersWithoutMe() {
                return this.allUsers.filter((user) => user.actor !== this.user.actor)
            },
            async updateFriendList() {
                if (!this.user) {
                    throw new Error("No user logged in!");
                }

                const idToUser = new Map();
                this.allUsers.forEach((user) => idToUser.set(user.id, user));
                console.log(idToUser)

                // Retrieve all messages
                const allMsgs = await getMessages(this.$graffiti, this.$graffitiSession, this.user.id);
                // Sort them from most recent to least recent
                allMsgs.sort((msg1, msg2) => msg2.published - msg1.published);

                const friends = [];
                const seenFriends = new Set();


                for (const msg of allMsgs) {
                    const friendId = msg.senderId === this.user.id ? msg.receiverId : msg.senderId;
                    if (seenFriends.has(friendId)) continue;
                    seenFriends.add(friendId);
                    friends.push({ ...idToUser.get(friendId), lastMsg: msg });
                }

                friends.sort((a, b) => b.lastMsg.published - a.lastMsg.published);
                this.friends = friends;
            },
            async changeConversation(friend) {
                console.log(friend);
                this.currentConversation = friend;
                this.currentConversationMessages = this.getMessages(this.currentConversation.id);
                await this.$nextTick();
                $$("#message_input")[0].focus();
            },
            async newConversation(user) {
                this.newChat = false;
                await this.changeConversation(user);
            },
            getChannel() {
                return [`${this.user.id}:${this.currentConversation.id}`, `${this.currentConversation.id}:${this.user.id}`];
            },
            async sendMessage() {
                if (!this.myMessage) return;

                this.sending = true;

                const msgObject = {
                    content: this.myMessage,
                    published: Date.now(),
                    senderId: this.user.id,
                    receiverId: this.currentConversation.id,
                };

                await this.wrapper(sendMessage, msgObject);

                this.sending = false;
                this.myMessage = "";

                // Refocus the input field after sending the message
                await this.$nextTick();
                await this.updateFriendList();
                this.$refs.messageInput.focus();
            },
            getHour(timestamp) {
                const date = new Date(timestamp);
                const hours = date.getHours();
                let minutes = date.getMinutes();
                if (minutes < 10) minutes = "0" + minutes;
                return `${hours}:${minutes}`;
            },
            trim(content, amount) {
                return trim(content, amount);
            },
            /**
             * 
             * @param friendId
             * @returns messages sorted from newest (0) to oldest (last index).
             */
            async getMessages(friendId) {
                const ourIds = new Set([friendId, this.user.id]);
                const ret = this.allMessages.filter((msg) => ourIds.has(msg.senderId) && ourIds.has(msg.receiverId));
                return ret.sort((msg1, msg2) => msg2.published - msg1.published);
            },

        },
        props: [],
        template: await fetch("./components/inbox/inbox.html")
            .then(r => r.text()),
        mounted() {
            this.isLoading = true;
            this.newChat = false;
            this.user = undefined;

            this.login().then(async (user) => {
                this.user = user;
                this.allUsers = await this.wrapper(getAllUsers);
                this.allMessages = await getMessages(this.$graffiti, this.$graffitiSession, this.user.id);
                await this.updateFriendList();
                this.isLoading = false;
            });

            this._messagePoller = setInterval(async () => {
                if (!this.user) return;
                const newAllMessages = await getMessages(this.$graffiti, this.$graffitiSession, this.user.id);
                this.allUsers = await this.wrapper(getAllUsers);
                console.log(newAllMessages, this.allMessages);
                if (!this.allMessages || newAllMessages.length !== this.allMessages.length) {
                    await this.updateFriendList();
                }
                this.allMessages = newAllMessages;
            }, 1000);
        },
        beforeUnmount() {
            clearInterval(this._messagePoller);
        },
    }
}