import { ssrApi } from "~/utils/server-component-api";

async function Page() {
  const api = await ssrApi();
  const user = await api.users.getUser();

  return (
    <div className="mx-auto flex max-w-md flex-col">
      <textarea readOnly rows={8} value={JSON.stringify(user, null, 2)} />
    </div>
  );
}

export default Page;
