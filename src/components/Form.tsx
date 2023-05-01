import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

const Context = createContext<{
  data?: Record<string, unknown>;
  set?: (key: string, val: unknown) => void;
  remove?: (key: string) => void;
}>({});

export const useForm = <Data extends Record<string, unknown>>(config: {
  onSubmit: (data: Partial<Data>) => void;
}) => {
  const [data, setData] = useState<Partial<Data>>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    config.onSubmit(data);
  };

  const actions = useMemo(
    () => ({
      set: (key: keyof Data, val: Data[typeof key]) =>
        setData((prev) => ({ ...prev, [key]: val })),
      remove: (key: keyof Data) =>
        setData((prev) => {
          const { [key]: _, ...rest } = prev;
          return rest as Partial<Data>;
        }),
    }),
    []
  );

  return {
    handleSubmit,
    data,
    ...actions,
  };
};

const useFormCtx = () => {
  return useContext(Context);
};

export function Form<Data extends Record<string, unknown>>({
  className,
  children,
  data,
  set,
  remove,
  handleSubmit,
}: {
  className?: string;
  children: React.ReactNode | React.ReactNode[];
  data: Data;
  set: (key: keyof Data, val: NonNullable<Data[typeof key]>) => void;
  remove: (key: keyof Data) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Context.Provider
      value={{
        data,
        set: set as (key: string, val: unknown) => void,
        remove,
      }}
    >
      <form onSubmit={handleSubmit} className={className}>
        {children}
      </form>
    </Context.Provider>
  );
}

export function Input(
  props: Omit<JSX.IntrinsicElements["input"], "value" | "onChange">
) {
  const { set, remove } = useFormCtx();

  useEffect(() => {
    const name = props.name;
    if (name) {
      set?.(name, props.defaultValue);
      return () => remove?.(name);
    }
  }, [set, remove, props.name, props.defaultValue]);

  return (
    <input
      {...props}
      className="border p-2 rounded-md"
      onChange={(e) => {
        if (props.name) {
          set?.(props.name, e.target.value);
        }
      }}
    />
  );
}
