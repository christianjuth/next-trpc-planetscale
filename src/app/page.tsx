"use client";
import { useRouter } from "next/navigation";
import { api } from "~/utils/api";

const Page = () => {
  const router = useRouter();
  const user = api.users.getUser.useQuery(undefined, { retry: false });
  const logout = api.users.logout.useMutation();

  if (user.isError) {
    router.push("/auth");
  }

  if (logout.isSuccess) {
    user.refetch()
    .catch((err) => { console.log(err) })
  }

  return (
    <div className="mx-auto flex max-w-md flex-col">
      <textarea readOnly rows={8} value={JSON.stringify(user.data, null, 2)} />
      <button
        className="rounded-md bg-neutral-200 p-1"
        onClick={() => logout.mutate()}
      >
        Logout
      </button>
    </div>
  );
};

export default Page;
