export async function Name() {
    return {
        props: ["picture", "name", "content"],
        emits: ["click"],
        template: await fetch("./components/name/name.html")
            .then(r => r.text()),
        methods: {
            trim(content = "", maxLength) {
                if (content.length > maxLength) {
                    return content.substring(0, maxLength) + "...";
                }
                return content;
            },
        }
    }
}