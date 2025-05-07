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