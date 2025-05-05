import { getUserById, updateUser } from "../../user/user_api.js";
import { ANIMALS } from "../../consts.js";

export async function Profile() {
  return {
    data() {
      return {
        loading: true,
        user: null,
        form: {
          name: "",
          pronouns: [],
          pronounString: "",
          picture: "",
          bio: "",
        },
        showPicker: false,
        animals: ANIMALS,
      }
    },
    methods: {
      getHandle(actor) {
        if (actor.includes("id.inru")) {
          const split = actor.split("/");
          return split[split.length - 1];
        }
        return actor;
      },
      selectPicture(animal) {
        this.form.picture = animal;
        this.showPicker = false;
      },
      async submit() {

        this.form.pronouns = this.form.pronounString.split("/");

        this.form.pronouns = this.form.pronouns.map((pronoun) => pronoun.trim());
        const patchOps = [
          { op: "replace", path: "/name", value: this.form.name },
          { op: "replace", path: "/pronouns", value: this.form.pronouns },
          { op: "replace", path: "/picture", value: this.form.picture },
          { op: "replace", path: "/bio", value: this.form.bio },
        ];

        await updateUser(this.$graffiti, this.$graffitiSession, patchOps, this.user.url);
        this.toggle();
      },
      toggle() {
        this.$emit("toggle");
      }
    },
    props: ["profileId"],
    emits: ["toggle", "submit"],
    template: await fetch("./components/profile/profile.html")
      .then(r => r.text()),
    watch: {
      profileId: {
        immediate: true,
        async handler() {
          this.loading = true;
          const user = await getUserById(this.$graffiti, this.$graffitiSession, this.profileId);
          this.user = user;
          console.log(user);
          this.loading = false;
          this.form.name = user.name;
          this.form.pronouns = user.pronouns;
          console.log(user.pronouns);
          this.form.pronounString = user.pronouns.join("/");
          this.form.picture = user.picture;
          this.form.bio = user.bio ?? "";
        }
      }
    }
  }
}