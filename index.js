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


  ],
});


createApp({
  data() {
    return {
      typewriterText: "Welcome to my chatroom! Log in to start.",
      isAnimating: false
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
    graffiti: new GraffitiRemote(),
    // graffiti: new GraffitiLocal(),
    autoLogin: true,
  }).directive('scroll-bottom', {
    // called after the bound element’s children have updated
    updated(el) {
      el.scrollTop = el.scrollHeight;
    }
  }).use(router)
  .mount("#app");
