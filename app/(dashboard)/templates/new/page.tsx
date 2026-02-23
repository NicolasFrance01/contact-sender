import dynamic from "next/dynamic";

const NewTemplateClient = dynamic(() => import("./NewTemplateClient"), { ssr: false });

export default function NewTemplatePage() {
    return <NewTemplateClient />;
}
