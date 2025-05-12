import { createApp } from "vue";
import { GraffitiLocal } from "@graffiti-garden/implementation-local";
import { createRouter, createWebHashHistory } from "vue-router";
import { GraffitiRemote } from "@graffiti-garden/implementation-remote";
import { defineAsyncComponent } from "vue";
import { GraffitiPlugin } from "@graffiti-garden/wrapper-vue";
import { Profile } from "./components/profile/profile.js";
import { Inbox } from "./components/inbox/inbox.js";
import { Name } from "./components/name/name.js";
import { Chat } from "./components/chat/chat.js";
import { APP_NAME } from "./consts.js";
import { deleteScheduled, getScheduled } from "./api/scheduled/scheduled_api.js";
import { wrapper } from "./utils.js";
import { sendMessage } from "./api/message/message_api.js";


function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}


const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/profile/:profileId",
      component: Profile,
      props: true,
    },
    {
      path: "/inbox",
      component: Inbox,
      children: [
        {
          path: ':id1/:id2',
          component: Chat,
          props: true
        }
      ]
    },
    {
      path: "/",
      redirect: "/inbox"
    }


  ],
});


createApp({
  data() {
    return {
      typewriterText: "Welcome to my chatroom! Log in to start.",
      isAnimating: false,
      appName: APP_NAME
    }
  },
  methods: {
    async login() {
      await this.$graffiti.login();
      this.$router.push("/inbox");
    },
    startTypewriter() {
      const typewriter = $$(".typewriter")[0];
      if (!typewriter || this.isAnimating) return;

      this.isAnimating = true;
      typewriter.innerHTML = '';

      let delay = 0, step = 50;
      for (const char of this.typewriterText) {
        delay += step;
        setTimeout(() => {
          typewriter.innerHTML += char;
          if (typewriter.innerHTML.length === this.typewriterText.length) {
            this.isAnimating = false;
          }
        }, delay);
      }
    }
  },

  mounted() {
    document.title = this.appName;

    this._schedulerPoller = setInterval(async () => {
      const scheduledMessages = await wrapper(this, getScheduled);
      scheduledMessages.forEach(async (msg) => {
        if (msg.time > Date.now()) return;
        await wrapper(this, sendMessage, {
          content: msg.content,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          published: msg.time
        });
        await wrapper(this, deleteScheduled, msg.url);
      });

    }, 1000);
  },

  watch: {
    '$graffitiSession.value': {
      immediate: true,
      handler(newValue) {
        if (!newValue) {
          this.$nextTick(() => {
            this.startTypewriter();
          });
        }
      }
    }
  },

  components: {
    Profile: defineAsyncComponent(Profile),
    Name: defineAsyncComponent(Name),
    Inbox: defineAsyncComponent(Inbox),
    Chat: defineAsyncComponent(Chat)
  }

})
  .use(GraffitiPlugin, {
    // graffiti: new GraffitiRemote(),
    graffiti: new GraffitiLocal(),
    autoLogin: true,
  }).directive('scroll-bottom', {
    mounted(el) {
      el.hasScolled = false;
    },
    updated(el) {
      if (!el.hasScrolled) {
        el.scrollTop = el.scrollHeight;
        el.hasScrolled = true;
      }
    }
  }).use(router)
  .mount("#app");
