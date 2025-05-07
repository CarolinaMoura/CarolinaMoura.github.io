import { getUser, getUserById } from "../../user/user_api.js";
import { getMessages, sendMessage } from "../../message/message_api.js";
import { wrapper } from "../../utils.js";

export function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
}


export async function Chat() {
    return {
        data() {
            return {
                isLoading: false,
                user: undefined,
                notAllowedError: false,
                friendId: undefined,
                myMessage: "",
                sending: false,
                hoveredMsg: null,
                newReminder: false,
                custom: false,
                timeUnit: 1,
                reminderTime: 1,
                reminderObj: null,
                customNumber: 1,
            }
        },
        emits: ["updateFriendList"],
        props: ["id1", "id2"],
        template: await fetch("./components/chat/chat.html")
            .then(r => r.text()),
        methods: {
            getChannel() {
                return [`${this.id1}:${this.id2}`, `${this.id2}:${this.id1}`];
            },
            submitReminder() {
                const time = (this.reminderTime === "custom") ? (parseInt(this.customNumber) * parseInt(this.timeUnit)) : (this.reminderTime * 60);
                console.log(time);
                const reminderObj = {
                    content: this.reminderObj.value.content,
                    userId: this.user.id,
                    msgUrl: this.reminderObj.url,
                    // time: Date.now() + 
                }
            },
            closeReminder() {
                this.reminderTime = 1;
                this.timeUnit = 1;
                this.customNumber = 1;
                this.newReminder = false;
            },
            addReminder(msg) {
                this.newReminder = true;
                this.reminderObj = msg;
                const escListener = (evt) => {
                    if (evt.key !== 'Escape') return;
                    this.closeReminder();
                    document.removeEventListener(escListener);
                };

                document.addEventListener("keydown", escListener);
            },
            toggleCustom() {
                // Clean all states
                this.timeUnit = timeUnitDefault;
                this.custom = false;
                this.custom = !this.custom;
            },
            getHour(timestamp) {
                const date = new Date(timestamp);
                const hours = date.getHours();
                let minutes = date.getMinutes();
                if (minutes < 10) minutes = "0" + minutes;
                return `${hours}:${minutes}`;
            },
            async sendMessage() {
                if (!this.myMessage) return;

                this.sending = true;

                const msgObject = {
                    content: this.myMessage,
                    published: Date.now(),
                    senderId: this.user.id,
                    receiverId: this.friend.id
                };

                await wrapper(this, sendMessage, msgObject);

                this.sending = false;
                this.myMessage = "";

                // Refocus the input field after sending the message
                await this.$nextTick();
                this.$emit("updateFriendList");
                this.$refs.messageInput.focus();
            },
        },
        computed: {
            chatIds() {
                return [this.id1, this.id2];
            }
        },
        mounted() {
        },
        watch: {

            chatIds: {
                immediate: true,
                async handler() {
                    this.isLoading = true;
                    this.notAllowedError = false;
                    wrapper(this, getUser).then((user) => {
                        this.user = user;


                        if (![this.id1, this.id2].includes(user.id)) {
                            this.notAllowedError = true;
                            return;
                        }

                        this.friendId = this.id1;

                        if (user.id === this.id1) {
                            this.friendId = this.id2;
                        }

                        wrapper(this, getUserById, this.friendId).then(async (friend) => {
                            this.friend = friend;
                            this.isLoading = false;
                            this.$nextTick().then(() => {
                                if (this.$refs.messageInput) {
                                    this.$refs.messageInput.focus();
                                }
                            });
                        });
                    });
                }
            }
        }
    }
}