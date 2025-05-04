import { createApp } from "vue";
import { GraffitiLocal } from "@graffiti-garden/implementation-local";
import { createRouter, createWebHashHistory } from "vue-router";
import { GraffitiRemote } from "@graffiti-garden/implementation-remote";
import { defineAsyncComponent } from "vue";
import { GraffitiPlugin } from "@graffiti-garden/wrapper-vue";
import User from "./User.js";
import { createUser, getAllUsers, getUser } from "./user/user_api.js";
import { Profile } from "./components/profile/profile.js";
import { Name } from "./components/name/name.js";
import { getMessages, sendMessage } from "./message/message_api.js";


function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

// const router = createRouter({
//   history: createWebHashHistory(),
//   routes: [
//     { path: "/profile/:profileId", component: Profile, props: true},
//     // { path: "/chat/:chatId", component: Chat, props: true },
//     // { path: "/profile/:profileId", component: Profile, props: true },
//   ],
// });

createApp({
  data() {
    return {
      profiling: false,
      myMessage: "",
      newChatName: "",
      sending: false,
      username: "",
      channels: ["designftw"],
      userImage: "img/bird.png",
      user: undefined,
      isLoading: false,
      newChat: false,
      allUsers: [],
      friends: [],
      currentConversation: undefined,
      currentConversationMessages: [],
      hoveredMsg: null,
      openMenuMsg: null,
      allMessages: undefined,
    };
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
    getHour(timestamp) {
      const date = new Date(timestamp);
      const hours = date.getHours();
      let minutes = date.getMinutes();
      if (minutes < 10) minutes = "0" + minutes;
      return `${hours}:${minutes}`;
    },

    toggleMenu(msgKey) {
      this.openMenuMsg = this.openMenuMsg === msgKey ? null : msgKey;
    },

    editMessage(obj) { console.log('edit', obj) },
    deleteMessage(obj) { console.log('delete', obj) },

    logout() {
      this.currentConversation = undefined;
      this.currentConversationMessages = [];
      this.user = undefined;
      this.friends = [];
      this.allMessages = undefined;
      this.$graffiti.logout(this.$graffitiSession.value);
    },

    async updateProfile() {
      this.profiling = false;
      this.isLoading = true;
      await this.login();
      this.isLoading = false;
    },

    allUsersWithoutMe() {
      return this.allUsers.filter((user) => user.actor !== this.user.actor)
    },

    async getFriends() {
      if (!this.user) {
        throw new Error("No user logged in!");
      }
      await this.getAllUsers();

      const idToUser = new Map();
      this.allUsers.map((user) => idToUser.set(user.id, user));

      // Retrieve all messages
      const allMsgs = await getMessages(this.$graffiti, this.$graffitiSession, this.user.id);
      // Sort them from most recent to least recent
      allMsgs.sort((msg1, msg2) => msg2.published - msg1.published);

      const friends = [];
      const seenFriends = new Set();

      console.log("entrei");

      for (const msg of allMsgs) {
        const friendId = msg.senderId === this.user.id ? msg.receiverId : msg.senderId;
        if (seenFriends.has(friendId)) continue;
        seenFriends.add(friendId);
        friends.push({ ...idToUser.get(friendId), lastMsg: msg });
      }

      friends.sort((a, b) => b.lastMsg.published - a.lastMsg.published);
      return friends;
    },

    async changeConversation(friend) {
      this.currentConversation = friend;
      this.currentConversationMessages = this.getMessages(this.currentConversation.id);
      await this.$nextTick();
      $$("#message_input")[0].focus();
    },

    trim(lastText) {
      if (lastText.length > 20) {
        return lastText.substring(0, 20) + "...";
      }
      return lastText;
    },

    async getLastText(user) {
      const messages = await this.getMessages(user.id);
      console.log(messages[0])
      return messages ? undefined : messages[0];
    },

    async newConversation(user) {
      this.newChat = false;
      await this.changeConversation(user);
    },

    async getAllUsers() {
      const allUsers = await getAllUsers(this.$graffiti, this.$graffitiSession);
      this.allUsers = allUsers;
      return allUsers;
    },

    getChannel() {
      return [`${this.user.id}:${this.currentConversation.id}`, `${this.currentConversation.id}:${this.user.id}`];
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
      await this.getFriends();
      this.$refs.messageInput.focus();
    },
    async createNewGroup(session) {
      if (!this.newChatName) return;
      await this.$graffiti.put(
        {
          value: {
            activity: 'Create',
            object: {
              type: 'Group Chat',
              name: this.newChatName,
              channel: crypto.randomUUID(),
            }
          },
          channels: this.channels
        },
        session

      );
      this.newChatName = "";
    },
    getUsername(actorName) {
      return actorName.slice(0, 15);
    },
    async login() {
      let user = await getUser(this.$graffiti, this.$graffitiSession);
      console.log(user, this.profiling);
      if (user) {
        this.user = user;
        return;
      }
      this.user = await createUser(this.$graffiti, this.$graffitiSession);
      this.profiling = true;
    },
  },
  mounted() {
    const unwatch = this.$watch('$graffitiSession.value', async (session) => {
      if (!session) return;
      this.profiling = false;
      this.isLoading = true;

      await this.login();
      await this.getAllUsers();
      this.friends = await this.getFriends();
      this.isLoading = false;
    });

    this._messagePoller = setInterval(async () => {
      if (!this.user) return;
      const newAllMessages = await getMessages(this.$graffiti, this.$graffitiSession, this.user.id);
      if (!this.allMessages || newAllMessages.length !== this.allMessages.length) {
        this.friends = await this.getFriends();
      }
      this.allMessages = newAllMessages;
    }, 1000);
  },

  beforeUnmount() {
    clearInterval(this._messagePoller);
  },

  components: {
    Profile: defineAsyncComponent(Profile),
    Name: defineAsyncComponent(Name)
  }

})
  .use(GraffitiPlugin, {
    // graffiti: new GraffitiRemote(),
    graffiti: new GraffitiLocal(),
    autoLogin: true,
  }).directive('scroll-bottom', {
    // called after the bound element’s children have updated
    updated(el) {
      el.scrollTop = el.scrollHeight;
    }
  })
  .mount("#app");
