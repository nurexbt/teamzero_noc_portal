import SignInForm from "@/components/auth/SignInForm";
import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Noc Portal TeamZero"
        description="Sign in to TeamZero Solutions Network Operations Center Portal"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
