import { createUser, getAllUsers, getUser, getUserById } from "../../api/user/user_api.js";
import { getMessages, sendMessage } from "../../api/message/message_api.js";
import { Name } from "../name/name.js";
import { trim, wrapper } from "../../utils.js";
import { getTags } from "../../api/tag/tag_api.js";
import { deleteReminder, getReminders } from "../../api/reminder/reminder_api.js";

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
                myMessage: "",
                reminderCollapsed: true,
                messageCollapsed: false,
                workspace: 0,
                allReminders: [],
                doneReminders: []
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
                    const tag = await wrapper(this, getTags, this.user.id, friendId);
                    friends.push({ ...idToUser.get(friendId), lastMsg: msg, tags: [tag.personal, tag.work] });
                }

                friends.sort((a, b) => b.lastMsg.published - a.lastMsg.published);
                this.friends = friends;
            },
            async changeConversation(friend) {
                this.currentConversation = friend;
                this.$router.push(`/inbox/${this.user.id}/${friend.id}`);
            },
            async newConversation(user) {
                this.newChat = false;
                await this.changeConversation(user);
            },
            async sendMessage() {
                if (!this.myMessage) return;

                this.sending = true;

                const msgObject = {
                    content: this.myMessage,
                    published: Date.now(),
                    senderId: this.user.id,
                    receiverId: this.currentConversation.id,
                    id: crypto.randomUUID()
                };

                await this.wrapper(sendMessage, msgObject);

                this.sending = false;
                this.myMessage = "";

                // Refocus the input field after sending the message
                await this.$nextTick();
                await this.updateFriendList();
                this.$refs.messageInput.focus();
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
            isActiveChat(friend) {
                return this.$route.params.id2 === friend.id;
            },
            async deadlinePassed(reminder) {
                // Time ago in minutes
                const timeAgo = (Date.now() - reminder.time) / 60000;
                if (timeAgo < 0) throw new Error("Trying to display a reminder that hasn't passed!");

                function getInterval(minutesAgo) {
                    if (minutesAgo < 60) return "a few minutes ago";
                    const hoursAgo = minutesAgo / 60;
                    if (hoursAgo < 24) return "a few hours ago";
                    const days = hoursAgo / 24;
                    if (days < 7) return "a few days ago";
                    if (days < 365) return " a few weeks ago";
                    return "a few years ago";
                }

                let friend = this.allUsers.filter((user) => user.id === reminder.friendId)[0];
                if (friend === undefined) {
                    this.isLoading = true;
                    friend = await wrapper(this, getUserById, reminder.friendId);
                    this.isLoading = false;
                }

                const reminderObj = {
                    ...reminder,
                    timeString: getInterval(timeAgo),
                    friend: friend
                };
                this.doneReminders.push(reminderObj);
            },
            async clickedDoneReminder(clickedReminder) {
                this.doneReminders = this.doneReminders.filter((reminder) => reminder.url !== clickedReminder.url);
                this.$router.push(`/inbox/${this.user.id}/${clickedReminder.friendId}`);
                await wrapper(this, deleteReminder, clickedReminder.url)
                await this.fetchReminders();
            },
            async fetchReminders() {
                const reminders = await wrapper(this, getReminders, this.user.id)
                this.allReminders = reminders;
                this.doneReminders = [];

                // Separate in deadline passed or deadline hasn't passed
                const rightNow = Date.now();
                this.allReminders.forEach((reminder) => {
                    // If deadline hasn't passed, add timeout
                    if (reminder.time > rightNow) {
                        setTimeout(() => {
                            this.deadlinePassed(reminder);
                        }, reminder.time - rightNow);
                    }
                    // If deadline has passed, include it in the deadline passed list
                    else this.deadlinePassed(reminder);
                });

            }

        },
        props: [],
        template: await fetch("./components/inbox/inbox.html")
            .then(r => r.text()),
        mounted() {
            this.isLoading = true;
            this.newChat = false;
            this.user = undefined;

            this.login().then(async (user) => {
                this.user = user
                this.allUsers = await this.wrapper(getAllUsers);
                this.allMessages = await getMessages(this.$graffiti, this.$graffitiSession, this.user.id);
                await this.updateFriendList();
                this.fetchReminders().then(() => this.isLoading = false);
            });

            this._messagePoller = setInterval(async () => {
                if (!this.user) return;

                const newAllMessages = await getMessages(this.$graffiti, this.$graffitiSession, this.user.id);
                this.allUsers = await this.wrapper(getAllUsers);
                if (!this.allMessages || newAllMessages.length !== this.allMessages.length) {
                    await this.updateFriendList();
                }
                this.allMessages = newAllMessages;


            }, 1000);
        },
        watch: {

        },
        beforeUnmount() {
            clearInterval(this._messagePoller);
        },
    }
}