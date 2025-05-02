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

const ALL_USERS_CHANNEL = "c61fb232-2dd8-41cf-99f2-8f2c287db9ac";

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
      user: new User(),
      isLoading: false,
      newChat: false,
      allUsers: [],
      friends: [],
      currentConversation: undefined,
      currentConversationMessages: [],
      hoveredMsg: null,
      openMenuMsg: null
    };
  },


  methods: {

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
      this.friends = [];
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
      await this.getAllUsers();
      this.friends = [];
      for (const user of this.allUsers) {
        const msgs = await this.getMessages(user.id);
        if (msgs.length > 0) {
          this.friends.push({ ...user, lastMsg: msgs[0] });
        }
      }

      this.friends.sort((a, b) => b.lastMsg.published - a.lastMsg.published);
    },

    async changeConversation(friend) {
      this.isLoading = true;
      this.currentConversation = friend;
      this.currentConversationMessages = await this.getMessages(this.currentConversation.id);
      $$("#message_input")[0].focus();

      this.isLoading = false;
    },

    trim(lastText) {
      if (lastText.length > 20) {
        return lastText.substring(0, 20) + "...";
      }
      return lastText;
    },

    async getLastText(user) {
      console.log('entrei');
      const messages = await this.getMessages(user.id);
      console.log(messages[0])
      return messages ? undefined : messages[0];
    },

    async newConversation(user) {
      this.newChat = false;
      await this.changeConversation(user);
    },

    async getAllUsers() {
      this.allUsers = await getAllUsers(this.$graffiti, this.$graffitiSession);
    },

    getChannel() {
      return [`${this.user.id}:${this.currentConversation.id}`, `${this.currentConversation.id}:${this.user.id}`];
    },

    /**
     * 
     * @param {*} friend_id 
     * @returns messages sorted from newest (0) to oldest (last index).
     */
    async getMessages(friend_id) {
      const messageAsyncGenerator = this.$graffiti.discover(
        [`${this.user.id}:${friend_id}`],
        {
          properties: {
            content: { type: "string" },
            published: { type: "number" },
          },
        }
      );

      const ret = [];
      for await (const entry of messageAsyncGenerator) {
        ret.push({
          content: entry.object.value.content,
          published: entry.object.value.published,
        });
      }
      return ret.sort((msg1, msg2) => msg2.published - msg1.published);
    },

    async sendMessage() {
      if (!this.myMessage) return;

      this.sending = true;

      await this.$graffiti.put(
        {
          value: {
            required: ["content", "published"],
            content: this.myMessage,
            published: Date.now(),
          },
          channels: [`${this.user.id}:${this.currentConversation.id}`, `${this.currentConversation.id}:${this.user.id}`]
        },
        this.$graffitiSession.value,
      );

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
      this.isLoading = false;

      await this.getAllUsers();
      console.log(this.allUsers);
      // console.log(this.allUsers);
      await this.getFriends();
      // this.isLoading = false;
      // unwatch();

    });
  },
  components: {
    Profile: defineAsyncComponent(Profile),
    Name: defineAsyncComponent(Name)
  }

})
  .use(GraffitiPlugin, {
    graffiti: new GraffitiRemote(),
    // graffiti: new GraffitiLocal(),
    autoLogin: true,
  }).directive('scroll-bottom', {
    // called after the bound element’s children have updated
    updated(el) {
      el.scrollTop = el.scrollHeight;
    }
  })
  .mount("#app");
