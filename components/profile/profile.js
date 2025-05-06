import { getUserById, updateUser } from "../../user/user_api.js";
import { ANIMALS } from "../../consts.js";
import { trim } from "../../utils.js";

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
        edit: false,
      }
    },
    methods: {
      resetForm() {
        this.form.name = this.user.name;
        this.form.pronouns = this.user.pronouns;
        this.form.pronounString = this.user.pronouns.join("/");
        this.form.picture = this.user.picture;
        this.form.bio = this.user.bio ?? "";
      },
      getHandle(actor) {
        if (actor.includes("id.inru")) {
          const split = actor.split("/");
          return split[split.length - 1];
        }
        return actor;
      },
      cancel() {
        this.resetForm();
        this.edit = false;
      },
      getPronouns() {
        return "(" + trim(this.user.pronouns.join('/'), 50) + ")";
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

        this.loading = true;
        await updateUser(this.$graffiti, this.$graffitiSession, patchOps, this.user.url);
        await this.updateUser();
        this.$emit("submit");
        this.edit = false;
        this.loading = false;
      },
      async updateUser() {
        const user = await getUserById(this.$graffiti, this.$graffitiSession, this.profileId);
        this.user = user;
        this.resetForm();
      },
    },
    props: ["profileId"],
    emits: ["submit"],
    template: await fetch("./components/profile/profile.html")
      .then(r => r.text()),
    watch: {
      profileId: {
        immediate: true,
        async handler() {
          this.loading = true;
          await this.updateUser();
          this.loading = false;
        }
      }
    }
  }
}