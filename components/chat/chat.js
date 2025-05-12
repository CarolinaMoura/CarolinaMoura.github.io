import { getUser, getUserById } from "../../api/user/user_api.js";
import { getMessages, sendMessage, IMessage } from "../../api/message/message_api.js";
import { trim, wrapper } from "../../utils.js";
import { createTag, getTags, updateTag } from "../../api/tag/tag_api.js";
import { createReminder } from "../../api/reminder/reminder_api.js";
import { createScheduled, deleteScheduled, getScheduled } from "../../api/scheduled/scheduled_api.js";

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
                manageTags: false,
                personal: true,
                work: false,
                personalEdit: false,
                workEdit: false,
                tagUrl: null,
                calendar: false,
                newScheduled: false,
                scheduledDate: null,
                scheduledMessage: "",
                scheduled: [],
                qtty: 0
            }
        },
        emits: ["updateFriendList", "createdReminder"],
        props: ["id1", "id2"],
        template: await fetch("./components/chat/chat.html")
            .then(r => r.text()),
        methods: {
            getChannel() {
                return [`${this.id1}:${this.id2}`, `${this.id2}:${this.id1}`];
            },
            closeManageTags() {
                this.manageTags = false;
                this.personalEdit = this.personal;
                this.workEdit = this.work;
            },
            openManageTags() {
                this.personalEdit = this.personal;
                this.workEdit = this.work;
                this.manageTags = true;

                const escListener = (evt) => {
                    if (evt.key !== 'Escape') return;
                    this.closeManageTags();
                    document.removeEventListener(escListener);
                };

                document.addEventListener("keydown", escListener);
            },
            async submitTags() {
                this.isLoading = true;
                await wrapper(this, updateTag, this.personalEdit, this.workEdit, this.tagUrl);
                this.personal = this.personalEdit;
                this.work = this.workEdit;
                this.isLoading = false;
                this.manageTags = false;
                this.$emit("updateFriendList");
            },
            minutesToMiliseconds(minutes) {
                return minutes * 60000;
            },
            async submitReminder() {
                const time = (this.reminderTime === "custom") ? (parseInt(this.customNumber) * parseInt(this.timeUnit)) : (this.reminderTime * 60);
                const reminderObj = {
                    content: this.reminderObj.value.content,
                    userId: this.user.id,
                    friendId: this.friend.id,
                    msgUrl: this.reminderObj.url,
                    time: Date.now() + this.minutesToMiliseconds(time)
                };
                this.isLoading = true;
                await wrapper(this, createReminder, reminderObj);
                this.$emit("createdReminder");
                this.closeReminder();
                this.isLoading = false;
                setTimeout(() => alert("Reminder added!"), 500);
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
            measureQtt(msgs) {
                const newLength = msgs.length;
                if (newLength > this.qtty) {
                    const allMsgs = document.querySelector("#messages");
                    allMsgs.scrollTop = allMsgs.scrollHeight + 1000;
                    this.qtty = newLength;
                }
                return msgs;
            },
            async sendMessage() {
                if (!this.myMessage) return;

                this.sending = true;

                const msgObject = {
                    content: this.myMessage,
                    published: Date.now(),
                    senderId: this.user.id,
                    receiverId: this.friend.id,
                    id: crypto.randomUUID()
                };

                await wrapper(this, sendMessage, msgObject);

                this.sending = false;
                this.myMessage = "";

                // Refocus the input field after sending the message
                await this.$nextTick();
                this.$emit("updateFriendList");

                this.$refs.messageInput.focus();

                const messages = document.querySelector("#messages");
                messages.hasScrolled = false;

            },
            trim(str, char) {
                return trim(str, char);
            },


            // ------------ Calendar stuff ------------
            closeCalendar() {
                this.calendar = false;
                this.newScheduled = false;
            },
            openCalendar() {
                this.calendar = true;
            },
            clickNew() {
                this.newScheduled = true;
                this.scheduledMessage = "";
                // Get date right now +1 hour
                this.scheduledDate = this.getLocalTimestamp(1);
            },
            getLocalTimestamp(plusHours) {
                const now = new Date();
                now.setHours(now.getHours() + plusHours);
                const pad = (n) => String(n).padStart(2, '0');

                const YYYY = now.getFullYear();
                const MM = pad(now.getMonth() + 1);
                const DD = pad(now.getDate());
                const hh = pad(now.getHours());
                const mm = pad(now.getMinutes());

                return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
            },
            convertFromLocalTimestamp(timeString) {
                return new Date(timeString).getTime();
            },
            async submitScheduled() {
                const scheduledObj = {
                    time: this.convertFromLocalTimestamp(this.scheduledDate),
                    senderId: this.user.id,
                    receiverId: this.friend.id,
                    content: this.scheduledMessage,
                    id: crypto.randomUUID()
                };
                this.isLoading = true;
                await wrapper(this, createScheduled, scheduledObj);
                this.getScheduled();
                this.isLoading = false;
                this.closeCalendar();
                setTimeout(() => alert("Message scheduled!"), 500);
            },
            async getScheduled() {
                const allScheduled = await wrapper(this, getScheduled);
                this.scheduled = allScheduled.filter((msg) => msg.senderId === this.user.id);
            },
            formatCalendardDate(milliseconds) {
                const date = new Date(milliseconds);
                const month = date.toLocaleString('default', { month: 'short' });
                const day = date.getDate();
                const year = date.getFullYear();
                const hours = date.getHours();
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return `${month} ${day}, ${year} at ${hours}:${minutes}`;
            },
            async deleteScheduled(msg) {
                this.isLoading = true;
                await wrapper(this, deleteScheduled, msg.url);
                await this.getScheduled();
                this.isLoading = false;
            }
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
                    this.user = await wrapper(this, getUser);

                    if (![this.id1, this.id2].includes(this.user.id)) {
                        this.notAllowedError = true;
                        return;
                    }

                    this.friendId = this.id1;

                    if (this.user.id === this.id1) {
                        this.friendId = this.id2;
                    }

                    this.friend = await wrapper(this, getUserById, this.friendId)

                    await wrapper(this, getTags, this.user.id, this.friendId).then((tag) => {
                        this.work = tag.work;
                        this.personal = tag.personal;
                        this.tagUrl = tag.url;
                    });

                    await this.getScheduled();

                    this.isLoading = false;

                    this.$nextTick().then(() => {
                        if (this.$refs.messageInput) {
                            this.$refs.messageInput.focus();
                        }
                    });



                }
            }
        }
    }
}