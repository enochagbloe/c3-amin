import { FieldValues, FormProvider, Path, SubmitHandler, useForm } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import Link from "next/link";
import { Button } from "../ui/button";
import { z, ZodType } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constant/route";

interface AuthFormProps<T extends FieldValues> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ZodType<T> | any;
  defaultValues: T;
  formType: "SIGN_IN" | "SIGN_UP";
  onSubmit: (data: T) => Promise<ActionResponse | void>;
}

const AuthForms = <T extends FieldValues>({
  schema,
  defaultValues,
  formType,
  onSubmit,
}: AuthFormProps<T>) => {
  // define your form
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const router = useRouter();

  const handleSubmit: SubmitHandler<T> = async (data) => {
    const results = (await onSubmit(data)) as ActionResponse;
    if (results?.success) {
      // Handle successful submission
      toast.success(
        formType === "SIGN_IN"
          ? "Successfully signed in!"
          : "Successfully signed up!"
      );
      router.push(ROUTES.HOME);
    } else {
      // Handle errors
      toast.error(results?.error?.message || "An error occurred");
    }
  };

  const buttonText = formType === "SIGN_IN" ? "Sign In" : "Sign Up";
  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="mt-10 space-y-6"
      >
        {Object.keys(defaultValues).map((field) => (
          <FormField
            key={field}
            control={form.control}
            name={field as Path<T>}
            render={({ field }) => (
              <FormItem className="flex w-full flex-col gap-2.5">
                <FormLabel className="paragraph-medium text-dark400_light700">
                  {field.name === "email"
                    ? "Email Address"
                    : field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                </FormLabel>
                <FormControl>
                  <Input
                    required
                    type={field.name === "password" ? "password" : "text"}
                    {...field}
                    className="paragraph-regular background-light900_dark300 light-border-2 text-dark300_light700 no-focus min-h-12 rounded-1.5 border"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ))}

        <Button
          disabled={form.formState.isSubmitting}
          className="primary-gradient paragraph-medium min-h-12 w-full rounded-2 px-4 py-3 font-inter !text-light-900"
        >
          {form.formState.isSubmitting
            ? buttonText === "Sign In"
              ? "Signin In..."
              : "Signing Up..."
            : buttonText}
        </Button>

        {formType === "SIGN_IN" ? (
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href={ROUTES.SIGN_UP}
              className="paragraph-semibold primary-text-gradient"
            >
              Sign up
            </Link>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <Link
              href={ROUTES.SIGN_IN}
              className="paragraph-semibold primary-text-gradient"
            >
              Sign in
            </Link>
          </p>
        )}
      </form>
    </FormProvider>
  );
};

export default AuthForms;
