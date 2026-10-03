import { SignInForm } from "./signin-form";

export default function SignInPage() {
  return <SignInForm google={Boolean(process.env.AUTH_GOOGLE_ID)} github={Boolean(process.env.AUTH_GITHUB_ID)} />;
}
