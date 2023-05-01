"use client";

import { useState } from "react";
import { api } from "~/utils/api";
import { useForm, Form, Input } from "~/components/Form";
import { TRPCClientError, type TRPCClientErrorLike } from "@trpc/client";
import { useRouter } from "next/navigation";

const HANDLED_ERRORS = new Map<TRPCClientErrorLike<any>, boolean>();

const Page = () => {
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"INIT" | "LOGIN" | "SIGNUP">("INIT");

  const showError = (err: any) => {
    if (typeof err === "string") {
      setError(err);
    } else if (err instanceof Error) {
      setError(err.message);
    } else if (err instanceof TRPCClientError) {
      setError(err.message);
    }
  };

  const form = useForm<{
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }>({
    onSubmit: (data) => {
      switch (state) {
        case "INIT":
          userExsists
            .refetch()
            .then((res) => {
              if (!res.data) {
                setState("SIGNUP");
              }
            })
            .catch(showError);
          break;
        case "LOGIN":
          login.mutate({
            email: data.email ?? "",
            password: data.password ?? "",
          });
          break;
        case "SIGNUP":
          register.mutate({
            email: data.email ?? "",
            password: data.password ?? "",
            first_name: data.first_name ?? "",
            last_name: data.last_name ?? "",
          });
          break;
      }
    },
  });

  const userExsists = api.users.exsists.useQuery(
    { email: form.data.email ?? "" },
    { enabled: false }
  );
  const login = api.users.login.useMutation({ retry: false });
  const register = api.users.register.useMutation();

  if (state === "INIT" && userExsists.data) {
    setState("LOGIN");
  }

  if (userExsists.error && !HANDLED_ERRORS.has(userExsists.error)) {
    HANDLED_ERRORS.set(userExsists.error, true);
    showError(userExsists.error);
  }
  if (login.error && !HANDLED_ERRORS.has(login.error)) {
    HANDLED_ERRORS.set(login.error, true);
    showError(login.error);
  }
  if (register.error && !HANDLED_ERRORS.has(register.error)) {
    HANDLED_ERRORS.set(register.error, true);
    showError(register.error);
  }

  const router = useRouter()
  if (register.isSuccess || login.isSuccess) {
    router.push('/')
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-800">
      <Form
        className="mx-auto flex max-w-md flex-col space-y-3 rounded-lg bg-white p-4"
        {...form}
      >
        <h1 className="text-2xl font-bold">Login</h1>
        <span className="text-red-500">{error}</span>
        <Input type="email" name="email" placeholder="jon@hbo.com" />
        {/* Login */}
        {state === "LOGIN" && <Input type="password" name="password" />}
        {/* Signup */}
        {state === "SIGNUP" && (
          <>
            <Input type="password" name="password" placeholder="Password" />
            <Input type="text" name="first_name" placeholder="Jon" />
            <Input type="text" name="last_name" placeholder="Doe" />
          </>
        )}
        <button type="submit">Login</button>
      </Form>
    </div>
  );
};

export default Page;
